import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import vacationsService from './vacations.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('employeeId').isUUID().withMessage('Неверный ID сотрудника'),
  body('type').isIn(['annual', 'unpaid', 'study']).withMessage('Неверный тип отпуска'),
  body('startDate').isISO8601().withMessage('Неверная дата начала'),
  body('endDate').isISO8601().withMessage('Неверная дата окончания'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID заявки'),
];

// Контроллеры
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const data = req.body;

    const request = await vacationsService.create(data);

    res.status(201).json({
      success: true,
      data: request,
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
      type: req.query.type as string,
      status: req.query.status as string,
      year: parseInt(req.query.year as string),
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await vacationsService.findAll(userOrgId!, filters);

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

    const request = await vacationsService.findById(id, userOrgId!);

    res.json({
      success: true,
      data: request,
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

    const request = await vacationsService.approve(id, userOrgId!, approverId);

    res.json({
      success: true,
      data: request,
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

    const request = await vacationsService.reject(id, userOrgId!, approverId);

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const getVacationBalance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const employeeId = req.body.employeeId;
    const organizationId = req.body.organizationId;
    const year = parseInt(req.body.year) || new Date().getFullYear();

    const balance = await vacationsService.getVacationBalance(employeeId, organizationId, year);

    res.json({
      success: true,
      data: balance,
    });
  } catch (error) {
    next(error);
  }
};

export const getUpcomingVacations = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const daysAhead = parseInt(req.query.daysAhead as string) || 30;

    const vacations = await vacationsService.getUpcomingVacations(userOrgId!, daysAhead);

    res.json({
      success: true,
      data: vacations,
    });
  } catch (error) {
    next(error);
  }
};
