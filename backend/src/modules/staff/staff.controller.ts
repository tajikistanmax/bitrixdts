import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import staffService, { StaffFilters } from './staff.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// ─── Валидация ──────────────────────────────────────────────────────────────

export const createPositionValidation = [
  body('departmentId').notEmpty().withMessage('ID подразделения обязательно'),
  body('title').notEmpty().withMessage('Название позиции обязательно'),
  body('grade').optional().isString(),
  body('minSalary').optional().isNumeric().withMessage('Неверная минимальная зарплата'),
  body('maxSalary').optional().isNumeric().withMessage('Неверная максимальная зарплата'),
  body('headcount').optional().isInt({ min: 1 }).withMessage('Количество ставок минимум 1'),
  body('description').optional().isString(),
  body('requirements').optional().isString(),
];

export const updatePositionValidation = [
  body('title').optional().notEmpty().withMessage('Название не может быть пустым'),
  body('grade').optional().isString(),
  body('minSalary').optional().isNumeric(),
  body('maxSalary').optional().isNumeric(),
  body('headcount').optional().isInt({ min: 1 }),
  body('description').optional().isString(),
  body('requirements').optional().isString(),
  body('isActive').optional().isBoolean(),
];

export const assignEmployeeValidation = [
  body('employeeId').notEmpty().withMessage('ID сотрудника обязателен'),
  body('salary').isNumeric().withMessage('Зарплата обязательна'),
  body('rate').optional().isFloat({ min: 0.1, max: 2.0 }).withMessage('Ставка от 0.1 до 2.0'),
  body('startDate').isISO8601().withMessage('Дата начала обязательна'),
];

export const idValidation = [
  param('id').notEmpty().withMessage('ID обязателен'),
];

// ─── Контроллеры: Позиции ───────────────────────────────────────────────────

export const createPosition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;

    const position = await staffService.createPosition({
      organizationId,
      departmentId: req.body.departmentId,
      title: req.body.title,
      grade: req.body.grade,
      minSalary: req.body.minSalary,
      maxSalary: req.body.maxSalary,
      headcount: req.body.headcount,
      description: req.body.description,
      requirements: req.body.requirements,
    });

    res.status(201).json({
      success: true,
      data: position,
    });
  } catch (error) {
    next(error);
  }
};

export const findAllPositions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = (req as AuthRequest).user?.organizationId!;

    const filters: StaffFilters = {
      departmentId: req.query.departmentId as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 50,
    };

    const result = await staffService.findAllPositions(organizationId, filters);

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

export const getPositionById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const position = await staffService.getPositionById(req.params.id, organizationId);

    res.json({
      success: true,
      data: position,
    });
  } catch (error) {
    next(error);
  }
};

export const updatePosition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const position = await staffService.updatePosition(req.params.id, organizationId, req.body);

    res.json({
      success: true,
      data: position,
    });
  } catch (error) {
    next(error);
  }
};

export const deletePosition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    await staffService.deletePosition(req.params.id, organizationId);

    res.json({
      success: true,
      message: 'Позиция удалена',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Контроллеры: Назначения ────────────────────────────────────────────────

export const assignEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const assignment = await staffService.assignEmployee({
      positionId: req.params.id,
      employeeId: req.body.employeeId,
      salary: req.body.salary,
      rate: req.body.rate,
      startDate: req.body.startDate,
    });

    res.status(201).json({
      success: true,
      data: assignment,
    });
  } catch (error) {
    next(error);
  }
};

export const removeAssignment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = (req as AuthRequest).user?.organizationId!;
    await staffService.removeAssignment(req.params.assignmentId, organizationId);

    res.json({
      success: true,
      message: 'Назначение снято',
    });
  } catch (error) {
    next(error);
  }
};

// ─── Контроллеры: Статистика и оргструктура ─────────────────────────────────

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = (req as AuthRequest).user?.organizationId!;
    const stats = await staffService.getStaffStatistics(organizationId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};

export const getOrgChart = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = (req as AuthRequest).user?.organizationId!;
    const chart = await staffService.getOrgChart(organizationId);

    res.json({
      success: true,
      data: chart,
    });
  } catch (error) {
    next(error);
  }
};
