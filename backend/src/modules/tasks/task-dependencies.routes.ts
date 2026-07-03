import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import taskDependenciesService from './task-dependencies.service';
import { authenticate } from '../auth/auth.middleware';
import { AuthRequest } from '../auth/auth.middleware';
import { addOrganizationToBody } from '../../core/middleware/tenantIsolation';

const router = Router();

router.use(authenticate);
router.use(addOrganizationToBody());

// Получить данные для Ганта
router.get('/gantt', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const projectId = req.query.projectId as string | undefined;
    const data = await taskDependenciesService.getGanttData(orgId, projectId);
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

// Получить зависимости задачи
router.get('/:taskId/dependencies', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const deps = await taskDependenciesService.getForTask(req.params.taskId);
    res.json({ success: true, data: deps });
  } catch (error) { next(error); }
});

// Создать зависимость
router.post(
  '/:taskId/dependencies',
  [
    body('predecessorId').notEmpty().withMessage('ID предшественника обязателен'),
    body('type').optional().isIn(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish']),
    body('lagDays').optional().isInt(),
  ],
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const orgId = (req as AuthRequest).user?.organizationId!;
      const dep = await taskDependenciesService.create({
        predecessorId: req.body.predecessorId,
        successorId: req.params.taskId,
        type: req.body.type,
        lagDays: req.body.lagDays,
      }, orgId);
      res.status(201).json({ success: true, data: dep });
    } catch (error) { next(error); }
  }
);

// Удалить зависимость
router.delete('/dependencies/:depId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await taskDependenciesService.delete(req.params.depId);
    res.json({ success: true, message: 'Зависимость удалена' });
  } catch (error) { next(error); }
});

export default router;
