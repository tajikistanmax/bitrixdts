import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { PayrollStatus, PayrollEntryType, Prisma } from '@prisma/client';

export interface CreatePayrollData {
  organizationId: string;
  period: string; // ISO date (first day of month: 2024-01-01)
}

export interface AddPayrollEntryData {
  payrollId: string;
  employeeId: string;
  type: PayrollEntryType;
  description?: string;
  amount: number;
  hoursWorked?: number;
  rate?: number;
}

export interface PayrollFilters {
  status?: PayrollStatus;
  year?: number;
  page?: number;
  limit?: number;
}

export class PayrollService {
  // ─── Создать ведомость за период ──────────────────────────────────────
  async createPayroll(data: CreatePayrollData) {
    const { organizationId, period } = data;

    const periodDate = new Date(period);
    // Нормализуем к 1-му числу месяца
    periodDate.setDate(1);

    // Проверить дубликат
    const existing = await prisma.payroll.findFirst({
      where: { organizationId, period: periodDate },
    });

    if (existing) {
      throw new AppError('Ведомость за этот период уже существует', 400);
    }

    const payroll = await prisma.payroll.create({
      data: {
        organizationId,
        period: periodDate,
        status: 'draft',
      },
    });

    return payroll;
  }

  // ─── Автозаполнение ведомости по штатному расписанию ──────────────────
  async autoFillFromStaff(payrollId: string, organizationId: string) {
    const payroll = await prisma.payroll.findFirst({
      where: { id: payrollId, organizationId },
    });

    if (!payroll) throw new AppError('Ведомость не найдена', 404);
    if (payroll.status !== 'draft') throw new AppError('Ведомость уже рассчитана', 400);

    // Получить все активные назначения
    const assignments = await prisma.staffAssignment.findMany({
      where: {
        isActive: true,
        position: { organizationId },
        startDate: { lte: payroll.period },
        OR: [
          { endDate: null },
          { endDate: { gte: payroll.period } },
        ],
      },
      include: {
        employee: { select: { id: true, fullName: true } },
      },
    });

    if (assignments.length === 0) {
      throw new AppError('Нет активных назначений для начисления', 400);
    }

    // Удалить старые записи типа salary (если были)
    await prisma.payrollEntry.deleteMany({
      where: { payrollId, type: 'salary' },
    });

    // Создать записи оклада для каждого сотрудника
    const entries = assignments.map(assignment => ({
      payrollId,
      employeeId: assignment.employeeId,
      type: 'salary' as PayrollEntryType,
      description: `Оклад за ${payroll.period.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })}`,
      amount: new Prisma.Decimal(Number(assignment.salary) * Number(assignment.rate)),
    }));

    await prisma.payrollEntry.createMany({ data: entries });

    return this.getPayrollById(payrollId, organizationId);
  }

  // ─── Добавить запись (премия, удержание и т.д.) ───────────────────────
  async addEntry(data: AddPayrollEntryData) {
    const payroll = await prisma.payroll.findUnique({
      where: { id: data.payrollId },
    });

    if (!payroll) throw new AppError('Ведомость не найдена', 404);
    if (payroll.status !== 'draft') throw new AppError('Ведомость уже утверждена', 400);

    // Проверить сотрудника
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId: payroll.organizationId },
    });
    if (!employee) throw new AppError('Сотрудник не найден', 404);

    const entry = await prisma.payrollEntry.create({
      data: {
        payrollId: data.payrollId,
        employeeId: data.employeeId,
        type: data.type,
        description: data.description,
        amount: data.amount,
        hoursWorked: data.hoursWorked,
        rate: data.rate,
      },
      include: {
        employee: { select: { id: true, fullName: true } },
      },
    });

    return entry;
  }

  // ─── Рассчитать ведомость ─────────────────────────────────────────────
  async calculate(payrollId: string, organizationId: string) {
    const payroll = await prisma.payroll.findFirst({
      where: { id: payrollId, organizationId },
      include: { entries: true },
    });

    if (!payroll) throw new AppError('Ведомость не найдена', 404);
    if (payroll.status !== 'draft') throw new AppError('Ведомость уже рассчитана', 400);

    // Рассчитать итоги
    let totalGross = new Prisma.Decimal(0);
    let totalDeductions = new Prisma.Decimal(0);

    for (const entry of payroll.entries) {
      const amount = new Prisma.Decimal(Number(entry.amount));
      if (['deduction', 'tax', 'pension'].includes(entry.type)) {
        totalDeductions = totalDeductions.add(amount);
      } else {
        totalGross = totalGross.add(amount);
      }
    }

    const totalNet = totalGross.sub(totalDeductions);

    const updated = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: 'calculated',
        totalGross,
        totalDeductions,
        totalNet,
      },
    });

    return updated;
  }

  // ─── Утвердить ведомость ──────────────────────────────────────────────
  async approve(payrollId: string, organizationId: string, approverId: string) {
    const payroll = await prisma.payroll.findFirst({
      where: { id: payrollId, organizationId },
    });

    if (!payroll) throw new AppError('Ведомость не найдена', 404);
    if (payroll.status !== 'calculated') throw new AppError('Сначала нужно рассчитать ведомость', 400);

    const updated = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: 'approved',
        approvedById: approverId,
        approvedAt: new Date(),
      },
    });

    return updated;
  }

  // ─── Отметить как выплаченную ─────────────────────────────────────────
  async markPaid(payrollId: string, organizationId: string) {
    const payroll = await prisma.payroll.findFirst({
      where: { id: payrollId, organizationId },
    });

    if (!payroll) throw new AppError('Ведомость не найдена', 404);
    if (payroll.status !== 'approved') throw new AppError('Сначала нужно утвердить ведомость', 400);

    const updated = await prisma.payroll.update({
      where: { id: payrollId },
      data: {
        status: 'paid',
        paidAt: new Date(),
      },
    });

    return updated;
  }

  // ─── Получить все ведомости ───────────────────────────────────────────
  async findAll(organizationId: string, filters: PayrollFilters) {
    const { status, year, page = 1, limit = 12 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (status) where.status = status;
    if (year) {
      where.period = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      };
    }

    const [payrolls, total] = await Promise.all([
      prisma.payroll.findMany({
        where,
        orderBy: { period: 'desc' },
        skip,
        take: limit,
      }),
      prisma.payroll.count({ where }),
    ]);

    return { data: payrolls, total, page, totalPages: Math.ceil(total / limit) };
  }

  // ─── Получить одну ведомость с записями ───────────────────────────────
  async getPayrollById(payrollId: string, organizationId: string) {
    const payroll = await prisma.payroll.findFirst({
      where: { id: payrollId, organizationId },
      include: {
        entries: {
          include: {
            employee: {
              select: { id: true, fullName: true, position: true },
            },
          },
          orderBy: [{ type: 'asc' }, { employeeId: 'asc' }],
        },
      },
    });

    if (!payroll) throw new AppError('Ведомость не найдена', 404);
    return payroll;
  }

  // ─── Зарплатная ведомость сотрудника ──────────────────────────────────
  async getEmployeePayslips(employeeId: string, organizationId: string, year?: number) {
    const where: any = {
      employeeId,
      payroll: { organizationId },
    };

    if (year) {
      where.payroll = {
        ...where.payroll,
        period: { gte: new Date(year, 0, 1), lte: new Date(year, 11, 31) },
      };
    }

    const entries = await prisma.payrollEntry.findMany({
      where,
      include: {
        payroll: {
          select: { id: true, period: true, status: true },
        },
      },
      orderBy: { payroll: { period: 'desc' } },
    });

    // Группировать по ведомости
    const grouped = new Map<string, { payroll: any; entries: typeof entries }>();
    for (const entry of entries) {
      const key = entry.payrollId;
      if (!grouped.has(key)) {
        grouped.set(key, { payroll: entry.payroll, entries: [] });
      }
      grouped.get(key)!.entries.push(entry);
    }

    return Array.from(grouped.values()).map(({ payroll, entries }) => {
      const gross = entries
        .filter(e => !['deduction', 'tax', 'pension'].includes(e.type))
        .reduce((sum, e) => sum + Number(e.amount), 0);
      const deductions = entries
        .filter(e => ['deduction', 'tax', 'pension'].includes(e.type))
        .reduce((sum, e) => sum + Number(e.amount), 0);

      return {
        payrollId: payroll.id,
        period: payroll.period,
        status: payroll.status,
        gross,
        deductions,
        net: gross - deductions,
        entries,
      };
    });
  }

  // ─── Удалить запись ───────────────────────────────────────────────────
  async removeEntry(entryId: string, payrollId: string) {
    const payroll = await prisma.payroll.findUnique({ where: { id: payrollId } });
    if (!payroll) throw new AppError('Ведомость не найдена', 404);
    if (payroll.status !== 'draft') throw new AppError('Нельзя редактировать утверждённую ведомость', 400);

    await prisma.payrollEntry.delete({ where: { id: entryId } });
    return { success: true };
  }
}

export default new PayrollService();
