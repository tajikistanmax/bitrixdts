import cron from 'node-cron';
import prisma from '../config/database';
import logger from '../config/logger';

/**
 * Cron: Каждый день в 07:00 создаёт задачи из шаблонов повторяющихся задач
 */
export function startRecurringTasksCron() {
  cron.schedule('0 7 * * *', async () => {
    logger.info('[Cron] Processing recurring tasks...');

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Найти все активные повторяющиеся задачи, которые нужно создать сегодня
      const recurringTasks = await prisma.recurringTask.findMany({
        where: {
          isActive: true,
          nextRunDate: { lte: today },
          OR: [
            { endDate: null },
            { endDate: { gte: today } },
          ],
        },
      });

      if (recurringTasks.length === 0) {
        logger.info('[Cron] No recurring tasks to process');
        return;
      }

      logger.info(`[Cron] Found ${recurringTasks.length} recurring tasks to create`);

      for (const rt of recurringTasks) {
        try {
          // Создать задачу
          const task = await prisma.task.create({
            data: {
              organizationId: rt.organizationId,
              title: rt.title,
              description: rt.description,
              assigneeId: rt.assigneeId,
              controllerId: rt.controllerId,
              projectId: rt.projectId,
              priority: rt.priority,
              tags: rt.tags as any,
              checklist: rt.checklist as any,
              creatorId: rt.createdById,
              status: 'new',
              dueDate: calculateDueDate(rt.frequency, today),
            },
          });

          // Рассчитать следующую дату запуска
          const nextDate = calculateNextRunDate(rt.frequency, today, rt.dayOfWeek, rt.dayOfMonth);

          // Обновить повторяющуюся задачу
          await prisma.recurringTask.update({
            where: { id: rt.id },
            data: {
              lastCreatedTaskId: task.id,
              nextRunDate: nextDate,
            },
          });

          logger.info(`[Cron] Created task "${task.title}" from recurring ${rt.id}, next: ${nextDate.toISOString()}`);
        } catch (err) {
          logger.error(`[Cron] Failed to create recurring task ${rt.id}:`, err);
        }
      }

      logger.info(`[Cron] Recurring tasks processing complete`);
    } catch (error) {
      logger.error('[Cron] Error processing recurring tasks:', error);
    }
  });

  logger.info('[Cron] Recurring tasks scheduler active (daily at 07:00)');
}

function calculateNextRunDate(frequency: string, fromDate: Date, dayOfWeek?: number | null, dayOfMonth?: number | null): Date {
  const next = new Date(fromDate);

  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      if (dayOfMonth) next.setDate(Math.min(dayOfMonth, new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()));
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
    default:
      next.setDate(next.getDate() + 7);
  }

  return next;
}

function calculateDueDate(frequency: string, startDate: Date): Date {
  const due = new Date(startDate);

  switch (frequency) {
    case 'daily':
      due.setDate(due.getDate() + 1);
      break;
    case 'weekly':
      due.setDate(due.getDate() + 5); // 5 рабочих дней
      break;
    case 'biweekly':
      due.setDate(due.getDate() + 10);
      break;
    case 'monthly':
      due.setDate(due.getDate() + 25);
      break;
    case 'quarterly':
      due.setMonth(due.getMonth() + 3);
      break;
    case 'yearly':
      due.setMonth(due.getMonth() + 11);
      break;
    default:
      due.setDate(due.getDate() + 7);
  }

  return due;
}
