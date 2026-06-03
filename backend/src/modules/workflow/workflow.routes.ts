import { Router } from 'express';
import {
  createRoute,
  getRoutes,
  getRouteById,
  updateRoute,
  deleteRoute,
  startWorkflow,
  getInstance,
  approveStep,
  rejectStep,
  cancelWorkflow,
  getActiveForEmployee,
  createRouteValidation,
  startWorkflowValidation,
  idValidation,
} from './workflow.controller';
import { authenticate, requireRole } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Root
router.get('/', getRoutes);

// Роуты согласований
router.post('/routes', requireRole('admin', 'manager'), createRouteValidation, createRoute);
router.get('/routes', getRoutes);
router.get('/routes/my-active', getActiveForEmployee);
router.get('/routes/:id', idValidation, getRouteById);
router.put('/routes/:id', requireRole('admin', 'manager'), idValidation, updateRoute);
router.delete('/routes/:id', requireRole('admin'), idValidation, deleteRoute);

// Инстансы workflow
router.post('/start', startWorkflowValidation, startWorkflow);
router.get('/instances/:id', idValidation, getInstance);
router.put('/instances/:id/approve/:stepOrder', idValidation, approveStep);
router.put('/instances/:id/reject/:stepOrder', idValidation, rejectStep);
router.put('/instances/:id/cancel', idValidation, cancelWorkflow);

export default router;
