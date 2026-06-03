import { Router } from 'express';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { validate } from '../../core/middleware/errorHandler';
import multer from 'multer';
import documentsController, { uploadDocumentValidation, documentIdValidation, approveDocumentValidation } from './documents.controller';

const router = Router();
const upload = multer({ storage: multer.memoryStorage() });

// Все маршруты требуют аутентификации
router.use(authenticate);

// Загрузка и получение документов
router.post('/upload', upload.single('file'), uploadDocumentValidation, validate, requireRole('admin', 'manager', 'hr'), documentsController.uploadDocument);
router.get('/', documentsController.getDocuments);
router.get('/:documentId', documentIdValidation, validate, documentsController.getDocument);

// Обновление и удаление
router.put('/:documentId', documentIdValidation, validate, requireRole('admin', 'manager'), documentsController.updateDocument);
router.delete('/:documentId', documentIdValidation, validate, requireRole('admin'), documentsController.deleteDocument);

// Согласование
router.post('/:documentId/approval/initiate', documentIdValidation, validate, requireRole('admin', 'manager'), documentsController.initiateApproval);
router.post('/:documentId/approvals/:approvalId', approveDocumentValidation, validate, documentsController.approveDocument);

// Версионность
router.post('/:documentId/versions', upload.single('file'), documentIdValidation, validate, requireRole('admin', 'manager', 'hr'), documentsController.addVersion);
router.get('/:documentId/versions', documentIdValidation, validate, documentsController.getVersions);

export default router;
