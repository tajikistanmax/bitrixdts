import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import timesheetService from './timesheet.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('employeeId').isUUID().withMessage('Неверный ID сотрудника'),
  body('periodMonth').isISO8601().withMessage('Неверный период (YYYY-MM)'),
  body('data').isArray().withMessage('Данные должны быть массивом'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID табеля'),
];

// Контроллеры
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const data = req.body;

    const timesheet = await timesheetService.create(data);

    res.status(201).json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    next(error);
  }
};

export const generateFromAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.body.employeeId;
    const periodMonth = req.body.periodMonth;
    const organizationId = req.body.organizationId;

    const data = await timesheetService.generateFromAttendance(employeeId, periodMonth, organizationId);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      employeeId: req.query.employeeId as string,
      departmentId: req.query.departmentId as string,
      periodMonth: req.query.periodMonth as string,
      status: req.query.status as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await timesheetService.findAll(userOrgId!, filters);

    res.json({
      success: true,
      data: result.data,
      meta: {
        total: result.total,
        page: result.page,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const findById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const timesheet = await timesheetService.findById(id, userOrgId!);

    res.json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const data = req.body;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const timesheet = await timesheetService.update(id, userOrgId!, data);

    res.json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    next(error);
  }
};

export const approve = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const approverId = (req as AuthRequest).user?.userId!;

    const timesheet = await timesheetService.approve(id, userOrgId!, approverId);

    res.json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    next(error);
  }
};

export const reject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const approverId = (req as AuthRequest).user?.userId!;
    const comment = req.body.comment;

    const timesheet = await timesheetService.reject(id, userOrgId!, approverId, comment);

    res.json({
      success: true,
      data: timesheet,
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthStats = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.body.employeeId;
    const periodMonth = req.body.periodMonth;
    const organizationId = req.body.organizationId;

    const stats = await timesheetService.getMonthStats(employeeId, periodMonth, organizationId);

    if (!stats) {
      throw new AppError('Табель за этот период не найден', 404);
    }

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
