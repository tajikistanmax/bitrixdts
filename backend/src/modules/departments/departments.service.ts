import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface CreateDepartmentData {
  name: string;
  organizationId: string;
  parentId?: string;
  headId?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  parentId?: string;
  headId?: string;
}

export class DepartmentsService {
  async create(data: CreateDepartmentData) {
    const { organizationId, parentId, headId } = data;

    // Проверить существование организации
    const org = await prisma.organization.findUnique({ where: { id: organizationId } });
    if (!org) throw new AppError('Организация не найдена', 404);

    // Проверить родительский отдел
    if (parentId) {
      const parent = await prisma.department.findFirst({
        where: { id: parentId, organizationId },
      });
      if (!parent) throw new AppError('Родительский отдел не найден', 404);
    }

    // Проверить руководителя
    if (headId) {
      const head = await prisma.employee.findFirst({
        where: { id: headId, organizationId },
      });
      if (!head) throw new AppError('Руководитель не найден', 404);
    }

    // Вычислить уровень иерархии
    let level = 0;
    if (parentId) {
      const parent = await prisma.department.findFirst({
        where: { id: parentId },
        include: { parent: true },
      });
      level = parent?.parent ? 2 : 1;
    }

    // Создать отдел
    const department = await prisma.department.create({
      data: {
        name: data.name,
        organizationId,
        parentId,
        headId,
        level,
      },
      include: {
        parent: true,
        head: true,
      },
    });

    return this.mapDepartment(department);
  }

  async findAll(organizationId: string) {
    const departments = await prisma.department.findMany({
      where: { organizationId },
      include: {
        parent: {
          select: { id: true, name: true },
        },
        head: {
          select: { id: true, fullName: true, position: true },
        },
        children: {
          select: { id: true, name: true },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
      orderBy: { level: 'asc' },
    });

    return departments.map(d => this.mapDepartment(d));
  }

  async findById(id: string, organizationId: string) {
    const department = await prisma.department.findFirst({
      where: { id, organizationId },
      include: {
        parent: true,
        head: true,
        children: {
          include: {
            parent: true,
            head: true,
          },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    if (!department) throw new AppError('Отдел не найден', 404);

    return this.mapDepartment(department);
  }

  async update(id: string, organizationId: string, data: UpdateDepartmentData) {
    // Проверить существование
    const existing = await prisma.department.findFirst({
      where: { id, organizationId },
    });

    if (!existing) throw new AppError('Отдел не найден', 404);

    // Проверить родительский отдел (нельзя назначить самого себя или ребёнка)
    if (data.parentId && data.parentId !== id) {
      const parent = await prisma.department.findFirst({
        where: { id: data.parentId, organizationId },
      });
      if (!parent) throw new AppError('Родительский отдел не найден', 404);

      // Проверить на циклическую зависимость
      const isChild = await this.isChildOf(id, data.parentId, organizationId);
      if (isChild) throw new AppError('Нельзя назначить подчинённый отдел родителем', 400);
    }

    // Проверить руководителя
    if (data.headId) {
      const head = await prisma.employee.findFirst({
        where: { id: data.headId, organizationId },
      });
      if (!head) throw new AppError('Руководитель не найден', 404);
    }

    // Обновить
    const updated = await prisma.department.update({
      where: { id },
      data: {
        name: data.name,
        parentId: data.parentId,
        headId: data.headId,
        level: data.parentId ? await this.calculateLevel(data.parentId) : 0,
      },
      include: {
        parent: true,
        head: true,
      },
    });

    return this.mapDepartment(updated);
  }

  async delete(id: string, organizationId: string) {
    const department = await prisma.department.findFirst({
      where: { id, organizationId },
    });

    if (!department) throw new AppError('Отдел не найден', 404);

    // Проверить наличие подчинённых отделов
    const childrenCount = await prisma.department.count({
      where: { parentId: id },
    });

    if (childrenCount > 0) {
      throw new AppError('Нельзя удалить отдел с подчинёнными отделами', 400);
    }

    // Проверить наличие сотрудников
    const employeesCount = await prisma.employee.count({
      where: { departmentId: id },
    });

    if (employeesCount > 0) {
      throw new AppError('Нельзя удалить отдел с сотрудниками. Сначала переназначьте сотрудников', 400);
    }

    // Удалить
    await prisma.department.delete({ where: { id } });

    return { success: true, message: 'Отдел удалён' };
  }

  async getTree(organizationId: string) {
    // Получить все отделы
    const allDepartments = await prisma.department.findMany({
      where: { organizationId },
      include: {
        parent: {
          select: { id: true },
        },
        head: {
          select: { id: true, fullName: true, position: true },
        },
        _count: {
          select: {
            children: true,
          },
        },
      },
    });

    // Построить дерево
    const tree: any[] = [];
    const map: Record<string, any> = {};

    allDepartments.forEach(dept => {
      map[dept.id] = {
        id: dept.id,
        name: dept.name,
        level: dept.level,
        head: dept.head,
        _count: dept._count,
        children: [],
      };
    });

    allDepartments.forEach(dept => {
      if (dept.parentId) {
        if (map[dept.parentId]) {
          map[dept.parentId].children.push(map[dept.id]);
        }
      } else {
        tree.push(map[dept.id]);
      }
    });

    return tree;
  }

  // Вспомогательные методы
  private async isChildOf(parentId: string, potentialChildId: string, organizationId: string): Promise<boolean> {
    const children = await prisma.department.findMany({
      where: { parentId: potentialChildId, organizationId },
      select: { id: true },
    });

    for (const child of children) {
      if (child.id === parentId) return true;
      const isDescendant = await this.isChildOf(parentId, child.id, organizationId);
      if (isDescendant) return true;
    }

    return false;
  }

  private async calculateLevel(parentId: string): Promise<number> {
    const parent = await prisma.department.findUnique({
      where: { id: parentId },
      select: { level: true },
    });
    return parent ? parent.level + 1 : 1;
  }

  private mapDepartment(department: any) {
    return {
      id: department.id,
      name: department.name,
      organizationId: department.organizationId,
      parentId: department.parentId,
      headId: department.headId,
      level: department.level,
      createdAt: department.createdAt,
      parent: department.parent,
      head: department.head,
      children: department.children,
      employees: department.employees,
      _count: department._count,
    };
  }
}

export default new DepartmentsService();
