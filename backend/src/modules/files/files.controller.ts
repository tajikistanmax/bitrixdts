import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import filesService, { UploadFileData } from './files.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const uploadValidation = [
  body('fileName').notEmpty().withMessage('Имя файла обязательно'),
  body('fileUrl').notEmpty().withMessage('URL файла обязателен'),
  body('fileType').notEmpty().withMessage('Тип файла обязателен'),
  body('fileSize').isInt({ min: 1 }).withMessage('Неверный размер файла'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
  body('entityType').optional().isString().withMessage('Неверный тип сущности'),
  body('entityId').optional().isUUID().withMessage('Неверный ID сущности'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID файла'),
];

// Контроллеры
export const upload = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const data: UploadFileData = req.body;
    const userId = (req as AuthRequest).user?.userId || 'system';

    const file = await filesService.upload({ ...data, uploaderId: userId });

    res.status(201).json({
      success: true,
      data: file,
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

    const file = await filesService.findById(id, userOrgId!);

    res.json({
      success: true,
      data: file,
    });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      entityType: req.query.entityType as string,
      uploadedBy: req.query.uploadedBy as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    };

    const result = await filesService.findAll(userOrgId!, filters);

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

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId || 'system';

    const result = await filesService.delete(id, userOrgId!, userId);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getByEntity = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const entityType = req.query.entityType as string;
    const entityId = req.query.entityId as string;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    if (!entityType || !entityId) {
      throw new AppError('entityType и entityId обязательны', 400);
    }

    const files = await filesService.getFilesByEntity(entityType, entityId, userOrgId!);

    res.json({
      success: true,
      data: files,
    });
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const stats = await filesService.getStatistics(userOrgId!);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
