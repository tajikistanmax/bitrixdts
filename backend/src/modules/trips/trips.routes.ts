import { Router } from 'express';
import {
  create,
  findAll,
  findById,
  approve,
  reject,
  completeTrip,
  getStatistics,
  createValidation,
  idValidation,
} from './trips.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.post('/', createValidation, create);
router.get('/statistics', requireRole('admin', 'manager', 'hr'), getStatistics);
router.get('/', findAll);
router.get('/:id', idValidation, findById);
router.post('/:id/approve', requireRole('admin', 'manager'), idValidation, approve);
router.post('/:id/reject', requireRole('admin', 'manager'), idValidation, reject);
router.post('/:id/complete', idValidation, completeTrip);

export default router;
