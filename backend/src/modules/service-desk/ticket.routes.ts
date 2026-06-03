import { Router } from 'express';
import {
  create,
  getAll,
  getById,
  update,
  updateStatus,
  assign,
  addComment,
  getStatistics,
  createValidation,
  idValidation,
} from './ticket.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.post('/', createValidation, create);
router.get('/', getAll);
router.get('/statistics', requireRole('admin', 'manager'), getStatistics);
router.get('/:id', idValidation, getById);
router.put('/:id', idValidation, update);
router.put('/:id/status', idValidation, updateStatus);
router.put('/:id/assign', requireRole('admin', 'manager'), idValidation, assign);
router.post('/:id/comment', idValidation, addComment);

export default router;
