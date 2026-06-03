import { Router } from 'express';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  getUnreadCount,
  deleteNotification,
  idValidation,
} from './notifications.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/:id/read', idValidation, markAsRead);
router.put('/mark-all-read', markAllAsRead);
router.delete('/:id', idValidation, deleteNotification);

export default router;
