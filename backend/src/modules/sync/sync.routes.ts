import { Router } from 'express';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { validate } from '../../core/middleware/errorHandler';
import syncController, { addToQueueValidation, syncItemIdValidation } from './sync.controller';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Очередь синхронизации
router.post('/queue', addToQueueValidation, validate, requireRole('admin'), syncController.addToQueue);
router.get('/queue', syncController.getQueue);
router.post('/queue/:itemId/process', syncItemIdValidation, validate, syncController.processItem);
router.post('/queue/process-all', requireRole('admin'), syncController.processQueue);

// Статистика
router.get('/stats', syncController.getStats);

// Принудительная синхронизация
router.post('/force-sync', requireRole('admin'), syncController.forceSync);

export default router;
