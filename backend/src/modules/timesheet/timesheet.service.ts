import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface CreateTimesheetData {
  employeeId: string;
  periodMonth: string;
  data: {
    day: number;
    type: 'work' | 'vacation' | 'sick' | 'trip' | 'absence' | 'weekend';
    hours?: number;
    comment?: string;
  }[];
  organizationId: string;
}

export interface TimesheetFilters {
  employeeId?: string;
  departmentId?: string;
  periodMonth?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface TimesheetWithRelations {
  id: string;
  employeeId: string;
  periodMonth: Date;
  data: any;
  status: string;
  approvedById: string | null;
  approvedAt: Date | null;
  organizationId: string;
  createdAt: Date;
  employee?: any;
  approvedBy?: any;
}

export class TimesheetService {
  async create(data: CreateTimesheetData) {
    const { employeeId, organizationId, periodMonth } = data;

    // Проверить сотрудника
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      // department removed - use departmentId,
    });

    if (!employee) {
      throw new AppError('Сотрудник не найден', 404);
    }

    // Проверить, не существует ли уже табель
    const existing = await prisma.timesheet.findFirst({
      where: {
        employeeId,
        organizationId,
        periodMonth: new Date(periodMonth),
      },
    });

    if (existing) {
      throw new AppError('Табель за этот период уже создан', 400);
    }

    // Создать табель
    const timesheet = await prisma.timesheet.create({
      data: {
        employeeId,
        organizationId,
        periodMonth: new Date(periodMonth),
        data: JSON.stringify(data.data),
        status: 'draft',
      },
      include: {
        employee: true,
      },
    });

    return this.mapTimesheet(timesheet);
  }

  async generateFromAttendance(employeeId: string, periodMonth: string, organizationId: string) {
    const monthStart = new Date(periodMonth);
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    monthEnd.setDate(0);

    // Получить записи посещаемости за месяц
    const records = await prisma.attendance.findMany({
      where: {
        employeeId,
        organizationId,
        date: {
          gte: monthStart,
          lte: monthEnd,
        },
      },
    });

    // Сформировать данные табеля
    const daysInMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 0).getDate();
    const data = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(monthStart.getFullYear(), monthStart.getMonth(), day);
      const dayOfWeek = date.getDay(); // 0 = воскресенье, 6 = суббота

      const record = records.find(r => 
        r.date.getFullYear() === date.getFullYear() &&
        r.date.getMonth() === date.getMonth() &&
        r.date.getDate() === day
      );

      let type = 'work';
      let hours = 8;

      if (dayOfWeek === 0 || dayOfWeek === 6) {
        type = 'weekend';
        hours = 0;
      } else if (record) {
        if (!record.checkIn) {
          type = 'absence';
          hours = 0;
        } else if (record.checkOut) {
          const workHours = (new Date(record.checkOut).getTime() - new Date(record.checkIn).getTime()) / (1000 * 60 * 60);
          hours = Math.round(workHours * 100) / 100;
        } else {
          type = 'present';
          hours = 8;
        }
      } else {
        type = 'absence';
        hours = 0;
      }

      data.push({ day, type, hours });
    }

    return data;
  }

  async findAll(
    organizationId: string,
    filters: TimesheetFilters
  ): Promise<{ data: TimesheetWithRelations[]; total: number; page: number; totalPages: number }> {
    const {
      employeeId,
      departmentId,
      periodMonth,
      status,
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

    if (periodMonth) {
      const [year, month] = periodMonth.split('-');
      where.periodMonth = {
        gte: new Date(parseInt(year), parseInt(month) - 1, 1),
        lte: new Date(parseInt(year), parseInt(month), 0),
      };
    }

    if (status) {
      where.status = status;
    }

    // Получить общее количество
    const total = await prisma.timesheet.count({ where });

    // Получить данные
    const timesheets = await prisma.timesheet.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
      skip,
      take: limit,
    });

    return {
      data: timesheets.map(t => this.mapTimesheet(t)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string): Promise<TimesheetWithRelations> {
    const timesheet = await prisma.timesheet.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            },
        },
        approvedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!timesheet) {
      throw new AppError('Табель не найден', 404);
    }

    return this.mapTimesheet(timesheet);
  }

  async update(id: string, organizationId: string, data: any) {
    const existing = await prisma.timesheet.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Табель не найден', 404);
    }

    if (existing.status === 'approved') {
      throw new AppError('Утверждённый табель нельзя редактировать', 400);
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        ...data,
        data: data.data ? JSON.stringify(data.data) : undefined,
      },
      include: {
        employee: true,
      },
    });

    return this.mapTimesheet(updated);
  }

  async approve(id: string, organizationId: string, approverId: string) {
    const existing = await prisma.timesheet.findFirst({
      where: { id, organizationId },
      include: { employee: true },
    });

    if (!existing) {
      throw new AppError('Табель не найден', 404);
    }

    if (existing.status === 'approved') {
      throw new AppError('Табель уже утверждён', 400);
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'approved',
        approvedById: approverId,
        approvedAt: new Date(),
      },
      include: {
        employee: true,
        approvedBy: true,
      },
    });

    return this.mapTimesheet(updated);
  }

  async reject(id: string, organizationId: string, approverId: string, comment?: string) {
    const existing = await prisma.timesheet.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Табель не найден', 404);
    }

    const updated = await prisma.timesheet.update({
      where: { id },
      data: {
        status: 'rejected',
        approvedById: approverId,
        approvedAt: new Date(),
      },
      include: {
        employee: true,
        approvedBy: true,
      },
    });

    return this.mapTimesheet(updated);
  }

  async getMonthStats(employeeId: string, periodMonth: string, organizationId: string) {
    const timesheet = await prisma.timesheet.findFirst({
      where: {
        employeeId,
        organizationId,
        periodMonth: new Date(periodMonth),
      },
    });

    if (!timesheet) {
      return null;
    }

    const data = typeof timesheet.data === 'string' ? JSON.parse(timesheet.data) : timesheet.data;

    const workDays = data.filter((d: any) => d.type === 'work').length;
    const vacationDays = data.filter((d: any) => d.type === 'vacation').length;
    const sickDays = data.filter((d: any) => d.type === 'sick').length;
    const tripDays = data.filter((d: any) => d.type === 'trip').length;
    const absentDays = data.filter((d: any) => d.type === 'absence').length;
    const totalHours = data.reduce((sum: number, d: any) => sum + (d.hours || 0), 0);

    return {
      workDays,
      vacationDays,
      sickDays,
      tripDays,
      absentDays,
      totalHours,
      status: timesheet.status,
    };
  }

  private mapTimesheet(timesheet: any): TimesheetWithRelations {
    return {
      id: timesheet.id,
      employeeId: timesheet.employeeId,
      periodMonth: timesheet.periodMonth,
      data: timesheet.data,
      status: timesheet.status,
      approvedById: timesheet.approvedById,
      approvedAt: timesheet.approvedAt,
      organizationId: timesheet.organizationId,
      createdAt: timesheet.createdAt,
      employee: timesheet.employee,
      approvedBy: timesheet.approvedBy,
    };
  }
}

export default new TimesheetService();
