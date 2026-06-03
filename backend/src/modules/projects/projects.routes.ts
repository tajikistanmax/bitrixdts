import { Router } from 'express';
import {
  create,
  findAll,
  findById,
  update,
  remove,
  restore,
  addMember,
  updateMemberRole,
  removeMember,
  getMembers,
  getStatistics,
  createValidation,
  updateValidation,
  idValidation,
  memberValidation,
} from './projects.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireRole } from '../../core/middleware/rbac.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD
router.post('/', requireRole('admin', 'manager'), createValidation, create);
router.get('/', findAll);
router.get('/statistics', getStatistics);
router.get('/:id', idValidation, findById);
router.patch('/:id', requireRole('admin', 'manager'), idValidation, updateValidation, update);
router.delete('/:id', requireRole('admin'), idValidation, remove);
router.post('/:id/restore', requireRole('admin'), idValidation, restore);

// Участники проекта
router.post('/:id/members', requireRole('admin', 'manager'), idValidation, memberValidation, addMember);
router.get('/:id/members', idValidation, getMembers);
router.patch('/:id/members/:employeeId/role', requireRole('admin', 'manager'), idValidation, memberValidation, updateMemberRole);
router.delete('/:id/members/:employeeId', requireRole('admin', 'manager'), idValidation, removeMember);

export default router;
