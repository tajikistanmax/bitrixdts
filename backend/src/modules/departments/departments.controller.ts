import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import departmentsService, { CreateDepartmentData, UpdateDepartmentData } from './departments.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('name').notEmpty().withMessage('Название отдела обязательно'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
  body('parentId').optional().isUUID().withMessage('Неверный ID родительского отдела'),
  body('headId').optional().isUUID().withMessage('Неверный ID руководителя'),
];

export const updateValidation = [
  body('name').optional().notEmpty().withMessage('Название не может быть пустым'),
  body('parentId').optional().isUUID().withMessage('Неверный ID родительского отдела'),
  body('headId').optional().isUUID().withMessage('Неверный ID руководителя'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID отдела'),
];

// Контроллеры
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const data: CreateDepartmentData = req.body;

    const department = await departmentsService.create(data);

    res.status(201).json({
      success: true,
      data: department,
    });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const departments = await departmentsService.findAll(userOrgId!);

    res.json({
      success: true,
      data: departments,
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

    const department = await departmentsService.findById(id, userOrgId!);

    res.json({
      success: true,
      data: department,
    });
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

    const id = req.params.id;
    const data: UpdateDepartmentData = req.body;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const department = await departmentsService.update(id, userOrgId!, data);

    res.json({
      success: true,
      data: department,
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

    const result = await departmentsService.delete(id, userOrgId!);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getTree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const tree = await departmentsService.getTree(userOrgId!);

    res.json({
      success: true,
      data: tree,
    });
  } catch (error) {
    next(error);
  }
};
