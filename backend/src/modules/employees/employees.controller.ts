import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import employeesService, { CreateEmployeeData, UpdateEmployeeData, EmployeeFilters } from './employees.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('fullName').notEmpty().withMessage('ФИО обязательно'),
  body('inn').optional().isLength({ max: 12 }).withMessage('ИНН не более 12 символов'),
  body('email').optional().isEmail().withMessage('Неверный email').normalizeEmail(),
  body('phone').optional().isString().withMessage('Неверный телефон'),
  body('position').optional().isString().withMessage('Неверная должность'),
  body('departmentId').optional().isUUID().withMessage('Неверный ID отдела'),
  body('managerId').optional().isUUID().withMessage('Неверный ID руководителя'),
  body('hireDate').optional().isISO8601().withMessage('Неверная дата приёма'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
  body('password').optional().isLength({ min: 6 }).withMessage('Пароль минимум 6 символов'),
];

export const updateValidation = [
  body('fullName').optional().notEmpty().withMessage('ФИО не может быть пустым'),
  body('inn').optional().isLength({ max: 12 }).withMessage('ИНН не более 12 символов'),
  body('email').optional().isEmail().withMessage('Неверный email').normalizeEmail(),
  body('phone').optional().isString().withMessage('Неверный телефон'),
  body('position').optional().isString().withMessage('Неверная должность'),
  body('departmentId').optional().isUUID().withMessage('Неверный ID отдела'),
  body('managerId').optional().isUUID().withMessage('Неверный ID руководителя'),
  body('hireDate').optional().isISO8601().withMessage('Неверная дата приёма'),
  body('status').optional().isIn(['active', 'vacation', 'trip', 'sick', 'fired']).withMessage('Неверный статус'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID сотрудника'),
];

// Контроллеры
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const data: CreateEmployeeData = req.body;
    const _userId = (req as AuthRequest).user?.userId || 'system';

    const employee = await employeesService.create(data, _userId);

    res.status(201).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    // Получить фильтры из query
    const filters: EmployeeFilters = {
      search: req.query.search as string,
      departmentId: req.query.departmentId as string,
      status: req.query.status as string,
      position: req.query.position as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await employeesService.findAll(userOrgId!, filters);

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
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const employee = await employeesService.findById(id, userOrgId!);

    res.json({
      success: true,
      data: employee,
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

    const id = req.params.id;
    const data: UpdateEmployeeData = req.body;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId || 'system';

    const employee = await employeesService.update(id, userOrgId!, data, userId);

    res.json({
      success: true,
      data: employee,
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

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId || 'system';

    await employeesService.delete(id, userOrgId!, userId);

    res.json({
      success: true,
      message: 'Сотрудник удалён',
    });
  } catch (error) {
    next(error);
  }
};

export const restore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const employee = await employeesService.restore(id, userOrgId!);

    res.json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

export const getHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const history = await employeesService.getHistory(id, userOrgId!);

    res.json({
      success: true,
      data: history,
    });
  } catch (error) {
    next(error);
  }
};

export const getSubordinates = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const subordinates = await employeesService.getSubordinates(id, userOrgId!);

    res.json({
      success: true,
      data: subordinates,
    });
  } catch (error) {
    next(error);
  }
};

// Экспорт для тестов
export const validationRules = {
  create: createValidation,
  update: updateValidation,
  id: idValidation,
};

