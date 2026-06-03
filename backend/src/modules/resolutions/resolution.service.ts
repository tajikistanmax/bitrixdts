import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface Resolution {
  id?: string;
  documentId: string;
  text: string;
  executorId?: string;
  controllerId?: string;
  deadline?: string;
  priority?: 'low' | 'normal' | 'high' | 'critical';
  status?: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  organizationId: string;
  createdBy: string;
}

export class ResolutionService {
  // Создать резолюцию
  async create(data: Resolution) {
    const { organizationId } = data;

    // Проверить документ
    const doc = await prisma.document.findFirst({
      where: { id: data.documentId, organizationId },
    });
    if (!doc) throw new AppError('Документ не найден', 404);

    const resolution = await prisma.resolution.create({
      data: {
        documentId: data.documentId,
        text: data.text,
        executorId: data.executorId,
        controllerId: data.controllerId,
        deadline: data.deadline ? new Date(data.deadline) : null,
        priority: data.priority || 'normal',
        status: 'pending',
        organizationId,
        createdBy: data.createdBy,
      },
      include: {
        document: {
          select: {
            id: true,
            title: true,
          },
        },
        executor: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
        controller: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
    });

    return resolution;
  }

  // Получить все резолюции
  async getResolutions(organizationId: string, filters?: {
    documentId?: string;
    executorId?: string;
    controllerId?: string;
    status?: string;
    priority?: string;
    overdue?: boolean;
  }) {
    const where: any = { organizationId };

    if (filters?.documentId) {
      where.documentId = filters.documentId;
    }

    if (filters?.executorId) {
      where.executorId = filters.executorId;
    }

    if (filters?.controllerId) {
      where.controllerId = filters.controllerId;
    }

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.priority) {
      where.priority = filters.priority;
    }

    if (filters?.overdue) {
      where.deadline = { lt: new Date() };
      where.status = { not: 'completed' };
    }

    const resolutions = await prisma.resolution.findMany({
      where,
      include: {
        document: {
          select: {
            id: true,
            title: true,
            documentType: true,
          },
        },
        executor: {
          select: {
            id: true,
            fullName: true,
            position: true,
            departmentId: true,
          },
        },
        controller: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return resolutions;
  }

  // Получить резолюцию по ID
  async getById(id: string, organizationId: string) {
    const resolution = await prisma.resolution.findFirst({
      where: { id, organizationId },
      include: {
        document: true,
        executor: true,
        controller: true,
        history: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!resolution) throw new AppError('Резолюция не найдена', 404);

    return resolution;
  }

  // Обновить статус резолюции
  async updateStatus(id: string, organizationId: string, status: string, userId: string, comment?: string) {
    const resolution = await this.getById(id, organizationId);

    const updated = await prisma.resolution.update({
      where: { id },
      data: { status },
      include: {
        document: true,
        executor: true,
        controller: true,
      },
    });

    // Записать в историю
    if (comment || resolution.status !== status) {
      await prisma.resolutionHistory.create({
        data: {
          resolutionId: id,
          changedBy: userId,
          fieldName: 'status',
          oldValue: resolution.status,
          newValue: status,
          comment,
        },
      });
    }

    return updated;
  }

  // Обновить исполнителя/контролёра
  async updateAssignee(id: string, organizationId: string, executorId?: string, controllerId?: string, userId: string = 'system') {
    const resolution = await this.getById(id, organizationId);

    const updated = await prisma.resolution.update({
      where: { id },
      data: {
        executorId,
        controllerId,
      },
      include: {
        document: true,
        executor: true,
        controller: true,
      },
    });

    // Записать в историю
    if (executorId !== resolution.executorId) {
      await prisma.resolutionHistory.create({
        data: {
          resolutionId: id,
          changedBy: userId,
          fieldName: 'executor',
          oldValue: resolution.executorId || 'null',
          newValue: executorId || 'null',
        },
      });
    }

    if (controllerId !== resolution.controllerId) {
      await prisma.resolutionHistory.create({
        data: {
          resolutionId: id,
          changedBy: userId,
          fieldName: 'controller',
          oldValue: resolution.controllerId || 'null',
          newValue: controllerId || 'null',
        },
      });
    }

    return updated;
  }

  // Удалить резолюцию
  async delete(id: string, organizationId: string) {
    await prisma.resolution.delete({ where: { id, organizationId } });
    return { success: true };
  }

  // Получить статистику резолюций
  async getStatistics(organizationId: string, departmentId?: string) {
    const where: any = { organizationId };

    if (departmentId) {
      // Найти сотрудников отдела
      const deptEmployees = await prisma.employee.findMany({
        where: { departmentId, organizationId },
        select: { id: true },
      });
      where.executorId = { in: deptEmployees.map(e => e.id) };
    }

    const total = await prisma.resolution.count({ where });

    const byStatus = await prisma.resolution.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const byPriority = await prisma.resolution.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true },
    });

    const overdue = await prisma.resolution.count({
      where: {
        ...where,
        deadline: { lt: new Date() },
        status: { not: 'completed' },
      },
    });

    return {
      total,
      byStatus: byStatus.reduce((acc, item) => {
        acc[item.status] = item._count.status;
        return acc;
      }, {} as Record<string, number>),
      byPriority: byPriority.reduce((acc, item) => {
        acc[item.priority] = item._count.priority;
        return acc;
      }, {} as Record<string, number>),
      overdue,
    };
  }
}

export default new ResolutionService();
