import { Router } from 'express';
import {
  create,
  findAll,
  findById,
  approve,
  reject,
  getVacationBalance,
  getUpcomingVacations,
  createValidation,
  idValidation,
} from './vacations.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.post('/', createValidation, create);
router.get('/upcoming', getUpcomingVacations);
router.get('/balance', getVacationBalance);
router.get('/', findAll);
router.get('/:id', idValidation, findById);
router.post('/:id/approve', requireRole('admin', 'manager', 'hr'), idValidation, approve);
router.post('/:id/reject', requireRole('admin', 'manager', 'hr'), idValidation, reject);

export default router;
