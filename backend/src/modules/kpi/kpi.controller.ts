import { Request, Response, NextFunction } from 'express';
import { body, param, query } from 'express-validator';
import kpiService from './kpi.service';
import { prisma } from '../../core/config/database';
import { AuthRequest } from '../auth/auth.middleware';

export const createMetricValidation = [
  body('name').isString().notEmpty().withMessage('Название метрики обязательно'),
  body('target').isNumeric().withMessage('Целевое значение должно быть числом'),
  body('weight').isNumeric().withMessage('Вес должен быть числом'),
  body('period').isString().notEmpty().withMessage('Период обязателен'),
  body('employeeId').optional().isUUID().withMessage('Неверный ID сотрудника'),
  body('departmentId').optional().isUUID().withMessage('Неверный ID отдела'),
];

export const metricIdValidation = [
  param('metricId').isUUID().withMessage('Неверный ID метрики'),
];

export const addValueValidation = [
  body('metricId').isUUID().withMessage('Неверный ID метрики'),
  body('periodDate').isISO8601().withMessage('Неверная дата периода'),
  body('actual').isNumeric().withMessage('Фактическое значение должно быть числом'),
];

export const employeeIdParamValidation = [
  param('employeeId').isUUID().withMessage('Неверный ID сотрудника'),
];

export const departmentIdParamValidation = [
  param('departmentId').isUUID().withMessage('Неверный ID отдела'),
];

class KPIController {
  async createMetric(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, target, weight, period, employeeId, departmentId } = req.body;
      const user = (req as AuthRequest).user!;

      const employee = await prisma.employee.findUnique({
        where: { id: user.userId },
        select: { organizationId: true }
      });
      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const metric = await kpiService.createMetric({
        organizationId: employee.organizationId, name,
        target: Number(target), weight: Number(weight),
        period, employeeId, departmentId
      });
      res.status(201).json({ success: true, data: metric });
    } catch (error) { next(error); }
  }

  async getMetrics(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { employeeId: empId, departmentId } = req.query;
      const employee = await prisma.employee.findUnique({
        where: { id: user.userId }, select: { organizationId: true }
      });
      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }
      const metrics = await kpiService.getMetrics(employee.organizationId, empId as string, departmentId as string);
      res.json({ success: true, data: metrics });
    } catch (error) { next(error); }
  }

  async getMetric(req: Request, res: Response, next: NextFunction) {
    try {
      const metric = await kpiService.getMetric(req.params.metricId);
      if (!metric) return res.status(404).json({ success: false, error: 'Metric not found' });
      res.json({ success: true, data: metric });
    } catch (error) { next(error); }
  }

  async updateMetric(req: Request, res: Response, next: NextFunction) {
    try {
      const metric = await kpiService.updateMetric(req.params.metricId, req.body);
      res.json({ success: true, data: metric });
    } catch (error) { next(error); }
  }

  async deleteMetric(req: Request, res: Response, next: NextFunction) {
    try {
      await kpiService.deleteMetric(req.params.metricId);
      res.json({ success: true, message: 'Metric deleted successfully' });
    } catch (error) { next(error); }
  }

  async addValue(req: Request, res: Response, next: NextFunction) {
    try {
      const { metricId, periodDate, actual } = req.body;
      const value = await kpiService.addValue({ metricId, periodDate, actual: Number(actual) });
      res.status(201).json({ success: true, data: value });
    } catch (error) { next(error); }
  }

  async getMetricValues(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      const values = await kpiService.getMetricValues(
        req.params.metricId,
        startDate ? new Date(startDate as string) : undefined,
        endDate ? new Date(endDate as string) : undefined
      );
      res.json({ success: true, data: values });
    } catch (error) { next(error); }
  }

  async calculateEmployeeKPI(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
      }
      const result = await kpiService.calculateEmployeeKPI(req.params.employeeId, new Date(startDate as string), new Date(endDate as string));
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async calculateDepartmentKPI(req: Request, res: Response, next: NextFunction) {
    try {
      const { startDate, endDate } = req.query;
      if (!startDate || !endDate) {
        return res.status(400).json({ success: false, error: 'startDate and endDate are required' });
      }
      const result = await kpiService.calculateDepartmentKPI(req.params.departmentId, new Date(startDate as string), new Date(endDate as string));
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export default new KPIController();
