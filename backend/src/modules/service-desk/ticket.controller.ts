import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import ticketService, { Ticket, TicketComment } from './ticket.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('title').notEmpty().withMessage('Заголовок обязателен'),
  body('description').notEmpty().withMessage('Описание обязательно'),
  body('type').isIn(['it', 'hardware', 'household', 'repair', 'other']).withMessage('Неверный тип'),
  body('priority').isIn(['low', 'normal', 'high', 'critical']).withMessage('Неверный приоритет'),
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

    const data: Ticket = req.body;
    const userId = (req as AuthRequest).user?.userId || 'system';
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const ticket = await ticketService.createTicket({ ...data, requesterId: userId, organizationId: userOrgId! });

    res.status(201).json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const getAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;

    const page = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));

    const filters = {
      requesterId: req.query.requesterId as string,
      assigneeId: req.query.assigneeId as string,
      type: req.query.type as string,
      priority: req.query.priority as string,
      status: req.query.status as string,
      departmentId: req.query.departmentId as string,
      my: req.query.my === 'true',
      userId: req.query.my === 'true' ? userId : undefined,
    };

    const result = await ticketService.getTickets(userOrgId!, filters, page, limit);

    res.json({
      success: true,
      data: result.tickets,
      pagination: {
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const ticket = await ticketService.getTicketById(id, userOrgId!);

    res.json({
      success: true,
      data: ticket,
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

    const ticket = await ticketService.updateTicket(id, userOrgId!, data);

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const updateStatus = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId || 'system';
    const { status } = req.body;

    if (!status) {
      throw new AppError('Статус обязателен', 400);
    }

    const ticket = await ticketService.updateStatus(id, userOrgId!, status, userId);

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const assign = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId || 'system';
    const { assigneeId } = req.body;

    if (!assigneeId) {
      throw new AppError('ID исполнителя обязателен', 400);
    }

    const ticket = await ticketService.assign(id, userOrgId!, assigneeId, userId);

    res.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    next(error);
  }
};

export const addComment = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId || 'system';
    const { body, attachments } = req.body;

    if (!body) {
      throw new AppError('Текст комментария обязателен', 400);
    }

    const comment = await ticketService.addComment(id, userOrgId!, userId, body, attachments);

    res.status(201).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const departmentId = req.query.departmentId as string;

    const stats = await ticketService.getStatistics(userOrgId!, departmentId);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
