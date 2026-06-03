import { Router } from 'express';
import {
  findAll,
  findById,
  listValidation,
  idValidation,
} from './audit-log.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', requireRole('admin'), listValidation, findAll);
router.get('/:id', requireRole('admin'), idValidation, findById);

export default router;
