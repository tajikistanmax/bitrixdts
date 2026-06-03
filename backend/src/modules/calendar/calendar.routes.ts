import { Router } from 'express';
import {
  create,
  getEvents,
  getDeadlines,
  getReminders,
  update,
  remove,
  getMonthlyView,
  createValidation,
  updateValidation,
  idValidation,
} from './calendar.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.post('/', createValidation, create);
router.get('/', getEvents);
router.get('/deadlines', getDeadlines);
router.get('/reminders', getReminders);
router.get('/month', getMonthlyView);
router.put('/:id', idValidation, updateValidation, update);
router.delete('/:id', idValidation, remove);

export default router;
