import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import newsService from './news.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

export const createValidation = [
  body('title').notEmpty().withMessage('Заголовок обязателен'),
  body('body').notEmpty().withMessage('Текст новости обязателен'),
  body('category').optional().isString(),
];

export const updateValidation = [
  body('title').optional().notEmpty(),
  body('body').optional().notEmpty(),
  body('category').optional().isString(),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID новости'),
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

    const news = await newsService.create(data);

    res.status(201).json({ success: true, data: news });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      category: req.query.category as string,
      authorId: req.query.authorId as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    };

    const result = await newsService.findAll(userOrgId!, filters);

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
    const news = await newsService.findById(req.params.id, userOrgId!);

    res.json({ success: true, data: news });
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
    const news = await newsService.update(req.params.id, userOrgId!, req.body);

    res.json({ success: true, data: news });
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
    const result = await newsService.delete(req.params.id, userOrgId!);

    res.json(result);
  } catch (error) {
    next(error);
  }
};
