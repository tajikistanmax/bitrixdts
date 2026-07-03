import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

/**
 * Task Chats — привязка чата к задаче.
 * Каждая задача может иметь свой чат-канал для обсуждения.
 */
export class TaskChatsService {
  // Получить или создать чат для задачи
  async getOrCreateTaskChat(taskId: string, organizationId: string, creatorId: string) {
    // Проверить задачу
    const task = await prisma.task.findFirst({
      where: { id: taskId, organizationId },
      include: {
        assignee: { select: { id: true } },
        controller: { select: { id: true } },
        creator: { select: { id: true } },
        coAssignees: { select: { employeeId: true } },
      },
    });
    if (!task) throw new AppError('Задача не найдена', 404);

    // Ищем существующий чат задачи
    const existing = await prisma.chatChannel.findFirst({
      where: { organizationId, type: 'task', name: `task-${taskId}` },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 20 }, members: true },
    });

    if (existing) return existing;

    // Собрать участников задачи
    const memberIds = new Set<string>();
    memberIds.add(task.creatorId);
    if (task.assigneeId) memberIds.add(task.assigneeId);
    if (task.controllerId) memberIds.add(task.controllerId);
    task.coAssignees.forEach(ca => memberIds.add(ca.employeeId));

    // Создать канал
    const channel = await prisma.chatChannel.create({
      data: {
        organizationId,
        name: `task-${taskId}`,
        type: 'task',
        members: {
          create: Array.from(memberIds).map(employeeId => ({
            employeeId,
            role: employeeId === creatorId ? 'admin' : 'member',
          })),
        },
      },
      include: { members: true, messages: true },
    });

    return channel;
  }

  // Получить все чаты задач для сотрудника
  async getMyTaskChats(employeeId: string, organizationId: string) {
    const channels = await prisma.chatChannel.findMany({
      where: {
        organizationId,
        type: 'task',
        members: { some: { employeeId } },
      },
      include: {
        _count: { select: { messages: true } },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Обогатить названиями задач
    const taskIds = channels.map(c => c.name?.replace('task-', '')).filter(Boolean) as string[];
    const tasks = await prisma.task.findMany({
      where: { id: { in: taskIds } },
      select: { id: true, title: true, status: true },
    });
    const taskMap = new Map(tasks.map(t => [t.id, t]));

    return channels.map(ch => {
      const taskId = ch.name?.replace('task-', '');
      const task = taskId ? taskMap.get(taskId) : null;
      return {
        channelId: ch.id,
        taskId,
        taskTitle: task?.title || 'Задача',
        taskStatus: task?.status,
        lastMessage: ch.messages[0]?.body || null,
        messageCount: ch._count.messages,
        createdAt: ch.createdAt,
      };
    });
  }
}

export default new TaskChatsService();
