import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import automationService from './automation.service';
import { authenticate } from '../auth/auth.middleware';
import { AuthRequest } from '../auth/auth.middleware';
import { requireRole } from '../../core/middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

// Ручной запуск автоматизаций (только admin — для отладки)
router.post('/run/overdue', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await automationService.processOverdueTasks();
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.post('/run/recurring', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await automationService.processRecurringTasks();
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.post('/run/deadlines', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await automationService.processUpcomingDeadlines();
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

router.post('/run/digests', requireRole('admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await automationService.sendDailyDigests();
    res.json({ success: true, data: result });
  } catch (error) { next(error); }
});

export default router;
