import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import feedService from './feed.service';
import { authenticate } from '../auth/auth.middleware';
import { AuthRequest } from '../auth/auth.middleware';

const router = Router();
router.use(authenticate);

// Получить ленту событий
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 30;
    const data = await feedService.getFeed(orgId, page, limit);
    res.json({ success: true, data: data.data, meta: { total: data.total, page } });
  } catch (error) { next(error); }
});

export default router;
