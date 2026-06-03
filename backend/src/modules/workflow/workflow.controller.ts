import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import workflowService, { WorkflowRoute } from './workflow.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createRouteValidation = [
  body('name').notEmpty().withMessage('Название обязательно'),
  body('entityType').notEmpty().withMessage('Тип сущности обязателен'),
  body('steps').isArray({ min: 1 }).withMessage('Маршрут должен содержать хотя бы один шаг'),
];

export const startWorkflowValidation = [
  body('routeId').isUUID().withMessage('Неверный ID маршрута'),
  body('entityId').isUUID().withMessage('Неверный ID сущности'),
  body('entityType').notEmpty().withMessage('Тип сущности обязателен'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID'),
];

// Контроллеры
export const createRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const data: WorkflowRoute = req.body;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const route = await workflowService.createRoute({ ...data, organizationId: userOrgId! });

    res.status(201).json({
      success: true,
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

export const getRoutes = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      entityType: req.query.entityType as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    };

    const routes = await workflowService.getRoutes(userOrgId!, filters);

    res.json({
      success: true,
      data: routes,
    });
  } catch (error) {
    next(error);
  }
};

export const getRouteById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const route = await workflowService.getRouteById(id, userOrgId!);

    res.json({
      success: true,
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

export const updateRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const data = req.body;

    const route = await workflowService.updateRoute(id, userOrgId!, data);

    res.json({
      success: true,
      data: route,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteRoute = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const result = await workflowService.deleteRoute(id, userOrgId!);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const startWorkflow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const { routeId, entityId, entityType } = req.body;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId || 'system';

    const instance = await workflowService.startWorkflow(routeId, entityId, entityType, userOrgId!, userId);

    res.status(201).json({
      success: true,
      data: instance,
    });
  } catch (error) {
    next(error);
  }
};

export const getInstance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;

    const instance = await workflowService.getInstance(id);

    res.json({
      success: true,
      data: instance,
    });
  } catch (error) {
    next(error);
  }
};

export const approveStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const stepOrder = parseInt(req.params.stepOrder);
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;
    const { comment } = req.body;

    const instance = await workflowService.getInstance(id);

    if (instance.organizationId !== userOrgId) {
      throw new AppError('Доступ запрещён', 403);
    }

    const result = await workflowService.approveStep(id, stepOrder, userId!, comment);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const rejectStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const stepOrder = parseInt(req.params.stepOrder);
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;

    if (!req.body.comment) {
      throw new AppError('Комментарий обязателен при отклонении', 400);
    }

    const instance = await workflowService.getInstance(id);

    if (instance.organizationId !== userOrgId) {
      throw new AppError('Доступ запрещён', 403);
    }

    const result = await workflowService.rejectStep(id, stepOrder, userId!, req.body.comment);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const cancelWorkflow = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const result = await workflowService.cancelWorkflow(id, userOrgId!);

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveForEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;

    const workflows = await workflowService.getActiveWorkflowsForEmployee(userId!, userOrgId!);

    res.json({
      success: true,
      data: workflows,
    });
  } catch (error) {
    next(error);
  }
};
