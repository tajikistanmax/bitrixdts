import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import dashboardService from './dashboard.service';
import { authenticate } from '../auth/auth.middleware';
import { AuthRequest } from '../auth/auth.middleware';
import { requireRole } from '../../core/middleware/rbac.middleware';

const router = Router();

router.use(authenticate);

// Дашборд сотрудника (личный кабинет)
router.get('/employee', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId!;
    const orgId = (req as AuthRequest).user?.organizationId!;
    const data = await dashboardService.getEmployeeDashboard(userId, orgId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Дашборд руководителя отдела
router.get('/manager', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId!;
    const orgId = (req as AuthRequest).user?.organizationId!;
    const data = await dashboardService.getManagerDashboard(userId, orgId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Дашборд руководства (администрация)
router.get('/executive', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const data = await dashboardService.getExecutiveDashboard(orgId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

export default router;
