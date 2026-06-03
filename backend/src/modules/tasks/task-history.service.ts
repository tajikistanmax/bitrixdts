import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface TaskHistory {
  id?: string;
  taskId: string;
  changedBy: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  comment?: string;
}

export class TaskHistoryService {
  // Записать изменение задачи
  async recordChange(taskId: string, changedBy: string, fieldName: string, oldValue: any, newValue: any, comment?: string) {
    // Пропустить если значения одинаковые
    if (oldValue === newValue) return null;

    const history = await prisma.taskHistory.create({
      data: {
        taskId,
        changedBy,
        fieldName,
        oldValue: oldValue !== null ? JSON.stringify(oldValue) : null,
        newValue: newValue !== null ? JSON.stringify(newValue) : null,
        comment,
      },
    });

    return history;
  }

  // Получить историю изменений задачи
  async getHistory(taskId: string, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId },
    });

    if (!task) throw new AppError('Задача не найдена', 404);

    const history = await prisma.taskHistory.findMany({
      where: { taskId },
      include: {
        changedByEmployee: {
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

    return history;
  }

  // Получить историю изменений по сотруднику
  async getByEmployee(employeeId: string, organizationId: string, limit: number = 50) {
    const history = await prisma.taskHistory.findMany({
      where: { changedBy: employeeId },
      include: {
        task: {
          select: {
            id: true,
            title: true,
            organizationId: true,
          },
        },
        changedByEmployee: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return history.filter(h => h.task.organizationId === organizationId);
  }

  // Получить историю по полю
  async getByField(fieldName: string, taskId?: string, limit: number = 100) {
    const where: any = { fieldName };

    if (taskId) {
      where.taskId = taskId;
    }

    const history = await prisma.taskHistory.findMany({
      where,
      include: {
        task: {
          select: {
            id: true,
            title: true,
          },
        },
        changedByEmployee: {
          select: {
            id: true,
            fullName: true,
            position: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    return history;
  }

  // Получить сводную статистику изменений
  async getStatistics(taskId: string) {
    const history = await prisma.taskHistory.findMany({
      where: { taskId },
    });

    const byField = await prisma.taskHistory.groupBy({
      by: ['fieldName'],
      where: { taskId },
      _count: { fieldName: true },
    });

    const byUser = await prisma.taskHistory.groupBy({
      by: ['changedBy'],
      where: { taskId },
      _count: { changedBy: true },
    });

    return {
      total: history.length,
      byField: byField.reduce((acc, item) => {
        acc[item.fieldName] = item._count.fieldName;
        return acc;
      }, {} as Record<string, number>),
      byUser: byUser.reduce((acc, item) => {
        acc[item.changedBy] = item._count.changedBy;
        return acc;
      }, {} as Record<string, number>),
    };
  }

  // Откатить изменение (возврат к предыдущему значению)
  async revertChange(taskId: string, fieldName: string, newValue: any, changedBy: string) {
    // Найти последнее изменение этого поля
    const lastChange = await prisma.taskHistory.findFirst({
      where: { taskId, fieldName },
      orderBy: { createdAt: 'desc' },
    });

    if (!lastChange || !lastChange.oldValue) {
      throw new AppError('Нет предыдущего значения для отката', 404);
    }

    const previousValue = JSON.parse(lastChange.oldValue);

    // Записать новое изменение с откатом
    const history = await prisma.taskHistory.create({
      data: {
        taskId,
        changedBy,
        fieldName,
        oldValue: JSON.stringify(newValue),
        newValue: JSON.stringify(previousValue),
        comment: 'Откат изменения',
      },
    });

    return {
      history,
      revertedTo: previousValue,
    };
  }
}

export default new TaskHistoryService();
