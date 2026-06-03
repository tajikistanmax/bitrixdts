import { Router } from 'express';
import { authenticate, requireRole } from '../auth/auth.middleware';
import { validate } from '../../core/middleware/errorHandler';
import kpiController, { createMetricValidation, metricIdValidation, addValueValidation, employeeIdParamValidation, departmentIdParamValidation } from './kpi.controller';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD метрик (только admin/manager могут управлять метриками)
router.post('/', createMetricValidation, validate, requireRole('admin', 'manager'), kpiController.createMetric);
router.get('/', kpiController.getMetrics);
router.get('/:metricId', metricIdValidation, validate, kpiController.getMetric);
router.put('/:metricId', metricIdValidation, validate, requireRole('admin', 'manager'), kpiController.updateMetric);
router.delete('/:metricId', metricIdValidation, validate, requireRole('admin'), kpiController.deleteMetric);

// Значения метрик
router.post('/values', addValueValidation, validate, requireRole('admin', 'manager'), kpiController.addValue);
router.get('/:metricId/values', metricIdValidation, validate, kpiController.getMetricValues);

// Расчет KPI
router.post('/calculate/employee/:employeeId', employeeIdParamValidation, validate, requireRole('admin', 'manager', 'hr'), kpiController.calculateEmployeeKPI);
router.post('/calculate/department/:departmentId', departmentIdParamValidation, validate, requireRole('admin', 'manager'), kpiController.calculateDepartmentKPI);

export default router;
