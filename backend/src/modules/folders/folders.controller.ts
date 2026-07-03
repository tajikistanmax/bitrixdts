import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import foldersService from './folders.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// ─── Валидация ──────────────────────────────────────────────────────────────

export const createFolderValidation = [
  body('name').notEmpty().trim().withMessage('Название папки обязательно'),
  body('parentId').optional().isUUID().withMessage('Неверный ID родительской папки'),
  body('color').optional().isString(),
  body('isShared').optional().isBoolean(),
];

export const updateFolderValidation = [
  body('name').optional().notEmpty().trim().withMessage('Название не может быть пустым'),
  body('parentId').optional({ nullable: true }).isUUID().withMessage('Неверный ID'),
  body('color').optional().isString(),
  body('isShared').optional().isBoolean(),
];

export const idValidation = [
  param('id').notEmpty().withMessage('ID папки обязателен'),
];

// ─── Контроллеры ────────────────────────────────────────────────────────────

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const createdById = (req as AuthRequest).user?.userId!;

    const folder = await foldersService.create({
      organizationId,
      createdById,
      name: req.body.name,
      parentId: req.body.parentId,
      color: req.body.color,
      isShared: req.body.isShared,
    });

    res.status(201).json({
      success: true,
      data: folder,
    });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = (req as AuthRequest).user?.organizationId!;

    const folders = await foldersService.findAll(organizationId, {
      parentId: req.query.parentId as string,
      search: req.query.search as string,
    });

    res.json({
      success: true,
      data: folders,
    });
  } catch (error) {
    next(error);
  }
};

export const findById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const folder = await foldersService.findById(req.params.id, organizationId);

    res.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    next(error);
  }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const folder = await foldersService.update(req.params.id, organizationId, req.body);

    res.json({
      success: true,
      data: folder,
    });
  } catch (error) {
    next(error);
  }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    await foldersService.delete(req.params.id, organizationId);

    res.json({
      success: true,
      message: 'Папка удалена',
    });
  } catch (error) {
    next(error);
  }
};

export const getTree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = (req as AuthRequest).user?.organizationId!;
    const tree = await foldersService.getTree(organizationId);

    res.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    next(error);
  }
};

export const getBreadcrumbs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const breadcrumbs = await foldersService.getBreadcrumbs(req.params.id, organizationId);

    res.json({
      success: true,
      data: breadcrumbs,
    });
  } catch (error) {
    next(error);
  }
};
