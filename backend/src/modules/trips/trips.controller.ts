import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import tripsService from './trips.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('employeeId').isUUID().withMessage('Неверный ID сотрудника'),
  body('destination').notEmpty().withMessage('Направление обязательно'),
  body('purpose').notEmpty().withMessage('Цель командировки обязательна'),
  body('startDate').isISO8601().withMessage('Неверная дата начала'),
  body('endDate').isISO8601().withMessage('Неверная дата окончания'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Бюджет должен быть положительным числом'),
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

    const request = await tripsService.create(data);

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
      status: req.query.status as string,
      year: parseInt(req.query.year as string),
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await tripsService.findAll(userOrgId!, filters);

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

    const request = await tripsService.findById(id, userOrgId!);

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

    const request = await tripsService.approve(id, userOrgId!, approverId);

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

    const request = await tripsService.reject(id, userOrgId!, approverId);

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    next(error);
  }
};

export const completeTrip = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const reportUrl = req.body.reportUrl;

    const trip = await tripsService.completeTrip(id, userOrgId!, reportUrl);

    res.json({
      success: true,
      data: trip,
    });
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const stats = await tripsService.getStatistics(userOrgId!, year);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
