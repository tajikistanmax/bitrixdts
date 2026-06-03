import { Router } from 'express';
import {
  create,
  getAll,
  getActiveForEmployee,
  getDeputies,
  update,
  deactivate,
  remove,
  setDeputyForPosition,
  createValidation,
  idValidation,
} from './delegation.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.post('/', createValidation, create);
router.get('/', getAll);
router.get('/my-active', getActiveForEmployee);
router.get('/employee/:id/deputies', idValidation, getDeputies);
router.put('/:id', idValidation, update);
router.put('/:id/deactivate', idValidation, deactivate);
router.delete('/:id', requireRole('admin'), idValidation, remove);
router.post('/position', requireRole('admin', 'manager'), setDeputyForPosition);

export default router;
