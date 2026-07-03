import { Router } from 'express';
import { Request, Response, NextFunction } from 'express';
import searchService from './search.service';
import { authenticate } from '../auth/auth.middleware';
import { AuthRequest } from '../auth/auth.middleware';

const router = Router();

router.use(authenticate);

// Глобальный поиск
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const query = req.query.q as string;
    const types = req.query.types ? (req.query.types as string).split(',') : undefined;
    const limit = parseInt(req.query.limit as string) || 20;

    if (!query || query.trim().length < 2) {
      return res.json({ success: true, data: { results: [], total: 0 } });
    }

    const data = await searchService.globalSearch(orgId, { query, types, limit });
    res.json({ success: true, data });
  } catch (error) { next(error); }
});

export default router;
