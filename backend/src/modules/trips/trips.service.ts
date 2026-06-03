import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { TripStatus, EmployeeStatus } from '@prisma/client';

export interface CreateTripRequest {
  employeeId: string;
  destination: string;
  purpose: string;
  route?: string;
  startDate: string;
  endDate: string;
  budget?: number;
  organizationId: string;
}

export interface TripFilters {
  employeeId?: string;
  departmentId?: string;
  status?: string;
  year?: number;
  page?: number;
  limit?: number;
}

export interface TripWithRelations {
  id: string;
  employeeId: string;
  destination: string;
  purpose: string;
  route: string | null;
  startDate: Date;
  endDate: Date;
  budget: any;
  status: string;
  approverId: string | null;
  reportUrl: string | null;
  organizationId: string;
  createdAt: Date;
  employee?: any;
  approver?: any;
}

export class TripsService {
  async create(data: CreateTripRequest) {
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

    // Создать заявку
    const request = await prisma.businessTrip.create({
      data: {
        employeeId,
        organizationId,
        destination: data.destination,
        purpose: data.purpose,
        route: data.route,
        startDate: start,
        endDate: end,
        budget: data.budget,
        status: TripStatus.planned,
      },
      include: {
        employee: true,
      },
    });

    return this.mapTrip(request);
  }

  async findAll(
    organizationId: string,
    filters: TripFilters
  ): Promise<{ data: TripWithRelations[]; total: number; page: number; totalPages: number }> {
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
    const total = await prisma.businessTrip.count({ where });

    // Получить данные
    const trips = await prisma.businessTrip.findMany({
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
      data: trips.map(t => this.mapTrip(t)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string): Promise<TripWithRelations> {
    const trip = await prisma.businessTrip.findFirst({
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

    if (!trip) {
      throw new AppError('Заявка на командировку не найдена', 404);
    }

    return this.mapTrip(trip);
  }

  async approve(id: string, organizationId: string, approverId: string) {
    const trip = await prisma.businessTrip.findFirst({
      where: { id, organizationId },
      include: { employee: true },
    });

    if (!trip) {
      throw new AppError('Заявка не найдена', 404);
    }

    if (trip.status !== TripStatus.planned) {
      throw new AppError(`Заявка уже имеет статус ${trip.status}`, 400);
    }

    // Обновить статус сотрудника
    await prisma.employee.update({
      where: { id: trip.employeeId },
      data: { status: EmployeeStatus.business_trip },
    });

    const updated = await prisma.businessTrip.update({
      where: { id },
      data: {
        status: TripStatus.in_progress,
        approverId,
      },
      include: {
        employee: true,
        approver: true,
      },
    });

    return this.mapTrip(updated);
  }

  async reject(id: string, organizationId: string, approverId: string) {
    const trip = await prisma.businessTrip.findFirst({
      where: { id, organizationId },
    });

    if (!trip) {
      throw new AppError('Заявка не найдена', 404);
    }

    if (trip.status !== TripStatus.planned) {
      throw new AppError(`Заявка уже имеет статус ${trip.status}`, 400);
    }

    const updated = await prisma.businessTrip.update({
      where: { id },
      data: {
        status: TripStatus.cancelled,
        approverId,
      },
      include: {
        employee: true,
        approver: true,
      },
    });

    return this.mapTrip(updated);
  }

  async completeTrip(id: string, organizationId: string, reportUrl: string) {
    const trip = await prisma.businessTrip.findFirst({
      where: { id, organizationId },
      include: { employee: true },
    });

    if (!trip) {
      throw new AppError('Заявка не найдена', 404);
    }

    if (trip.status !== TripStatus.in_progress) {
      throw new AppError(`Заявка имеет статус ${trip.status}, нельзя завершить`, 400);
    }

    // Обновить статус и добавить отчёт
    const updated = await prisma.businessTrip.update({
      where: { id },
      data: {
        status: TripStatus.completed,
        reportUrl,
      },
      include: {
        employee: true,
        approver: true,
      },
    });

    // Вернуть статус сотрудника на active
    await prisma.employee.update({
      where: { id: trip.employeeId },
      data: { status: EmployeeStatus.active },
    });

    return this.mapTrip(updated);
  }

  async getStatistics(organizationId: string, year: number) {
    const trips = await prisma.businessTrip.findMany({
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

    const totalTrips = trips.length;
    const totalBudget = trips.reduce((sum, t) => sum + (t.budget ? parseFloat(t.budget.toString()) : 0), 0);
    const completedTrips = trips.filter(t => t.status === 'completed').length;
    const pendingTrips = trips.filter(t => t.status === TripStatus.planned).length;

    // По отделам
    const byDepartment = trips.reduce((acc, trip) => {
      const deptName = (trip.employee as any)?.departmentId || 'Не указано';
      if (!acc[deptName]) {
        acc[deptName] = { count: 0, budget: 0 };
      }
      acc[deptName].count++;
      acc[deptName].budget += trip.budget ? parseFloat(trip.budget.toString()) : 0;
      return acc;
    }, {} as Record<string, { count: number; budget: number }>);

    return {
      totalTrips,
      totalBudget,
      completedTrips,
      pendingTrips,
      byDepartment,
    };
  }

  private mapTrip(trip: any): TripWithRelations {
    return {
      id: trip.id,
      employeeId: trip.employeeId,
      destination: trip.destination,
      purpose: trip.purpose,
      route: trip.route,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget,
      status: trip.status,
      approverId: trip.approverId,
      reportUrl: trip.reportUrl,
      organizationId: trip.organizationId,
      createdAt: trip.createdAt,
      employee: trip.employee,
      approver: trip.approver,
    };
  }
}

export default new TripsService();
