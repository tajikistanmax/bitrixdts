import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import invitationsService from './invitations.service';
import { authenticate } from '../auth/auth.middleware';
import { AuthRequest } from '../auth/auth.middleware';
import { requireRole } from '../../core/middleware/rbac.middleware';

const router = Router();
router.use(authenticate);

// Пригласить одного сотрудника
router.post('/', requireRole('admin', 'hr', 'manager'), [
  body('email').isEmail().withMessage('Неверный email'),
  body('departmentId').optional().isString(),
  body('position').optional().isString(),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;
    const result = await invitationsService.invite({
      email: req.body.email,
      organizationId: orgId,
      departmentId: req.body.departmentId,
      position: req.body.position,
      invitedById: userId,
    });
    res.status(201).json({ success: true, data: result });
  } catch (error) { next(error); }
});

// Пригласить нескольких сотрудников
router.post('/bulk', requireRole('admin', 'hr'), [
  body('emails').isArray({ min: 1 }).withMessage('Список email обязателен'),
  body('emails.*').isEmail().withMessage('Неверный email'),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;
    const results = await invitationsService.inviteMultiple(req.body.emails, orgId, userId, req.body.departmentId);
    res.json({ success: true, data: results });
  } catch (error) { next(error); }
});

export default router;
