import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import announcementsService from './announcements.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

export const createValidation = [
  body('title').notEmpty().withMessage('Заголовок обязателен'),
  body('body').notEmpty().withMessage('Текст объявления обязателен'),
  body('targetDepartments').optional().isArray(),
];

export const updateValidation = [
  body('title').optional().notEmpty(),
  body('body').optional().notEmpty(),
  body('targetDepartments').optional().isArray(),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID объявления'),
];

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const user = (req as AuthRequest).user!;
    const data = {
      ...req.body,
      authorId: user.userId,
      organizationId: user.organizationId,
    };

    const announcement = await announcementsService.create(data);

    res.status(201).json({ success: true, data: announcement });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      authorId: req.query.authorId as string,
      departmentId: req.query.departmentId as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await announcementsService.findAll(userOrgId!, filters);

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
    const announcement = await announcementsService.findById(req.params.id, userOrgId!);

    res.json({ success: true, data: announcement });
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

    const userOrgId = (req as AuthRequest).user?.organizationId;
    const announcement = await announcementsService.update(req.params.id, userOrgId!, req.body);

    res.json({ success: true, data: announcement });
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

    const userOrgId = (req as AuthRequest).user?.organizationId;
    const result = await announcementsService.delete(req.params.id, userOrgId!);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
