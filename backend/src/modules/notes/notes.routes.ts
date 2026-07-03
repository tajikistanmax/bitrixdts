import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import notesService from './notes.service';
import { authenticate } from '../auth/auth.middleware';
import { AuthRequest } from '../auth/auth.middleware';

const router = Router();
router.use(authenticate);

// Получить заметки
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId!;
    const orgId = (req as AuthRequest).user?.organizationId!;
    const page = parseInt(req.query.page as string) || 1;
    const result = await notesService.getNotes(userId, orgId, page);
    res.json({ success: true, data: result.data, meta: { total: result.total, page: result.page, channelId: result.channelId } });
  } catch (error) { next(error); }
});

// Создать заметку
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId!;
    const orgId = (req as AuthRequest).user?.organizationId!;
    const note = await notesService.createNote(userId, orgId, req.body.body);
    res.status(201).json({ success: true, data: note });
  } catch (error) { next(error); }
});

// Обновить заметку
router.put('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId!;
    const note = await notesService.updateNote(req.params.id, userId, req.body.body);
    res.json({ success: true, data: note });
  } catch (error) { next(error); }
});

// Удалить заметку
router.delete('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId!;
    await notesService.deleteNote(req.params.id, userId);
    res.json({ success: true, message: 'Заметка удалена' });
  } catch (error) { next(error); }
});

export default router;
