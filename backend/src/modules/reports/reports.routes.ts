import { Router } from 'express';
import {
  getTaskCompletion,
  getOverdue,
  getEmployeeWorkload,
  getDepartmentEfficiency,
  getDashboard,
  dateRangeValidation,
} from './reports.controller';
import { authenticate } from '../auth/auth.middleware';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Root
router.get('/', getDashboard);

// Отчёты
router.get('/dashboard', getDashboard);
router.get('/task-completion', dateRangeValidation, getTaskCompletion);
router.get('/overdue', dateRangeValidation, getOverdue);
router.get('/employee-workload', getEmployeeWorkload);
router.get('/department-efficiency', getDepartmentEfficiency);

export default router;
