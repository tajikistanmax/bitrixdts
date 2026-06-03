import { Router } from 'express';
import {
  create,
  findAll,
  findById,
  update,
  remove,
  createValidation,
  updateValidation,
  idValidation,
} from './announcements.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', findAll);
router.get('/:id', idValidation, findById);
router.post('/', createValidation, requireRole('admin', 'manager', 'hr'), create);
router.put('/:id', idValidation, updateValidation, requireRole('admin', 'manager', 'hr'), update);
router.delete('/:id', idValidation, requireRole('admin'), remove);

export default router;
