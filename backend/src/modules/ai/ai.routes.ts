import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import aiService from './ai.service';
import { authenticate, AuthRequest } from '../auth/auth.middleware';

const router = Router();
router.use(authenticate);

// ИИ-запросы дорогие — ограничиваем частоту на пользователя
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  keyGenerator: (req) => (req as AuthRequest).user?.userId || req.ip || 'anonymous',
  message: { success: false, error: 'Слишком много запросов к ИИ-ассистенту. Подождите минуту.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Статус: настроен ли ассистент (есть ли ключ)
router.get('/status', (_req: Request, res: Response) => {
  res.json({ success: true, data: { configured: aiService.isConfigured() } });
});

// Диалог с ассистентом
router.post('/chat', aiLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId!;
    const orgId = (req as AuthRequest).user?.organizationId!;
    const result = await aiService.chat(userId, orgId, req.body.messages);
    res.json({ success: true, data: result });
  } catch (error) {
    next(error);
  }
});

export default router;
