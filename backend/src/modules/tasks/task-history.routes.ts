import { Router } from 'express';
import {
  getHistory,
  getByEmployee,
  getByField,
  getStatistics,
  taskIdValidation,
} from './task-history.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// История задачи
router.get('/tasks/:taskId/history', taskIdValidation, getHistory);
router.get('/tasks/:taskId/history/statistics', taskIdValidation, getStatistics);
router.get('/tasks/history/by-employee', getByEmployee);
router.get('/tasks/history/field/:fieldName', getByField);

export default router;
