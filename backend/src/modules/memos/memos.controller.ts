import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import memosService from './memos.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

export const createValidation = [
  body('type').isIn(['memo', 'report', 'request', 'complaint', 'order']).withMessage('Неверный тип'),
  body('subject').notEmpty().withMessage('Тема обязательна'),
  body('body').notEmpty().withMessage('Текст обязателен'),
];

export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw new AppError(errors.array()[0].msg as string, 400);

    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;

    const memo = await memosService.create({
      organizationId: orgId,
      authorId: userId,
      type: req.body.type,
      subject: req.body.subject,
      body: req.body.body,
      recipientId: req.body.recipientId,
      departmentId: req.body.departmentId,
      priority: req.body.priority,
      dueDate: req.body.dueDate,
      attachments: req.body.attachments,
    });

    res.status(201).json({ success: true, data: memo });
  } catch (error) { next(error); }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const result = await memosService.findAll(orgId, {
      type: req.query.type as any,
      status: req.query.status as any,
      authorId: req.query.authorId as string,
      recipientId: req.query.recipientId as string,
      search: req.query.search as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
    });
    res.json({ success: true, data: result.data, meta: { total: result.total, page: result.page, totalPages: result.totalPages } });
  } catch (error) { next(error); }
};

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const memo = await memosService.getById(req.params.id, orgId);
    res.json({ success: true, data: memo });
  } catch (error) { next(error); }
};

export const update = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const memo = await memosService.update(req.params.id, orgId, req.body);
    res.json({ success: true, data: memo });
  } catch (error) { next(error); }
};

export const send = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const memo = await memosService.send(req.params.id, orgId);
    res.json({ success: true, data: memo });
  } catch (error) { next(error); }
};

export const resolve = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const userId = (req as AuthRequest).user?.userId!;
    const memo = await memosService.resolve(req.params.id, orgId, userId, req.body.resolution);
    res.json({ success: true, data: memo });
  } catch (error) { next(error); }
};

export const remove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    await memosService.delete(req.params.id, orgId);
    res.json({ success: true, message: 'Удалено' });
  } catch (error) { next(error); }
};

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const orgId = (req as AuthRequest).user?.organizationId!;
    const stats = await memosService.getStatistics(orgId);
    res.json({ success: true, data: stats });
  } catch (error) { next(error); }
};
