import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import multer from 'multer';
import filesService, { UploadFileData } from './files.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';
import storageService from '../../core/utils/storage.service';

// Multer: хранение в памяти, лимит 100MB
export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 100 * 1024 * 1024 },
}).single('file');

// Загрузка реального файла (multipart/form-data, поле "file")
export const uploadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const file = (req as any).file;
    if (!file) throw new AppError('Файл не предоставлен (поле "file")', 400);

    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;
    const entityType = (req.body.entityType as string) || 'general';
    const entityId = req.body.entityId as string | undefined;
    const folderIdRaw = req.body.folderId as string | undefined;
    const folderId = folderIdRaw && folderIdRaw !== 'root' && folderIdRaw !== 'null' ? folderIdRaw : null;

    // Загрузить в хранилище
    const stored = await storageService.uploadBuffer(
      file.buffer,
      file.originalname,
      file.mimetype,
      entityType
    );

    // Сохранить метаданные
    const saved = await filesService.upload({
      fileName: file.originalname,
      fileUrl: stored.fileUrl,
      fileType: file.mimetype,
      fileSize: stored.size,
      organizationId: orgId,
      entityType,
      entityId,
      folderId,
      uploaderId: userId,
    });

    res.status(201).json({ success: true, data: saved, storageAvailable: storageService.isAvailable() });
  } catch (error) {
    next(error);
  }
};

// Скачивание файла из хранилища
export const downloadFile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const objectName = req.params.objectName;
    if (!storageService.isAvailable()) {
      throw new AppError('Хранилище недоступно', 503);
    }
    const stream = await storageService.getObjectStream(objectName);
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
};

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

    const folderIdRaw = req.query.folderId as string | undefined;
    const filters = {
      entityType: req.query.entityType as string,
      uploadedBy: req.query.uploadedBy as string,
      folderId:
        folderIdRaw === undefined
          ? undefined
          : folderIdRaw === 'root' || folderIdRaw === 'null'
          ? null
          : folderIdRaw,
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
