import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { v4 as uuidv4 } from 'uuid';
import { EmployeeStatus } from '@prisma/client';

export interface CreateEmployeeData {
  fullName: string;
  inn?: string;
  email?: string;
  phone?: string;
  password?: string;
  position?: string;
  departmentId?: string;
  managerId?: string;
  hireDate?: string;
  organizationId: string;
  avatarUrl?: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeeData {
  fullName?: string;
  inn?: string;
  email?: string;
  phone?: string;
  position?: string;
  departmentId?: string;
  managerId?: string;
  hireDate?: string;
  status?: EmployeeStatus;
  avatarUrl?: string;
}

export interface EmployeeFilters {
  search?: string;
  departmentId?: string;
  status?: string;
  position?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface EmployeeWithRelations {
  id: string;
  fullName: string;
  inn: string | null;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
  departmentId: string | null;
  position: string | null;
  managerId: string | null;
  hireDate: Date | null;
  status: string;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  department?: any;
  manager?: any;
  subordinates?: any[];
  roles?: any[];
}

export class EmployeesService {
  async create(data: CreateEmployeeData, userId: string) {
    const { organizationId, password, ...employeeData } = data;

    // Проверить, существует ли сотрудник с таким email
    if (data.email) {
      const existing = await prisma.employee.findFirst({
        where: { email: data.email, organizationId },
      });

      if (existing) {
        throw new AppError('Сотрудник с таким email уже существует', 400);
      }
    }

    // Проверить, существует ли отдел
    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: data.departmentId, organizationId },
      });

      if (!department) {
        throw new AppError('Отдел не найден', 400);
      }
    }

    // Проверить, существует ли руководитель
    if (data.managerId) {
      const manager = await prisma.employee.findFirst({
        where: { id: data.managerId, organizationId },
      });

      if (!manager) {
        throw new AppError('Руководитель не найден', 400);
      }
    }

    // Хэшировать пароль, если указан
    let passwordHash = null;
    if (password) {
      const bcrypt = await import('bcryptjs');
      passwordHash = await bcrypt.hash(password, 12);
    }

    // Создать сотрудника
    const employee = await prisma.employee.create({
      data: {
        ...employeeData,
        organizationId,
        passwordHash,
        status: data.status || 'active',
        hireDate: data.hireDate ? new Date(data.hireDate) : new Date(),
      },
      include: {
        manager: true,
        organization: true,
      },
    });

    // Назначить роль по умолчанию
    const defaultRole = await prisma.role.findFirst({
      where: { organizationId, name: 'employee' },
    });

    if (defaultRole) {
      await prisma.employeeRole.create({
        data: {
          employeeId: employee.id,
          roleId: defaultRole.id,
        },
      });
    }

    // Записать в историю
    await this.logHistory(employee.id, null, 'created', 'system', userId);

    return this.mapEmployee(employee);
  }

  async findAll(
    organizationId: string,
    filters: EmployeeFilters
  ): Promise<{ data: EmployeeWithRelations[]; total: number; page: number; totalPages: number }> {
    const {
      search,
      departmentId,
      status,
      position,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    // Построить условия фильтрации
    const where: any = {
      organizationId,
    };

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { inn: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (status) {
      where.status = status;
    }

    if (position) {
      where.position = { contains: position, mode: 'insensitive' };
    }

    // Получить общее количество
    const total = await prisma.employee.count({ where });

    // Получить данные
    const employees = await prisma.employee.findMany({
      where,
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        employeeRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    });

    return {
      data: employees.map(e => this.mapEmployee(e)),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string, organizationId: string): Promise<EmployeeWithRelations> {
    const employee = await prisma.employee.findFirst({
      where: { id, organizationId },
      include: {
        manager: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        subordinates: {
          where: {  },
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        employeeRoles: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!employee) {
      throw new AppError('Сотрудник не найден', 404);
    }

    return this.mapEmployee(employee);
  }

  async update(
    id: string,
    organizationId: string,
    data: UpdateEmployeeData,
    userId: string
  ): Promise<EmployeeWithRelations> {
    // Проверить существование
    const existing = await prisma.employee.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Сотрудник не найден', 404);
    }

    // Проверить email (если меняется)
    if (data.email && data.email !== existing.email) {
      const emailExists = await prisma.employee.findFirst({
        where: { email: data.email, organizationId, id: { not: id } },
      });

      if (emailExists) {
        throw new AppError('Сотрудник с таким email уже существует', 400);
      }
    }

    // Проверить отдел
    if (data.departmentId) {
      const department = await prisma.department.findFirst({
        where: { id: data.departmentId, organizationId },
      });

      if (!department) {
        throw new AppError('Отдел не найден', 400);
      }
    }

    // Проверить руководителя (нельзя назначить самого себя или подчинённого)
    if (data.managerId && data.managerId !== id) {
      const manager = await prisma.employee.findFirst({
        where: { id: data.managerId, organizationId },
      });

      if (!manager) {
        throw new AppError('Руководитель не найден', 400);
      }

      // Проверить на циклическую зависимость
      const managerSubordinates = await this.getAllSubordinates(manager.id);
      if (managerSubordinates.includes(id)) {
        throw new AppError('Нельзя назначить подчинённого руководителем', 400);
      }
    }

    // Обновить
    const updated = await prisma.employee.update({
      where: { id },
      data: {
        ...data,
        hireDate: data.hireDate ? new Date(data.hireDate) : undefined,
      },
      include: {
        manager: true,
        organization: true,
      },
    });

    // Записать в историю изменения
    await this.logHistoryChanges(id, existing, data, userId);

    return this.mapEmployee(updated);
  }

  async delete(id: string, organizationId: string, userId: string): Promise<void> {
    const existing = await prisma.employee.findFirst({
      where: { id, organizationId },
    });

    if (!existing) {
      throw new AppError('Сотрудник не найден', 404);
    }

    // Проверить, нет ли подчинённых
    const subordinatesCount = await prisma.employee.count({
      where: { managerId: id, organizationId },
    });

    if (subordinatesCount > 0) {
      throw new AppError('Нельзя удалить руководителя с подчинёнными. Сначала переназначьте подчинённых', 400);
    }

    // Мягкое удаление
    await prisma.employee.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        status: 'fired',
      },
    });

    // Записать в историю
    await this.logHistory(id, existing, 'deleted', 'system', userId);
  }

  async restore(id: string, organizationId: string): Promise<EmployeeWithRelations> {
    const restored = await prisma.employee.update({
      where: { id, organizationId },
      data: {
        deletedAt: null,
        status: 'active',
      },
      include: {
        manager: true,
      },
    });

    return this.mapEmployee(restored);
  }

  async getHistory(id: string, organizationId: string) {
    const history = await prisma.employeeHistory.findMany({
      where: { employeeId: id },
      orderBy: { changedAt: 'desc' },
      take: 100,
    });

    return history;
  }

  async getSubordinates(id: string, organizationId: string) {
    const subordinates = await prisma.employee.findMany({
      where: { managerId: id, organizationId },
      include: {
        subordinates: {
          where: {  },
          select: { id: true, fullName: true },
        },
      },
    });

    return subordinates;
  }

  // Вспомогательные методы
  private async getAllSubordinates(managerId: string): Promise<string[]> {
    const subordinates = await prisma.employee.findMany({
      where: { managerId },
      select: { id: true },
    });

    const ids = [managerId];
    for (const sub of subordinates) {
      const childIds = await this.getAllSubordinates(sub.id);
      ids.push(...childIds);
    }

    return ids;
  }

  private async logHistory(
    employeeId: string,
    employeeData: any,
    action: string,
    field: string,
    changedBy: string
  ) {
    await prisma.employeeHistory.create({
      data: {
        employeeId,
        changedBy,
        fieldName: field,
        oldValue: action === 'created' ? null : JSON.stringify(employeeData),
        newValue: action === 'deleted' ? null : action,
        changedAt: new Date(),
      },
    });
  }

  private async logHistoryChanges(
    employeeId: string,
    oldData: any,
    newData: UpdateEmployeeData,
    changedBy: string
  ) {
    const changes = Object.entries(newData).filter(([_, value]) => value !== undefined);

    for (const [field, newValue] of changes) {
      const oldValue = oldData[field];

      if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
        await prisma.employeeHistory.create({
          data: {
            employeeId,
            changedBy,
            fieldName: field,
            oldValue: oldValue ? JSON.stringify(oldValue) : null,
            newValue: newValue ? JSON.stringify(newValue) : null,
            changedAt: new Date(),
          },
        });
      }
    }
  }

  private mapEmployee(employee: any): EmployeeWithRelations {
    return {
      id: employee.id,
      fullName: employee.fullName,
      inn: employee.inn,
      email: employee.email,
      phone: employee.phone,
      avatarUrl: employee.avatarUrl,
      departmentId: employee.departmentId,
      position: employee.position,
      managerId: employee.managerId,
      hireDate: employee.hireDate,
      status: employee.status,
      organizationId: employee.organizationId,
      createdAt: employee.createdAt,
      updatedAt: employee.updatedAt,
      department: employee.department,
      manager: employee.manager,
      subordinates: employee.subordinates,
      roles: employee.employeeRoles?.map((er: any) => er.role.name) || [],
    };
  }
}

export default new EmployeesService();
