import { Router } from 'express';
import {
  create,
  findAll,
  findById,
  update,
  remove,
  addComment,
  getComments,
  getKanbanBoard,
  getStatistics,
  createValidation,
  idValidation,
} from './tasks.controller';
import { authenticate } from '../auth/auth.middleware';
import { requirePermission } from '../../core/middleware/rbac.middleware';
import { addOrganizationToBody, addOrganizationFilter } from '../../core/middleware/tenantIsolation';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Все запросы автоматически получают organizationId из токена
router.use(addOrganizationToBody());

// Список задач (добавляет фильтр по организации)
router.get('/', addOrganizationFilter('tasks'), findAll);
router.get('/kanban', addOrganizationFilter('tasks'), getKanbanBoard);
router.get('/statistics', getStatistics);

// Создание задачи (все могут создавать)
router.post('/', createValidation, create);

// CRUD для конкретной задачи
router.get('/:id', idValidation, requirePermission('task:read'), findById);
router.put('/:id', idValidation, requirePermission('task:update'), update);
router.delete('/:id', idValidation, requirePermission('task:delete'), remove);

// Комментарии
router.get('/:id/comments', idValidation, getComments);
router.post('/:id/comments', idValidation, addComment);

export default router;
