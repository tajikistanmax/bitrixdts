import { Router } from 'express';
import {
  createPosition,
  findAllPositions,
  getPositionById,
  updatePosition,
  deletePosition,
  assignEmployee,
  removeAssignment,
  getStatistics,
  getOrgChart,
  createPositionValidation,
  updatePositionValidation,
  assignEmployeeValidation,
  idValidation,
} from './staff.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireRole } from '../../core/middleware/rbac.middleware';
import { addOrganizationToBody } from '../../core/middleware/tenantIsolation';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);
router.use(addOrganizationToBody());

// ─── Статистика и оргструктура ──────────────────────────────────────────────
router.get('/statistics', requireRole('admin', 'hr', 'manager'), getStatistics);
router.get('/org-chart', getOrgChart);

// ─── Позиции ────────────────────────────────────────────────────────────────
router.get('/positions', requireRole('admin', 'hr', 'manager'), findAllPositions);
router.post('/positions', requireRole('admin', 'hr'), createPositionValidation, createPosition);
router.get('/positions/:id', idValidation, requireRole('admin', 'hr', 'manager'), getPositionById);
router.put('/positions/:id', idValidation, requireRole('admin', 'hr'), updatePositionValidation, updatePosition);
router.delete('/positions/:id', idValidation, requireRole('admin', 'hr'), deletePosition);

// ─── Назначения сотрудников на позиции ──────────────────────────────────────
router.post('/positions/:id/assign', idValidation, requireRole('admin', 'hr'), assignEmployeeValidation, assignEmployee);
router.delete('/assignments/:assignmentId', requireRole('admin', 'hr'), removeAssignment);

export default router;
