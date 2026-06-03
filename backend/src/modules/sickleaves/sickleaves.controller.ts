import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import sickleavesService from './sickleaves.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('employeeId').isUUID().withMessage('Неверный ID сотрудника'),
  body('documentNumber').notEmpty().withMessage('Номер листа нетрудоспособности обязателен'),
  body('issueDate').isISO8601().withMessage('Неверная дата выдачи'),
  body('startDate').isISO8601().withMessage('Неверная дата начала'),
  body('endDate').optional().isISO8601().withMessage('Неверная дата окончания'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID больничного'),
];

// Контроллеры
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const data = req.body;

    const sickLeave = await sickleavesService.create(data);

    res.status(201).json({
      success: true,
      data: sickLeave,
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

    const result = await sickleavesService.findAll(userOrgId!, filters);

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

    const sickLeave = await sickleavesService.findById(id, userOrgId!);

    res.json({
      success: true,
      data: sickLeave,
    });
  } catch (error) {
    next(error);
  }
};

export const verify = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const verifiedById = (req as AuthRequest).user?.userId!;

    const sickLeave = await sickleavesService.verify(id, userOrgId!, verifiedById);

    res.json({
      success: true,
      data: sickLeave,
    });
  } catch (error) {
    next(error);
  }
};

export const close = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const endDate = req.body.endDate;

    const sickLeave = await sickleavesService.close(id, userOrgId!, endDate);

    res.json({
      success: true,
      data: sickLeave,
    });
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();

    const stats = await sickleavesService.getStatistics(userOrgId!, year);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
