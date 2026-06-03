import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import projectsService, { CreateProjectData, UpdateProjectData, ProjectFilters, ProjectMemberData } from './projects.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('name').notEmpty().withMessage('Название проекта обязательно'),
  body('description').optional().isString().withMessage('Неверное описание'),
  body('ownerId').isUUID().withMessage('Неверный ID владельца'),
  body('startDate').optional().isISO8601().withMessage('Неверная дата начала'),
  body('dueDate').optional().isISO8601().withMessage('Неверная дата окончания'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Бюджет должен быть положительным числом'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
];

export const updateValidation = [
  body('name').optional().notEmpty().withMessage('Название не может быть пустым'),
  body('description').optional().isString().withMessage('Неверное описание'),
  body('ownerId').optional().isUUID().withMessage('Неверный ID владельца'),
  body('startDate').optional().isISO8601().withMessage('Неверная дата начала'),
  body('dueDate').optional().isISO8601().withMessage('Неверная дата окончания'),
  body('budget').optional().isFloat({ min: 0 }).withMessage('Бюджет должен быть положительным числом'),
  body('status').optional().isIn(['active', 'completed', 'archived']).withMessage('Неверный статус'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID проекта'),
];

export const memberValidation = [
  param('id').isUUID().withMessage('Неверный ID проекта'),
  body('employeeId').isUUID().withMessage('Неверный ID сотрудника'),
  body('role').isIn(['owner', 'admin', 'member', 'viewer']).withMessage('Неверная роль'),
];

// Контроллеры
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const data: CreateProjectData = req.body;
    const userId = (req as AuthRequest).user?.userId || 'system';

    const project = await projectsService.create(data, userId);

    res.status(201).json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;

    const filters: ProjectFilters = {
      search: req.query.search as string,
      ownerId: req.query.ownerId as string,
      status: req.query.status as string,
      participantId: req.query.participantId as string || userId,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as string) || 'createdAt',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await projectsService.findAll(userOrgId!, filters);

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

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const project = await projectsService.findById(id, userOrgId!);

    res.json({
      success: true,
      data: project,
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
    const data: UpdateProjectData = req.body;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const project = await projectsService.update(id, userOrgId!, data);

    res.json({
      success: true,
      data: project,
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

    await projectsService.delete(id, userOrgId!);

    res.json({
      success: true,
      message: 'Проект удалён',
    });
  } catch (error) {
    next(error);
  }
};

export const restore = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const project = await projectsService.restore(id, userOrgId!);

    res.json({
      success: true,
      data: project,
    });
  } catch (error) {
    next(error);
  }
};

// Участники проекта
export const addMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const projectId = req.params.id;
    const memberData: ProjectMemberData = req.body;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const member = await projectsService.addMember(projectId, userOrgId!, memberData);

    res.status(201).json({
      success: true,
      data: member,
    });
  } catch (error) {
    next(error);
  }
};

export const updateMemberRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const projectId = req.params.id;
    const employeeId = req.params.employeeId;
    const role = req.body.role;

    const updated = await projectsService.updateMemberRole(projectId, employeeId, role);

    res.json({
      success: true,
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const removeMember = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const projectId = req.params.id;
    const employeeId = req.params.employeeId;

    await projectsService.removeMember(projectId, employeeId);

    res.json({
      success: true,
      message: 'Участник удалён из проекта',
    });
  } catch (error) {
    next(error);
  }
};

export const getMembers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const projectId = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const members = await projectsService.getMembers(projectId, userOrgId!);

    res.json({
      success: true,
      data: members,
    });
  } catch (error) {
    next(error);
  }
};

// Статистика
export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const stats = await projectsService.getStatistics(userOrgId!);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
