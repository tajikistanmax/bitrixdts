import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  updateStatus,
  updateAssignee,
  remove,
  getStatistics,
  createValidation,
  idValidation,
} from './resolution.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.post('/', createValidation, create);
router.get('/', getAll);
router.get('/statistics', requireRole('admin', 'manager'), getStatistics);
router.get('/:id', idValidation, getById);
router.put('/:id/status', idValidation, updateStatus);
router.put('/:id/assignee', requireRole('admin', 'manager'), idValidation, updateAssignee);
router.delete('/:id', requireRole('admin'), idValidation, remove);

export default router;
