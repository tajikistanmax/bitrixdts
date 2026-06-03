import { Router } from 'express';
import {
  create,
  findAll,
  findById,
  update,
  remove,
  getHistory,
  getSubordinates,
  createValidation,
  idValidation,
} from './employees.controller';
import { authenticate } from '../auth/auth.middleware';
import { requirePermission, requireRole } from '../../core/middleware/rbac.middleware';
import { addOrganizationToBody, addOrganizationFilter } from '../../core/middleware/tenantIsolation';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Все запросы автоматически получают organizationId из токена
router.use(addOrganizationToBody());

// Список сотрудников (добавляет фильтр по организации)
router.get('/', addOrganizationFilter('employees'), findAll);

// Создание сотрудника (требуется роль manager или admin или hr)
router.post('/', requireRole('admin', 'manager', 'hr'), createValidation, create);

// CRUD для конкретного сотрудника
router.get('/:id', idValidation, findById);
router.put('/:id', idValidation, requirePermission('employee:update'), update);
router.delete('/:id', idValidation, requirePermission('employee:delete'), remove);

// Доп. функции
router.get('/:id/history', idValidation, getHistory);
router.get('/:id/subordinates', idValidation, getSubordinates);

export default router;
