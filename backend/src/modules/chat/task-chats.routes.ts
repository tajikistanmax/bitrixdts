import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import taskChatsService from './task-chats.service';
import { authenticate } from '../auth/auth.middleware';
import { AuthRequest } from '../auth/auth.middleware';

const router = Router();
router.use(authenticate);

// Список моих чатов задач
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId!;
    const orgId = (req as AuthRequest).user?.organizationId!;
    const chats = await taskChatsService.getMyTaskChats(userId, orgId);
    res.json({ success: true, data: chats });
  } catch (error) { next(error); }
});

// Получить/создать чат для конкретной задачи
router.get('/:taskId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId!;
    const orgId = (req as AuthRequest).user?.organizationId!;
    const chat = await taskChatsService.getOrCreateTaskChat(req.params.taskId, orgId, userId);
    res.json({ success: true, data: chat });
  } catch (error) { next(error); }
});

export default router;
