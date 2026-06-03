import { Router } from 'express';
import {
  create,
  findAll,
  findById,
  verify,
  close,
  getStatistics,
  createValidation,
  idValidation,
} from './sickleaves.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.post('/', createValidation, create);
router.get('/statistics', requireRole('admin', 'manager', 'hr'), getStatistics);
router.get('/', findAll);
router.get('/:id', idValidation, findById);
router.post('/:id/verify', requireRole('admin', 'hr'), idValidation, verify);
router.post('/:id/close', requireRole('admin', 'hr'), idValidation, close);

export default router;
