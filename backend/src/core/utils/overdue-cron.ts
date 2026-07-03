import cron from 'node-cron';
import logger from '../config/logger';
import automationService from '../../modules/automation/automation.service';

/**
 * Все фоновые задачи платформы:
 * 1. Каждый день 08:00 — проверка просроченных задач + уведомление руководителей
 * 2. Каждый день 07:00 — создание повторяющихся задач
 * 3. Каждый день 09:00 — отправка дайджестов руководителям
 * 4. Каждый день 18:00 — напоминания о приближающихся дедлайнах
 */
export function startOverdueCron() {
  // 1. Просроченные задачи — каждый день в 08:00
  cron.schedule('0 8 * * *', async () => {
    logger.info('[Cron] Processing overdue tasks...');
    try {
      const result = await automationService.processOverdueTasks();
      logger.info(`[Cron] Overdue: ${result.processed} tasks processed, ${result.managersNotified} managers notified`);
    } catch (error) {
      logger.error('[Cron] Error processing overdue tasks:', error);
    }
  });

  // 2. Повторяющиеся задачи — каждый день в 07:00
  cron.schedule('0 7 * * *', async () => {
    logger.info('[Cron] Processing recurring tasks...');
    try {
      const result = await automationService.processRecurringTasks();
      logger.info(`[Cron] Recurring: ${result.created} tasks created`);
    } catch (error) {
      logger.error('[Cron] Error processing recurring tasks:', error);
    }
  });

  // 3. Ежедневные дайджесты руководителям — каждый день в 09:00
  cron.schedule('0 9 * * *', async () => {
    logger.info('[Cron] Sending daily digests...');
    try {
      const result = await automationService.sendDailyDigests();
      logger.info(`[Cron] Digests: ${result.managersNotified} managers notified`);
    } catch (error) {
      logger.error('[Cron] Error sending digests:', error);
    }
  });

  // 4. Напоминания о дедлайнах — каждый день в 18:00
  cron.schedule('0 18 * * *', async () => {
    logger.info('[Cron] Processing upcoming deadlines...');
    try {
      const result = await automationService.processUpcomingDeadlines();
      logger.info(`[Cron] Deadlines: ${result.notified} reminders sent`);
    } catch (error) {
      logger.error('[Cron] Error processing deadlines:', error);
    }
  });

  logger.info('[Cron] All scheduled jobs registered:');
  logger.info('  - 07:00 Recurring tasks');
  logger.info('  - 08:00 Overdue checker');
  logger.info('  - 09:00 Daily digests');
  logger.info('  - 18:00 Deadline reminders');
}
