import { Router } from 'express';
import {
  create,
  findAll,
  findById,
  update,
  remove,
  restore,
  addComment,
  getComments,
  getKanbanBoard,
  getStatistics,
  uploadAttachment,
  getAttachments,
  deleteAttachment,
  createSprint,
  getSprints,
  getSprint,
  updateSprintStatus,
  logTime,
  getTaskTimeReport,
  createValidation,
  updateValidation,
  idValidation,
  commentValidation,
  attachmentValidation,
  sprintValidation,
  timeValidation,
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

// Спринты
router.post('/sprints', sprintValidation, createSprint);
router.get('/sprints', getSprints);
router.get('/sprints/:sprintId', getSprint);
router.put('/sprints/:sprintId/status', updateSprintStatus);

// Создание задачи (все могут создавать)
router.post('/', createValidation, create);

// CRUD для конкретной задачи
router.get('/:id', idValidation, requirePermission('task:read'), findById);
router.put('/:id', idValidation, requirePermission('task:update'), update);
router.delete('/:id', idValidation, requirePermission('task:delete'), remove);

// Обновление статуса и назначение (удобные shorthand)
router.put('/:id/status', idValidation, requirePermission('task:update'), update);
router.put('/:id/assign', idValidation, requirePermission('task:update'), update);

// Восстановление задачи
router.post('/:id/restore', idValidation, restore);

// Комментарии
router.get('/:taskId/comments', getComments);
router.post('/:taskId/comments', commentValidation, addComment);

// Вложения
router.get('/:taskId/attachments', getAttachments);
router.post('/:taskId/attachments', attachmentValidation, uploadAttachment);
router.delete('/:taskId/attachments/:attachmentId', deleteAttachment);

// Учёт времени
router.post('/:taskId/time', timeValidation, logTime);
router.get('/:taskId/time', getTaskTimeReport);

export default router;
