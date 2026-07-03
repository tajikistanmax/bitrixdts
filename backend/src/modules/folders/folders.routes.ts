import { Router } from 'express';
import {
  create,
  findAll,
  findById,
  update,
  remove,
  getTree,
  getBreadcrumbs,
  createFolderValidation,
  updateFolderValidation,
  idValidation,
} from './folders.controller';
import { authenticate } from '../auth/auth.middleware';
import { addOrganizationToBody } from '../../core/middleware/tenantIsolation';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);
router.use(addOrganizationToBody());

// Дерево папок
router.get('/tree', getTree);

// Список папок (по parentId или корневые)
router.get('/', findAll);

// Создать папку
router.post('/', createFolderValidation, create);

// Получить папку по ID (с вложенными)
router.get('/:id', idValidation, findById);

// Хлебные крошки для навигации
router.get('/:id/breadcrumbs', idValidation, getBreadcrumbs);

// Обновить папку
router.put('/:id', idValidation, updateFolderValidation, update);

// Удалить папку
router.delete('/:id', idValidation, remove);

export default router;
