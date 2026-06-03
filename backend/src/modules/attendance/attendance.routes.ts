import { Router } from 'express';
import {
  checkIn,
  checkOut,
  findAll,
  findById,
  getTodayAttendance,
  getStatistics,
  checkInValidation,
  checkOutValidation,
  idValidation,
} from './attendance.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Чек-ин/чек-аут
router.post('/check-in', checkInValidation, checkIn);
router.post('/check-out', checkOutValidation, checkOut);

// Список и статистика
router.get('/today', getTodayAttendance);
router.get('/statistics', requireRole('admin', 'manager', 'hr'), getStatistics);
router.get('/', findAll);
router.get('/:id', idValidation, findById);

export default router;
