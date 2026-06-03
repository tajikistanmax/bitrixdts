import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import delegationService, { Delegation } from './delegation.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('delegatorId').isUUID().withMessage('Неверный ID делегатора'),
  body('delegateeId').isUUID().withMessage('Неверный ID делегируемого'),
  body('type').isIn(['task', 'approval', 'position', 'all']).withMessage('Неверный тип'),
  body('startDate').isISO8601().withMessage('Неверная дата начала'),
  body('endDate').isISO8601().withMessage('Неверная дата окончания'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID'),
];

// Контроллеры
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const data: Delegation = req.body;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const delegation = await delegationService.createDelegation({ ...data, organizationId: userOrgId! });

    res.status(201).json({
      success: true,
      data: delegation,
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters = {
      employeeId: req.query.employeeId as string,
      type: req.query.type as string,
      isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
      activeNow: req.query.activeNow === 'true',
    };

    const delegations = await delegationService.getDelegations(userOrgId!, filters);

    res.json({
      success: true,
      data: delegations,
    });
  } catch (error) {
    next(error);
  }
};

export const getActiveForEmployee = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as AuthRequest).user?.userId;

    const delegations = await delegationService.getActiveDelegations(userId!);

    res.json({
      success: true,
      data: delegations,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeputies = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const deputies = await delegationService.getDeputiesForEmployee(id, userOrgId!);

    res.json({
      success: true,
      data: deputies,
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
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const data = req.body;

    const delegation = await delegationService.updateDelegation(id, userOrgId!, data);

    res.json({
      success: true,
      data: delegation,
    });
  } catch (error) {
    next(error);
  }
};

export const deactivate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const result = await delegationService.deactivateDelegation(id, userOrgId!);

    res.json(result);
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

    const result = await delegationService.deleteDelegation(id, userOrgId!);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const setDeputyForPosition = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const { position, deputyId, startDate, endDate } = req.body;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const result = await delegationService.setDeputyForPosition(
      userOrgId!,
      position,
      deputyId,
      startDate,
      endDate
    );

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};
