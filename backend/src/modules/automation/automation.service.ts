import prisma from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';
import notificationService from '../notifications/notifications.service';

/**
 * Automation Service
 * Обрабатывает автоматические правила:
 * - Просрочена задача → уведомить руководителя
 * - Документ подписан → отправить следующему
 * - Новый сотрудник → создать задачи адаптации
 * - Отпуск → включить делегирование
 */

export interface AutomationRule {
  id?: string;
  organizationId: string;
  name: string;
  description?: string;
  trigger: AutomationTrigger;
  conditions?: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
}

export interface AutomationTrigger {
  type: 'task_overdue' | 'task_status_changed' | 'document_signed' | 'employee_created' | 'vacation_started' | 'vacation_ended' | 'schedule';
  entityType?: string;
  schedule?: string; // cron expression
}

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'gt' | 'lt';
  value: any;
}

export interface AutomationAction {
  type: 'notify' | 'create_task' | 'change_status' | 'assign' | 'delegate' | 'send_email';
  params: Record<string, any>;
}

export class AutomationService {
  // ─── Выполнение автоматизаций ─────────────────────────────────────────

  /**
   * Обработать просроченные задачи — уведомить руководителей
   */
  async processOverdueTasks() {
    const now = new Date();

    const overdueTasks = await prisma.task.findMany({
      where: {
        dueDate: { lt: now },
        status: { notIn: ['done', 'completed', 'cancelled', 'overdue'] },
        isDeleted: false,
      },
      include: {
        assignee: {
          select: { id: true, fullName: true, managerId: true, departmentId: true },
        },
      },
    });

    let notified = 0;
    for (const task of overdueTasks) {
      // Обновить статус
      await prisma.task.update({
        where: { id: task.id },
        data: { status: 'overdue' },
      });

      // Уведомить исполнителя
      if (task.assigneeId) {
        await notificationService.sendNotification({
          type: 'task_overdue',
          title: 'Просроченная задача',
          message: `Задача "${task.title}" просрочена!`,
          recipientId: task.assigneeId,
          organizationId: task.organizationId,
          link: `/tasks/${task.id}`,
        });
      }

      // Уведомить руководителя
      if (task.assignee?.managerId) {
        await notificationService.sendNotification({
          type: 'task_overdue',
          title: 'Просроченная задача сотрудника',
          message: `Задача "${task.title}" исполнителя ${task.assignee.fullName} просрочена`,
          recipientId: task.assignee.managerId,
          organizationId: task.organizationId,
          link: `/tasks/${task.id}`,
        });
        notified++;
      }

      // Уведомить контролёра
      if (task.controllerId && task.controllerId !== task.assignee?.managerId) {
        await notificationService.sendNotification({
          type: 'task_overdue',
          title: 'Просроченная задача',
          message: `Контролируемая задача "${task.title}" просрочена`,
          recipientId: task.controllerId,
          organizationId: task.organizationId,
          link: `/tasks/${task.id}`,
        });
      }
    }

    return { processed: overdueTasks.length, managersNotified: notified };
  }

  /**
   * Обработать повторяющиеся задачи
   */
  async processRecurringTasks() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recurring = await prisma.recurringTask.findMany({
      where: {
        isActive: true,
        nextRunDate: { lte: today },
        OR: [
          { endDate: null },
          { endDate: { gte: today } },
        ],
      },
    });

    let created = 0;
    for (const rec of recurring) {
      // Создать задачу
      const task = await prisma.task.create({
        data: {
          organizationId: rec.organizationId,
          title: rec.title,
          description: rec.description,
          assigneeId: rec.assigneeId,
          controllerId: rec.controllerId,
          projectId: rec.projectId,
          priority: rec.priority,
          tags: rec.tags as any,
          checklist: rec.checklist as any,
          creatorId: rec.createdById,
          dueDate: this.calculateDueDate(rec.frequency, today),
        },
      });

      // Уведомить исполнителя
      if (rec.assigneeId) {
        await notificationService.sendNotification({
          type: 'task_assigned',
          title: 'Новая повторяющаяся задача',
          message: `Создана задача: ${rec.title}`,
          recipientId: rec.assigneeId,
          organizationId: rec.organizationId,
          link: `/tasks/${task.id}`,
        });
      }

      // Рассчитать следующую дату запуска
      const nextDate = this.calculateNextRunDate(rec.frequency, today, rec.dayOfWeek, rec.dayOfMonth);

      await prisma.recurringTask.update({
        where: { id: rec.id },
        data: {
          lastCreatedTaskId: task.id,
          nextRunDate: nextDate,
        },
      });

      created++;
    }

    return { processed: recurring.length, created };
  }

  /**
   * Отправить ежедневные дайджесты руководителям
   */
  async sendDailyDigests() {
    const managers = await prisma.employee.findMany({
      where: {
        status: 'active',
        employeeRoles: { some: { role: { name: { in: ['admin', 'manager'] } } } },
      },
      select: { id: true, organizationId: true, fullName: true },
    });

    let sent = 0;
    for (const manager of managers) {
      const now = new Date();
      const overdue = await prisma.task.count({
        where: {
          controllerId: manager.id,
          organizationId: manager.organizationId,
          isDeleted: false,
          dueDate: { lt: now },
          status: { notIn: ['done', 'completed', 'cancelled'] },
        },
      });

      const pending = await prisma.workflowApproval.count({
        where: { approverId: manager.id, status: 'pending' },
      });

      if (overdue > 0 || pending > 0) {
        await notificationService.sendNotification({
          type: 'general',
          title: 'Ежедневная сводка',
          message: `Просроченных задач: ${overdue}. Ожидают согласования: ${pending}.`,
          recipientId: manager.id,
          organizationId: manager.organizationId,
          link: '/dashboard/manager',
        });
        sent++;
      }
    }

    return { managersNotified: sent };
  }

  /**
   * Проверить приближающиеся дедлайны (за 1 день)
   */
  async processUpcomingDeadlines() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 999);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tasks = await prisma.task.findMany({
      where: {
        dueDate: { gte: today, lte: tomorrow },
        status: { notIn: ['done', 'completed', 'cancelled', 'overdue'] },
        isDeleted: false,
      },
      select: { id: true, title: true, assigneeId: true, organizationId: true, dueDate: true },
    });

    let notified = 0;
    for (const task of tasks) {
      if (task.assigneeId) {
        await notificationService.sendNotification({
          type: 'general',
          title: 'Приближается дедлайн',
          message: `Задача "${task.title}" — дедлайн завтра!`,
          recipientId: task.assigneeId,
          organizationId: task.organizationId,
          link: `/tasks/${task.id}`,
        });
        notified++;
      }
    }

    return { tasks: tasks.length, notified };
  }

  // ─── Вспомогательные ──────────────────────────────────────────────────

  private calculateDueDate(frequency: string, from: Date): Date {
    const due = new Date(from);
    switch (frequency) {
      case 'daily': due.setDate(due.getDate() + 1); break;
      case 'weekly': due.setDate(due.getDate() + 7); break;
      case 'biweekly': due.setDate(due.getDate() + 14); break;
      case 'monthly': due.setMonth(due.getMonth() + 1); break;
      case 'quarterly': due.setMonth(due.getMonth() + 3); break;
      case 'yearly': due.setFullYear(due.getFullYear() + 1); break;
    }
    return due;
  }

  private calculateNextRunDate(frequency: string, from: Date, dayOfWeek?: number | null, dayOfMonth?: number | null): Date {
    const next = new Date(from);
    switch (frequency) {
      case 'daily':
        next.setDate(next.getDate() + 1);
        break;
      case 'weekly':
        next.setDate(next.getDate() + 7);
        if (dayOfWeek !== null && dayOfWeek !== undefined) {
          const diff = dayOfWeek - next.getDay();
          next.setDate(next.getDate() + (diff >= 0 ? diff : 7 + diff));
        }
        break;
      case 'biweekly':
        next.setDate(next.getDate() + 14);
        break;
      case 'monthly':
        next.setMonth(next.getMonth() + 1);
        if (dayOfMonth) next.setDate(Math.min(dayOfMonth, 28));
        break;
      case 'quarterly':
        next.setMonth(next.getMonth() + 3);
        if (dayOfMonth) next.setDate(Math.min(dayOfMonth, 28));
        break;
      case 'yearly':
        next.setFullYear(next.getFullYear() + 1);
        break;
    }
    return next;
  }
}

export default new AutomationService();
