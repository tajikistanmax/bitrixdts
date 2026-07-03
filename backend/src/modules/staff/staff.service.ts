import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface CreatePositionData {
  organizationId: string;
  departmentId: string;
  title: string;
  grade?: string;
  minSalary?: number;
  maxSalary?: number;
  headcount?: number;
  description?: string;
  requirements?: string;
}

export interface UpdatePositionData {
  title?: string;
  grade?: string;
  minSalary?: number;
  maxSalary?: number;
  headcount?: number;
  description?: string;
  requirements?: string;
  isActive?: boolean;
}

export interface AssignEmployeeData {
  positionId: string;
  employeeId: string;
  salary: number;
  rate?: number;
  startDate: string;
}

export interface StaffFilters {
  departmentId?: string;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export class StaffService {
  // ─── Позиции ──────────────────────────────────────────────────────────

  async createPosition(data: CreatePositionData) {
    const { organizationId, departmentId } = data;

    // Проверить отдел
    const department = await prisma.department.findFirst({
      where: { id: departmentId, organizationId },
    });
    if (!department) throw new AppError('Подразделение не найдено', 404);

    const position = await prisma.staffPosition.create({
      data: {
        organizationId,
        departmentId,
        title: data.title,
        grade: data.grade,
        minSalary: data.minSalary,
        maxSalary: data.maxSalary,
        headcount: data.headcount || 1,
        description: data.description,
        requirements: data.requirements,
      },
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    return position;
  }

  async findAllPositions(organizationId: string, filters: StaffFilters) {
    const { departmentId, isActive, search, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    const where: any = { organizationId };
    if (departmentId) where.departmentId = departmentId;
    if (isActive !== undefined) where.isActive = isActive;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [positions, total] = await Promise.all([
      prisma.staffPosition.findMany({
        where,
        include: {
          department: { select: { id: true, name: true } },
          assignments: {
            where: { isActive: true },
            include: {
              employee: {
                select: { id: true, fullName: true, avatarUrl: true },
              },
            },
          },
        },
        orderBy: [{ department: { name: 'asc' } }, { title: 'asc' }],
        skip,
        take: limit,
      }),
      prisma.staffPosition.count({ where }),
    ]);

    return { data: positions, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getPositionById(id: string, organizationId: string) {
    const position = await prisma.staffPosition.findFirst({
      where: { id, organizationId },
      include: {
        department: { select: { id: true, name: true } },
        assignments: {
          include: {
            employee: {
              select: { id: true, fullName: true, position: true, avatarUrl: true },
            },
          },
          orderBy: { startDate: 'desc' },
        },
      },
    });

    if (!position) throw new AppError('Позиция не найдена', 404);
    return position;
  }

  async updatePosition(id: string, organizationId: string, data: UpdatePositionData) {
    const existing = await prisma.staffPosition.findFirst({
      where: { id, organizationId },
    });
    if (!existing) throw new AppError('Позиция не найдена', 404);

    const updated = await prisma.staffPosition.update({
      where: { id },
      data,
      include: {
        department: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  async deletePosition(id: string, organizationId: string) {
    const position = await prisma.staffPosition.findFirst({
      where: { id, organizationId },
      include: { assignments: { where: { isActive: true } } },
    });

    if (!position) throw new AppError('Позиция не найдена', 404);
    if (position.assignments.length > 0) {
      throw new AppError('Нельзя удалить позицию с активными назначениями', 400);
    }

    await prisma.staffPosition.delete({ where: { id } });
    return { success: true };
  }

  // ─── Назначения сотрудников ───────────────────────────────────────────

  async assignEmployee(data: AssignEmployeeData) {
    const position = await prisma.staffPosition.findUnique({
      where: { id: data.positionId },
      include: { assignments: { where: { isActive: true } } },
    });

    if (!position) throw new AppError('Позиция не найдена', 404);

    // Проверить доступные ставки
    if (position.assignments.length >= position.headcount) {
      throw new AppError(`Все ${position.headcount} ставок заняты`, 400);
    }

    // Проверить сотрудника
    const employee = await prisma.employee.findFirst({
      where: { id: data.employeeId, organizationId: position.organizationId },
    });
    if (!employee) throw new AppError('Сотрудник не найден', 404);

    // Проверить, не назначен ли уже на эту позицию
    const existingAssignment = await prisma.staffAssignment.findFirst({
      where: { positionId: data.positionId, employeeId: data.employeeId, isActive: true },
    });
    if (existingAssignment) throw new AppError('Сотрудник уже назначен на эту позицию', 400);

    // Валидация зарплаты
    if (position.minSalary && data.salary < Number(position.minSalary)) {
      throw new AppError(`Зарплата ниже минимума позиции (${position.minSalary})`, 400);
    }
    if (position.maxSalary && data.salary > Number(position.maxSalary)) {
      throw new AppError(`Зарплата выше максимума позиции (${position.maxSalary})`, 400);
    }

    const assignment = await prisma.staffAssignment.create({
      data: {
        positionId: data.positionId,
        employeeId: data.employeeId,
        salary: data.salary,
        rate: data.rate || 1.0,
        startDate: new Date(data.startDate),
      },
      include: {
        employee: { select: { id: true, fullName: true } },
        position: { select: { id: true, title: true } },
      },
    });

    // Обновить счётчик заполненных
    await prisma.staffPosition.update({
      where: { id: data.positionId },
      data: { filledCount: { increment: 1 } },
    });

    // Обновить должность сотрудника
    await prisma.employee.update({
      where: { id: data.employeeId },
      data: { position: position.title },
    });

    return assignment;
  }

  async removeAssignment(assignmentId: string, organizationId: string) {
    const assignment = await prisma.staffAssignment.findFirst({
      where: { id: assignmentId, position: { organizationId } },
    });

    if (!assignment) throw new AppError('Назначение не найдено', 404);

    await prisma.staffAssignment.update({
      where: { id: assignmentId },
      data: { isActive: false, endDate: new Date() },
    });

    // Обновить счётчик
    await prisma.staffPosition.update({
      where: { id: assignment.positionId },
      data: { filledCount: { decrement: 1 } },
    });

    return { success: true };
  }

  // ─── Статистика ───────────────────────────────────────────────────────

  async getStaffStatistics(organizationId: string) {
    const positions = await prisma.staffPosition.findMany({
      where: { organizationId, isActive: true },
      select: { headcount: true, filledCount: true, departmentId: true },
    });

    const totalPositions = positions.length;
    const totalHeadcount = positions.reduce((sum, p) => sum + p.headcount, 0);
    const totalFilled = positions.reduce((sum, p) => sum + p.filledCount, 0);
    const vacancies = totalHeadcount - totalFilled;

    // По отделам
    const byDepartment = new Map<string, { headcount: number; filled: number }>();
    for (const pos of positions) {
      const dept = byDepartment.get(pos.departmentId) || { headcount: 0, filled: 0 };
      dept.headcount += pos.headcount;
      dept.filled += pos.filledCount;
      byDepartment.set(pos.departmentId, dept);
    }

    return {
      totalPositions,
      totalHeadcount,
      totalFilled,
      vacancies,
      fillRate: totalHeadcount > 0 ? Math.round((totalFilled / totalHeadcount) * 100) : 0,
    };
  }

  // ─── Организационная структура (для отображения) ──────────────────────

  async getOrgChart(organizationId: string) {
    const departments = await prisma.department.findMany({
      where: { organizationId },
      include: {
        head: { select: { id: true, fullName: true, avatarUrl: true, position: true } },
        staffPositions: {
          where: { isActive: true },
          include: {
            assignments: {
              where: { isActive: true },
              include: {
                employee: {
                  select: { id: true, fullName: true, avatarUrl: true },
                },
              },
            },
          },
        },
      },
      orderBy: { level: 'asc' },
    });

    return departments;
  }
}

export default new StaffService();
