import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { VacationStatus, EmployeeStatus } from '@prisma/client';

export interface CreateVacationRequest {
  employeeId: string;
  type: 'annual' | 'unpaid' | 'study';
  startDate: string;
  endDate: string;
  organizationId: string;
  comments?: string;
}

export interface VacationFilters {
  employeeId?: string;
  departmentId?: string;
  type?: string;
  status?: string;
  year?: number;
  page?: number;
  limit?: number;
}

export interface VacationRequestWithRelations {
  id: string;
  employeeId: string;
  type: string;
  startDate: Date;
  endDate: Date;
  status: string;
  approverId: string | null;
  comments: string | null;
  organizationId: string;
  createdAt: Date;
  employee?: any;
  approver?: any;
}

export class VacationsService {
  async create(data: CreateVacationRequest) {
    const { employeeId, organizationId, startDate, endDate } = data;

    // Проверить сотрудника
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      // department removed - use departmentId,
    });

    if (!employee) {
      throw new AppError('Сотрудник не найден', 404);
    }

    // Проверить даты
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start > end) {
      throw new AppError('Дата начала не может быть позже даты окончания', 400);
    }

    // Проверить, нет ли пересечений с другими отпусками
    const overlapping = await prisma.vacationRequest.findFirst({
      where: {
        employeeId,
        status: { in: [VacationStatus.planned, VacationStatus.approved] },
        OR: [
          {
            startDate: { lte: end },
            endDate: { gte: start },
          },
        ],
      },
    });

    if (overlapping) {
      throw new AppError('Пересечение с существующим отпуском', 400);
    }

    // Рассчитать количество дней
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

    // Создать заявку
    const request = await prisma.vacationRequest.create({
      data: {
        employeeId,
        organizationId,
        type: data.type,
        startDate: start,
        endDate: end,
        status: VacationStatus.planned,
        comments: data.comments,
      },
      include: {
        employee: true,
      },
    });

    return this.mapVacation(request);
  }

  async findAll(
    organizationId: string,
    filters: VacationFilters
  ): Promise<{ data: VacationRequestWithRelations[]; total: number; page: number; totalPages: number }> {
    const {
      employeeId,
      departmentId,
      type,
      status,
      year,
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;

    // Построить условия фильтрации
    const where: any = { organizationId };

    if (employeeId) {
      where.employeeId = employeeId;
    }

    if (departmentId) {
      const departmentEmployees = await prisma.employee.findMany({
        where: { departmentId, organizationId },
        select: { id: true },
      });

      const employeeIds = departmentEmployees.map(e => e.id);
      where.employeeId = { in: employeeIds };
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    }

    if (year) {
      where.startDate = {
        gte: new Date(year, 0, 1),
        lte: new Date(year, 11, 31),
      };
    }

    // Получить общее количество
    const total = await prisma.vacationRequest.count({ where });

    // Получить данные
    const requests = await prisma.vacationRequest.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });

    return {
      data: requests.map(r => this.mapVacation(r)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string): Promise<VacationRequestWithRelations> {
    const request = await prisma.vacationRequest.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            },
        },
        approver: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!request) {
      throw new AppError('Заявка на отпуск не найдена', 404);
    }

    return this.mapVacation(request);
  }

  async approve(id: string, organizationId: string, approverId: string) {
    const request = await prisma.vacationRequest.findFirst({
      where: { id, organizationId },
      include: { employee: true },
    });

    if (!request) {
      throw new AppError('Заявка не найдена', 404);
    }

    if (request.status !== VacationStatus.planned) {
      throw new AppError(`Заявка уже имеет статус ${request.status}`, 400);
    }

    // Обновить статус сотрудника на время отпуска
    await prisma.employee.update({
      where: { id: request.employeeId },
      data: { status: EmployeeStatus.on_leave },
    });

    const updated = await prisma.vacationRequest.update({
      where: { id },
      data: {
        status: VacationStatus.approved,
        approverId,
      },
      include: {
        employee: true,
        approver: true,
      },
    });

    return this.mapVacation(updated);
  }

  async reject(id: string, organizationId: string, approverId: string) {
    const request = await prisma.vacationRequest.findFirst({
      where: { id, organizationId },
    });

    if (!request) {
      throw new AppError('Заявка не найдена', 404);
    }

    if (request.status !== VacationStatus.planned) {
      throw new AppError(`Заявка уже имеет статус ${request.status}`, 400);
    }

    const updated = await prisma.vacationRequest.update({
      where: { id },
      data: {
        status: VacationStatus.rejected,
        approverId,
      },
      include: {
        employee: true,
        approver: true,
      },
    });

    return this.mapVacation(updated);
  }

  async getVacationBalance(employeeId: string, organizationId: string, year: number) {
    // Получить все одобренные отпуска за год
    const vacations = await prisma.vacationRequest.findMany({
      where: {
        employeeId,
        organizationId,
        startDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
        status: 'approved',
      },
    });

    // Рассчитать использованные дни
    let usedDays = 0;
    for (const vacation of vacations) {
      const start = new Date(vacation.startDate);
      const end = new Date(vacation.endDate);
      usedDays += Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    // Стандартный отпуск 28 дней (можно сделать configurable)
    const totalDays = 28;
    const remainingDays = totalDays - usedDays;

    return {
      totalDays,
      usedDays,
      remainingDays,
      year,
    };
  }

  async getUpcomingVacations(organizationId: string, daysAhead: number = 30) {
    const today = new Date();
    const future = new Date();
    future.setDate(today.getDate() + daysAhead);

    const vacations = await prisma.vacationRequest.findMany({
      where: {
        organizationId,
        startDate: {
          gte: today,
          lte: future,
        },
        status: 'approved',
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            },
        },
      },
      orderBy: { startDate: 'asc' },
    });

    return vacations.map(v => this.mapVacation(v));
  }

  private mapVacation(request: any): VacationRequestWithRelations {
    return {
      id: request.id,
      employeeId: request.employeeId,
      type: request.type,
      startDate: request.startDate,
      endDate: request.endDate,
      status: request.status,
      approverId: request.approverId,
      comments: request.comments,
      organizationId: request.organizationId,
      createdAt: request.createdAt,
      employee: request.employee,
      approver: request.approver,
    };
  }
}

export default new VacationsService();
