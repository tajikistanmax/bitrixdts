import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { AttendanceSource } from '@prisma/client';

export interface CheckInData {
  employeeId: string;
  organizationId: string;
  source?: AttendanceSource;
}

export interface CheckOutData {
  employeeId: string;
  organizationId: string;
}

export interface AttendanceFilters {
  employeeId?: string;
  departmentId?: string;
  dateFrom?: string;
  dateTo?: string;
  status?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  checkIn: Date | null;
  checkOut: Date | null;
  source: string;
  date: Date;
  organizationId: string;
  createdAt: Date;
  employee?: any;
  department?: any;
}

export class AttendanceService {
  async checkIn(data: CheckInData, userId: string) {
    const { employeeId, organizationId, source = 'manual' } = data;

    // Проверить, существует ли сотрудник
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      // department removed - use departmentId,
    });

    if (!employee) {
      throw new AppError('Сотрудник не найден', 404);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Проверить, не отмечался ли уже сегодня
    const existing = await prisma.attendance.findFirst({
      where: {
        employeeId,
        date: { gte: today },
      },
    });

    if (existing && existing.checkIn) {
      throw new AppError('Вы уже отметили приход сегодня', 400);
    }

    // Создать или обновить запись о приходе
    let attendance;
    if (existing) {
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          checkIn: new Date(),
          source,
        },
      });
    } else {
      attendance = await prisma.attendance.create({
        data: {
          employeeId,
          organizationId,
          checkIn: new Date(),
          source,
          date: today,
        },
      });
    }

    return this.mapAttendance(attendance, employee);
  }

  async checkOut(data: CheckOutData) {
    const { employeeId, organizationId } = data;

    // Найти сегодняшнюю запись
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await prisma.attendance.findFirst({
      where: {
        employeeId,
        organizationId,
        date: { gte: today },
      },
      include: {
        employee: {
          // department removed - use departmentId,
        },
      },
    });

    if (!attendance) {
      throw new AppError('Вы не отмечали приход сегодня', 400);
    }

    if (attendance.checkOut) {
      throw new AppError('Вы уже отметили уход сегодня', 400);
    }

    // Обновить запись
    const updated = await prisma.attendance.update({
      where: { id: attendance.id },
      data: { checkOut: new Date() },
      include: {
        employee: {
          // department removed - use departmentId,
        },
      },
    });

    return this.mapAttendance(updated, updated.employee);
  }

  async findAll(
    organizationId: string,
    filters: AttendanceFilters
  ): Promise<{ data: AttendanceRecord[]; total: number; page: number; totalPages: number }> {
    const {
      employeeId,
      departmentId,
      dateFrom,
      dateTo,
      status,
      page = 1,
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Построить условия фильтрации
    const where: any = {
      organizationId,
    };

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

    if (dateFrom) {
      where.date = { ...where.date, gte: new Date(dateFrom) };
    }

    if (dateTo) {
      where.date = { ...where.date, lte: new Date(dateTo) };
    }

    if (status) {
      // Статусы: present (чек-ин без чекаута), left (чек-ин и чек-ут), late (опоздание)
      if (status === 'present') {
        where.checkIn = { not: null };
        where.checkOut = null;
      } else if (status === 'left') {
        where.checkIn = { not: null };
        where.checkOut = { not: null };
      } else if (status === 'absent') {
        where.checkIn = null;
      }
    }

    // Получить общее количество
    const total = await prisma.attendance.count({ where });

    // Получить данные
    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: true,
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: records.map(r => this.mapAttendance(r, r.employee)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string): Promise<AttendanceRecord> {
    const record = await prisma.attendance.findFirst({
      where: { id, organizationId },
      include: {
        employee: true,
      },
    });

    if (!record) {
      throw new AppError('Запись посещаемости не найдена', 404);
    }

    return this.mapAttendance(record, record.employee);
  }

  async getTodayAttendance(organizationId: string, departmentId?: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      organizationId,
      date: { gte: today },
    };

    if (departmentId) {
      const departmentEmployees = await prisma.employee.findMany({
        where: { departmentId, organizationId },
        select: { id: true },
      });

      const employeeIds = departmentEmployees.map(e => e.id);
      where.employeeId = { in: employeeIds };
    }

    const records = await prisma.attendance.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            avatarUrl: true,
            },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return records.map(r => this.mapAttendance(r, r.employee));
  }

  async getStatistics(organizationId: string, dateFrom: string, dateTo: string) {
    const records = await prisma.attendance.findMany({
      where: {
        organizationId,
        date: {
          gte: new Date(dateFrom),
          lte: new Date(dateTo),
        },
      },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            },
        },
      },
    });

    const totalRecords = records.length;
    const checkedIn = records.filter(r => r.checkIn).length;
    const checkedOut = records.filter(r => r.checkOut).length;
    const absent = records.filter(r => !r.checkIn).length;

    // Подсчитать опоздания (приход после 9:00)
    const lateArrivals = records.filter(r => {
      if (!r.checkIn) return false;
      const checkInHour = new Date(r.checkIn).getHours();
      return checkInHour > 9;
    }).length;

    // Подсчитать переработки (более 8 часов)
    const overtime = records.filter(r => {
      if (!r.checkIn || !r.checkOut) return false;
      const hours = (new Date(r.checkOut).getTime() - new Date(r.checkIn).getTime()) / (1000 * 60 * 60);
      return hours > 8;
    }).length;

    return {
      totalRecords,
      checkedIn,
      checkedOut,
      absent,
      lateArrivals,
      overtime,
      attendanceRate: totalRecords > 0 ? Math.round((checkedIn / totalRecords) * 100) : 0,
    };
  }

  private mapAttendance(record: any, employee: any): AttendanceRecord {
    return {
      id: record.id,
      employeeId: record.employeeId,
      checkIn: record.checkIn,
      checkOut: record.checkOut,
      source: record.source,
      date: record.date,
      organizationId: record.organizationId,
      createdAt: record.createdAt,
      employee,
    };
  }
}

export default new AttendanceService();
