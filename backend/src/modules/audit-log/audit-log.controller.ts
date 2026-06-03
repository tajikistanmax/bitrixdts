import { Request, Response, NextFunction } from 'express';
import { param, query, validationResult } from 'express-validator';
import auditLogService from './audit-log.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

export const listValidation = [
  query('page').optional().isInt({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 200 }),
  query('action').optional().isString(),
  query('entityType').optional().isString(),
  query('actorId').optional().isString(),
  query('dateFrom').optional().isISO8601(),
  query('dateTo').optional().isISO8601(),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID записи аудита'),
];

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      organizationId: userOrgId!,
      action: req.query.action as string,
      entityType: req.query.entityType as string,
      actorId: req.query.actorId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    };

    const result = await auditLogService.findAll(filters);

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

    const userOrgId = (req as AuthRequest).user?.organizationId;
    const log = await auditLogService.findById(req.params.id, userOrgId!);

    res.json({ success: true, data: log });
  } catch (error) {
    next(error);
  }
};
