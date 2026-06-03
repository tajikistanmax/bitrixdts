import { Router } from 'express';
import {
  create,
  findAll,
  findById,
  update,
  remove,
  getTree,
  createValidation,
  updateValidation,
  idValidation,
} from './departments.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireRole } from '../../core/middleware/rbac.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.post('/', requireRole('admin', 'manager'), createValidation, create);
router.get('/', findAll);
router.get('/tree', getTree);
router.get('/:id', idValidation, findById);
router.patch('/:id', requireRole('admin', 'manager'), idValidation, updateValidation, update);
router.delete('/:id', requireRole('admin'), idValidation, remove);

export default router;
