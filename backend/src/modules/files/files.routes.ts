import { Router } from 'express';
import {
  upload,
  uploadFile,
  uploadMiddleware,
  downloadFile,
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

// Реальная загрузка файла (multipart/form-data)
router.post('/upload-file', uploadMiddleware, uploadFile);

// Скачивание файла
router.get('/download/:objectName(*)', downloadFile);

// Загрузка метаданных (legacy — клиент присылает готовый fileUrl)
router.post('/upload', requireRole('admin', 'manager', 'hr'), uploadValidation, upload);
router.get('/', findAll);
router.get('/entity', getByEntity);
router.get('/statistics', requireRole('admin', 'manager'), getStatistics);
router.get('/:id', idValidation, findById);
// Удаление: доступно владельцу файла (проверка прав — в сервисе), поэтому без requireRole
router.delete('/:id', idValidation, remove);

export default router;
