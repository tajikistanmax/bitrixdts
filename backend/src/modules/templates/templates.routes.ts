import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import templatesService from './templates.service';
import { authenticate } from '../auth/auth.middleware';
import { AuthRequest } from '../auth/auth.middleware';
import { addOrganizationToBody } from '../../core/middleware/tenantIsolation';
import { requireRole } from '../../core/middleware/rbac.middleware';

const router = Router();

router.use(authenticate);
router.use(addOrganizationToBody());

// ─── Task Templates ─────────────────────────────────────────────────────

router.get('/tasks', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const templates = await templatesService.getTaskTemplates(orgId);
    res.json({ success: true, data: templates });
  } catch (error) { next(error); }
});

router.post('/tasks', [
  body('name').notEmpty().withMessage('Имя шаблона обязательно'),
  body('title').notEmpty().withMessage('Заголовок задачи обязателен'),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;
    const template = await templatesService.createTaskTemplate({
      ...req.body,
      organizationId: orgId,
      createdById: userId,
    });
    res.status(201).json({ success: true, data: template });
  } catch (error) { next(error); }
});

router.get('/tasks/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const template = await templatesService.getTaskTemplate(req.params.id, orgId);
    res.json({ success: true, data: template });
  } catch (error) { next(error); }
});

router.delete('/tasks/:id', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    await templatesService.deleteTaskTemplate(req.params.id, orgId);
    res.json({ success: true, message: 'Шаблон удалён' });
  } catch (error) { next(error); }
});

// Создать задачу из шаблона
router.post('/tasks/:id/apply', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;
    const task = await templatesService.createTaskFromTemplate(req.params.id, orgId, userId, req.body);
    res.status(201).json({ success: true, data: task });
  } catch (error) { next(error); }
});

// ─── Project Templates ──────────────────────────────────────────────────

router.get('/projects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const templates = await templatesService.getProjectTemplates(orgId);
    res.json({ success: true, data: templates });
  } catch (error) { next(error); }
});

router.post('/projects', requireRole('admin', 'manager'), [
  body('name').notEmpty().withMessage('Имя шаблона обязательно'),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;
    const template = await templatesService.createProjectTemplate({
      ...req.body,
      organizationId: orgId,
      createdById: userId,
    });
    res.status(201).json({ success: true, data: template });
  } catch (error) { next(error); }
});

router.delete('/projects/:id', requireRole('admin', 'manager'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    await templatesService.deleteProjectTemplate(req.params.id, orgId);
    res.json({ success: true, message: 'Шаблон удалён' });
  } catch (error) { next(error); }
});

// Создать проект из шаблона
router.post('/projects/:id/apply', requireRole('admin', 'manager'), [
  body('name').notEmpty().withMessage('Название проекта обязательно'),
  body('ownerId').notEmpty().withMessage('Владелец обязателен'),
], async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;
    const project = await templatesService.createProjectFromTemplate(req.params.id, orgId, userId, req.body);
    res.status(201).json({ success: true, data: project });
  } catch (error) { next(error); }
});

export default router;
