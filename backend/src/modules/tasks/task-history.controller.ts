import { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import taskHistoryService from './task-history.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const taskIdValidation = [
  param('taskId').isUUID().withMessage('Неверный ID задачи'),
];

// Контроллеры
export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const taskId = req.params.taskId;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const history = await taskHistoryService.getHistory(taskId, userOrgId!);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

export const getByEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;
    const limit = parseInt(req.query.limit as string) || 50;

    const history = await taskHistoryService.getByEmployee(userId!, userOrgId!, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

export const getByField = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const fieldName = req.params.fieldName;
    const taskId = req.query.taskId as string;
    const limit = parseInt(req.query.limit as string) || 100;

    const history = await taskHistoryService.getByField(fieldName, taskId, limit);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const taskId = req.params.taskId;

    const stats = await taskHistoryService.getStatistics(taskId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
