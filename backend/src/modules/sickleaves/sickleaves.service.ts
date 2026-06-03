import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { SickLeaveStatus, EmployeeStatus } from '@prisma/client';

export interface CreateSickLeaveRequest {
  employeeId: string;
  documentNumber: string;
  issueDate: string;
  startDate: string;
  endDate?: string;
  documentUrl?: string;
  organizationId: string;
}

export interface SickLeaveFilters {
  employeeId?: string;
  departmentId?: string;
  status?: string;
  year?: number;
  page?: number;
  limit?: number;
}

export interface SickLeaveWithRelations {
  id: string;
  employeeId: string;
  documentNumber: string;
  issueDate: Date;
  startDate: Date;
  endDate: Date | null;
  status: string;
  documentUrl: string | null;
  verifiedById: string | null;
  organizationId: string;
  createdAt: Date;
  employee?: any;
  verifiedBy?: any;
}

export class SickLeavesService {
  async create(data: CreateSickLeaveRequest) {
    const { employeeId, organizationId, startDate } = data;

    // Проверить сотрудника
    const employee = await prisma.employee.findFirst({
      where: { id: employeeId, organizationId },
      // department removed - use departmentId,
    });

    if (!employee) {
      throw new AppError('Сотрудник не найден', 404);
    }

    // Создать запись
    const sickLeave = await prisma.sickLeave.create({
      data: {
        employeeId,
        organizationId,
        documentNumber: data.documentNumber,
        issueDate: new Date(data.issueDate),
        startDate: new Date(startDate),
        endDate: data.endDate ? new Date(data.endDate) : null,
        documentUrl: data.documentUrl,
        status: SickLeaveStatus.open,
      },
      include: {
        employee: true,
      },
    });

    // Обновить статус сотрудника
    await prisma.employee.update({
      where: { id: employeeId },
      data: { status: EmployeeStatus.on_leave },
    });

    return this.mapSickLeave(sickLeave);
  }

  async findAll(
    organizationId: string,
    filters: SickLeaveFilters
  ): Promise<{ data: SickLeaveWithRelations[]; total: number; page: number; totalPages: number }> {
    const {
      employeeId,
      departmentId,
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
    const total = await prisma.sickLeave.count({ where });

    // Получить данные
    const sickLeaves = await prisma.sickLeave.findMany({
      where,
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            },
        },
        verifiedBy: {
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
      data: sickLeaves.map(sl => this.mapSickLeave(sl)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string): Promise<SickLeaveWithRelations> {
    const sickLeave = await prisma.sickLeave.findFirst({
      where: { id, organizationId },
      include: {
        employee: {
          select: {
            id: true,
            fullName: true,
            position: true,
            },
        },
        verifiedBy: {
          select: {
            id: true,
            fullName: true,
          },
        },
      },
    });

    if (!sickLeave) {
      throw new AppError('Больничный лист не найден', 404);
    }

    return this.mapSickLeave(sickLeave);
  }

  async verify(id: string, organizationId: string, verifiedById: string) {
    const sickLeave = await prisma.sickLeave.findFirst({
      where: { id, organizationId },
      include: { employee: true },
    });

    if (!sickLeave) {
      throw new AppError('Больничный лист не найден', 404);
    }

    if (sickLeave.status !== SickLeaveStatus.open) {
      throw new AppError(`Больничный уже имеет статус ${sickLeave.status}`, 400);
    }

    const updated = await prisma.sickLeave.update({
      where: { id },
      data: {
        status: 'verified',
        verifiedById,
        verifiedAt: new Date(),
      },
      include: {
        employee: true,
        verifiedBy: true,
      },
    });

    return this.mapSickLeave(updated);
  }

  async close(id: string, organizationId: string, endDate: string) {
    const sickLeave = await prisma.sickLeave.findFirst({
      where: { id, organizationId },
      include: { employee: true },
    });

    if (!sickLeave) {
      throw new AppError('Больничный лист не найден', 404);
    }

    if (sickLeave.status !== 'verified') {
      throw new AppError(`Больничный имеет статус ${sickLeave.status}, нельзя закрыть`, 400);
    }

    const end = new Date(endDate);

    const updated = await prisma.sickLeave.update({
      where: { id },
      data: {
        endDate: end,
        status: 'closed',
      },
      include: {
        employee: true,
        verifiedBy: true,
      },
    });

    // Вернуть статус сотрудника
    await prisma.employee.update({
      where: { id: sickLeave.employeeId },
      data: { status: 'active' },
    });

    return this.mapSickLeave(updated);
  }

  async getStatistics(organizationId: string, year: number) {
    const sickLeaves = await prisma.sickLeave.findMany({
      where: {
        organizationId,
        startDate: {
          gte: new Date(year, 0, 1),
          lte: new Date(year, 11, 31),
        },
      },
      include: {
        employee: {
          select: {
            },
        },
      },
    });

    const totalSickLeaves = sickLeaves.length;
    const totalDays = sickLeaves.reduce((sum, sl) => {
      if (!sl.endDate) return sum;
      return sum + Math.ceil((new Date(sl.endDate).getTime() - new Date(sl.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }, 0);

    const byStatus = sickLeaves.reduce((acc, sl) => {
      acc[sl.status] = (acc[sl.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // По отделам
    const byDepartment = sickLeaves.reduce((acc, sl) => {
      const deptName = (sl.employee as any)?.departmentId || 'Не указано';
      if (!acc[deptName]) {
        acc[deptName] = { count: 0, days: 0 };
      }
      acc[deptName].count++;
      if (sl.endDate) {
        acc[deptName].days += Math.ceil((new Date(sl.endDate).getTime() - new Date(sl.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1;
      }
      return acc;
    }, {} as Record<string, { count: number; days: number }>);

    return {
      totalSickLeaves,
      totalDays,
      byStatus,
      byDepartment,
    };
  }

  private mapSickLeave(sickLeave: any): SickLeaveWithRelations {
    return {
      id: sickLeave.id,
      employeeId: sickLeave.employeeId,
      documentNumber: sickLeave.documentNumber,
      issueDate: sickLeave.issueDate,
      startDate: sickLeave.startDate,
      endDate: sickLeave.endDate,
      status: sickLeave.status,
      documentUrl: sickLeave.documentUrl,
      verifiedById: sickLeave.verifiedById,
      organizationId: sickLeave.organizationId,
      createdAt: sickLeave.createdAt,
      employee: sickLeave.employee,
      verifiedBy: sickLeave.verifiedBy,
    };
  }
}

export default new SickLeavesService();
