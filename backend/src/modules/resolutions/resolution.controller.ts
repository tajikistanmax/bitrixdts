import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import resolutionService, { Resolution } from './resolution.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('documentId').isUUID().withMessage('Неверный ID документа'),
  body('text').notEmpty().withMessage('Текст резолюции обязателен'),
  body('executorId').optional().isUUID().withMessage('Неверный ID исполнителя'),
  body('controllerId').optional().isUUID().withMessage('Неверный ID контролёра'),
  body('deadline').optional().isISO8601().withMessage('Неверная дата дедлайна'),
  body('priority').optional().isIn(['low', 'normal', 'high', 'critical']).withMessage('Неверный приоритет'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID'),
];

// Контроллеры
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const data: Resolution = req.body;
    const userId = (req as AuthRequest).user?.userId || 'system';

    const resolution = await resolutionService.create({ ...data, createdBy: userId });

    res.status(201).json({
      success: true,
      data: resolution,
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      documentId: req.query.documentId as string,
      executorId: req.query.executorId as string,
      controllerId: req.query.controllerId as string,
      status: req.query.status as string,
      priority: req.query.priority as string,
      overdue: req.query.overdue === 'true',
    };

    const resolutions = await resolutionService.getResolutions(userOrgId!, filters);

    res.json({
      success: true,
      data: resolutions,
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const resolution = await resolutionService.getById(id, userOrgId!);

    res.json({
      success: true,
      data: resolution,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId || 'system';
    const { status, comment } = req.body;

    const resolution = await resolutionService.updateStatus(id, userOrgId!, status, userId, comment);

    res.json({
      success: true,
      data: resolution,
    });
  } catch (error) {
    next(error);
  }
};

export const updateAssignee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId || 'system';
    const { executorId, controllerId } = req.body;

    const resolution = await resolutionService.updateAssignee(id, userOrgId!, executorId, controllerId, userId);

    res.json({
      success: true,
      data: resolution,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const result = await resolutionService.delete(id, userOrgId!);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const departmentId = req.query.departmentId as string;

    const stats = await resolutionService.getStatistics(userOrgId!, departmentId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
