import cron from 'node-cron';
import prisma from '../config/database';
import logger from '../config/logger';
import notificationService from '../../modules/notifications/notifications.service';

/**
 * Cron: Каждый день в 09:00 отправляет напоминания о встречах и дедлайнах
 */
export function startRemindersCron() {
  // Напоминания о встречах (каждые 15 минут)
  cron.schedule('*/15 * * * *', async () => {
    try {
      const now = new Date();
      const in30min = new Date(now.getTime() + 30 * 60 * 1000);

      // Найти встречи, которые начнутся через 30 минут
      const upcomingMeetings = await prisma.calendarEvent.findMany({
        where: {
          startTime: { gte: now, lte: in30min },
          eventType: 'meeting',
        },
        select: { id: true, title: true, startTime: true, organizationId: true, createdById: true, employeeId: true },
      });

      for (const meeting of upcomingMeetings) {
        const recipientId = meeting.employeeId || meeting.createdById;
        if (recipientId) {
          await notificationService.sendNotification({
            type: 'general',
            title: 'Напоминание о встрече',
            message: `Встреча "${meeting.title}" начнётся через 30 минут`,
            recipientId,
            organizationId: meeting.organizationId,
            link: `/calendar?event=${meeting.id}`,
          });
        }
      }

      if (upcomingMeetings.length > 0) {
        logger.debug(`[Cron] Sent ${upcomingMeetings.length} meeting reminders`);
      }
    } catch (error) {
      logger.error('[Cron] Error sending meeting reminders:', error);
    }
  });

  // Напоминания о дедлайнах задач (каждый день в 09:00)
  cron.schedule('0 9 * * *', async () => {
    logger.info('[Cron] Checking task deadlines...');

    try {
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      // Задачи с дедлайном завтра
      const tasksDueTomorrow = await prisma.task.findMany({
        where: {
          isDeleted: false,
          status: { notIn: ['done', 'cancelled'] },
          dueDate: {
            gte: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()),
            lt: new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate() + 1),
          },
          assigneeId: { not: null },
        },
        select: { id: true, title: true, assigneeId: true, organizationId: true, dueDate: true },
      });

      for (const task of tasksDueTomorrow) {
        if (task.assigneeId) {
          await notificationService.sendNotification({
            type: 'general',
            title: 'Дедлайн завтра',
            message: `Задача "${task.title}" должна быть выполнена завтра`,
            recipientId: task.assigneeId,
            organizationId: task.organizationId,
            link: `/tasks/${task.id}`,
          });
        }
      }

      logger.info(`[Cron] Sent ${tasksDueTomorrow.length} deadline reminders`);
    } catch (error) {
      logger.error('[Cron] Error checking deadlines:', error);
    }
  });

  // Ежедневный отчёт руководителям (каждый день в 18:00)
  cron.schedule('0 18 * * 1-5', async () => {
    logger.info('[Cron] Generating daily manager reports...');

    try {
      const now = new Date();
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Найти всех руководителей отделов
      const departments = await prisma.department.findMany({
        where: { headId: { not: null } },
        select: { id: true, name: true, headId: true, organizationId: true },
      });

      for (const dept of departments) {
        if (!dept.headId) continue;

        // Считаем задачи за сегодня
        const deptEmployees = await prisma.employee.findMany({
          where: { departmentId: dept.id, status: 'active' },
          select: { id: true },
        });
        const empIds = deptEmployees.map(e => e.id);

        const [completed, created, overdue] = await Promise.all([
          prisma.task.count({ where: { assigneeId: { in: empIds }, status: 'done', updatedAt: { gte: todayStart } } }),
          prisma.task.count({ where: { assigneeId: { in: empIds }, createdAt: { gte: todayStart } } }),
          prisma.task.count({ where: { assigneeId: { in: empIds }, status: { notIn: ['done', 'cancelled'] }, dueDate: { lt: now } } }),
        ]);

        await notificationService.sendNotification({
          type: 'general',
          title: `Дневной отчёт: ${dept.name}`,
          message: `Выполнено: ${completed} | Создано: ${created} | Просрочено: ${overdue}`,
          recipientId: dept.headId,
          organizationId: dept.organizationId,
          link: '/dashboard/manager',
        });
      }

      logger.info(`[Cron] Sent daily reports to ${departments.length} managers`);
    } catch (error) {
      logger.error('[Cron] Error generating daily reports:', error);
    }
  });

  logger.info('[Cron] Reminders scheduler active (meetings every 15min, deadlines at 09:00, reports at 18:00)');
}
