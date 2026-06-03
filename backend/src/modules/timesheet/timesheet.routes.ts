import { Router } from 'express';
import {
  create,
  findAll,
  findById,
  update,
  approve,
  reject,
  generateFromAttendance,
  getMonthStats,
  createValidation,
  idValidation,
} from './timesheet.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.post('/', createValidation, create);
router.post('/generate-from-attendance', requireRole('admin', 'manager', 'hr'), createValidation, generateFromAttendance);
router.get('/month-stats', requireRole('admin', 'manager', 'hr'), getMonthStats);
router.get('/', findAll);
router.get('/:id', idValidation, findById);
router.patch('/:id', idValidation, update);
router.post('/:id/approve', requireRole('admin', 'manager'), idValidation, approve);
router.post('/:id/reject', requireRole('admin', 'manager'), idValidation, reject);

export default router;
