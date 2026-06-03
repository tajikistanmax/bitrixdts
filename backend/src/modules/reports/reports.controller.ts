import { Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import reportsService from './reports.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const dateRangeValidation = [
  query('startDate').optional().isISO8601().withMessage('Неверная дата начала'),
  query('endDate').optional().isISO8601().withMessage('Неверная дата окончания'),
];

// Контроллеры
export const getTaskCompletion = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      organizationId: userOrgId!,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      employeeId: req.query.employeeId as string,
      departmentId: req.query.departmentId as string,
      projectId: req.query.projectId as string,
    };

    const report = await reportsService.getTaskCompletionReport(filters);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getOverdue = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      organizationId: userOrgId!,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      employeeId: req.query.employeeId as string,
      departmentId: req.query.departmentId as string,
      projectId: req.query.projectId as string,
    };

    const report = await reportsService.getOverdueReport(filters);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeWorkload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      organizationId: userOrgId!,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      employeeId: req.query.employeeId as string,
      departmentId: req.query.departmentId as string,
      projectId: req.query.projectId as string,
    };

    const report = await reportsService.getEmployeeWorkloadReport(filters);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getDepartmentEfficiency = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      organizationId: userOrgId!,
      startDate: req.query.startDate as string,
      endDate: req.query.endDate as string,
      employeeId: req.query.employeeId as string,
      departmentId: req.query.departmentId as string,
      projectId: req.query.projectId as string,
    };

    const report = await reportsService.getDepartmentEfficiencyReport(filters);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const report = await reportsService.getDashboardReport(userOrgId!);

    res.json({
      success: true,
      data: report,
    });
  } catch (error) {
    next(error);
  }
};
