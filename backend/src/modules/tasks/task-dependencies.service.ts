import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import { TaskDependencyType } from '@prisma/client';

export interface CreateDependencyData {
  predecessorId: string;
  successorId: string;
  type?: TaskDependencyType;
  lagDays?: number;
}

export class TaskDependenciesService {
  // ─── Создать зависимость ──────────────────────────────────────────────

  async create(data: CreateDependencyData, organizationId: string) {
    const { predecessorId, successorId } = data;

    // Нельзя создать зависимость задачи от самой себя
    if (predecessorId === successorId) {
      throw new AppError('Задача не может зависеть от самой себя', 400);
    }

    // Проверить существование обеих задач
    const [predecessor, successor] = await Promise.all([
      prisma.task.findFirst({ where: { id: predecessorId, organizationId } }),
      prisma.task.findFirst({ where: { id: successorId, organizationId } }),
    ]);

    if (!predecessor) throw new AppError('Задача-предшественник не найдена', 404);
    if (!successor) throw new AppError('Задача-последователь не найдена', 404);

    // Проверить циклическую зависимость
    const hasCycle = await this.detectCycle(successorId, predecessorId);
    if (hasCycle) {
      throw new AppError('Обнаружена циклическая зависимость', 400);
    }

    // Проверить дубликат
    const existing = await prisma.taskDependency.findUnique({
      where: { predecessorId_successorId: { predecessorId, successorId } },
    });
    if (existing) throw new AppError('Такая зависимость уже существует', 400);

    const dependency = await prisma.taskDependency.create({
      data: {
        predecessorId,
        successorId,
        type: data.type || 'finish_to_start',
        lagDays: data.lagDays || 0,
      },
    });

    return dependency;
  }

  // ─── Получить зависимости задачи ─────────────────────────────────────

  async getForTask(taskId: string) {
    const [predecessors, successors] = await Promise.all([
      prisma.taskDependency.findMany({
        where: { successorId: taskId },
      }),
      prisma.taskDependency.findMany({
        where: { predecessorId: taskId },
      }),
    ]);

    return { predecessors, successors };
  }

  // ─── Удалить зависимость ──────────────────────────────────────────────

  async delete(id: string) {
    const dep = await prisma.taskDependency.findUnique({ where: { id } });
    if (!dep) throw new AppError('Зависимость не найдена', 404);

    await prisma.taskDependency.delete({ where: { id } });
    return { success: true };
  }

  // ─── Получить данные для диаграммы Ганта ──────────────────────────────

  async getGanttData(organizationId: string, projectId?: string) {
    const where: any = { organizationId, isDeleted: false };
    if (projectId) where.projectId = projectId;

    const tasks = await prisma.task.findMany({
      where,
      select: {
        id: true,
        title: true,
        status: true,
        priority: true,
        startDate: true,
        dueDate: true,
        assigneeId: true,
        parentTaskId: true,
        projectId: true,
      },
      orderBy: { startDate: 'asc' },
    });

    // Получить все зависимости для этих задач
    const taskIds = tasks.map(t => t.id);
    const dependencies = await prisma.taskDependency.findMany({
      where: {
        OR: [
          { predecessorId: { in: taskIds } },
          { successorId: { in: taskIds } },
        ],
      },
    });

    return {
      tasks: tasks.map(t => ({
        ...t,
        start: t.startDate,
        end: t.dueDate,
        parent: t.parentTaskId,
      })),
      dependencies: dependencies.map(d => ({
        id: d.id,
        source: d.predecessorId,
        target: d.successorId,
        type: d.type,
        lag: d.lagDays,
      })),
    };
  }

  // ─── Вспомогательные ──────────────────────────────────────────────────

  private async detectCycle(startId: string, targetId: string): Promise<boolean> {
    const visited = new Set<string>();
    const queue = [startId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === targetId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const successors = await prisma.taskDependency.findMany({
        where: { predecessorId: current },
        select: { successorId: true },
      });

      for (const s of successors) {
        queue.push(s.successorId);
      }
    }

    return false;
  }
}

export default new TaskDependenciesService();
