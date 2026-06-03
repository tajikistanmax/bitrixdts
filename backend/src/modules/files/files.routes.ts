import { Router } from 'express';
import {
  upload,
  findById,
  findAll,
  remove,
  getByEntity,
  getStatistics,
  uploadValidation,
  idValidation,
} from './files.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.post('/upload', requireRole('admin', 'manager', 'hr'), uploadValidation, upload);
router.get('/', findAll);
router.get('/entity', getByEntity);
router.get('/statistics', requireRole('admin', 'manager'), getStatistics);
router.get('/:id', idValidation, findById);
router.delete('/:id', requireRole('admin', 'manager'), idValidation, remove);

export default router;
