import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import calendarService, { CalendarEvent } from './calendar.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const createValidation = [
  body('title').notEmpty().withMessage('Название обязательно'),
  body('startTime').isISO8601().withMessage('Неверная дата начала'),
  body('endTime').isISO8601().withMessage('Неверная дата окончания'),
  body('eventType').isIn(['task', 'deadline', 'meeting', 'vacation', 'custom']).withMessage('Неверный тип события'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
  body('reminderMinutes').optional().isInt({ min: 0 }).withMessage('Неверное время напоминания'),
];

export const updateValidation = [
  param('id').isUUID().withMessage('Неверный ID события'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID события'),
];

// Контроллеры
export const create = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const data: CalendarEvent = req.body;
    const userId = (req as AuthRequest).user?.userId || 'system';

    const event = await calendarService.createEvent(data, userId);

    res.status(201).json({
      success: true,
      data: event,
    });
  } catch (error) {
    next(error);
  }
};

export const getEvents = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const userOrgId = (req as AuthRequest).user?.organizationId;

    const now = new Date();
    const filters = {
      startDate: (req.query.startDate as string) || new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
      endDate: (req.query.endDate as string) || new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString(),
      eventType: req.query.eventType as string,
      employeeId: req.query.employeeId as string,
      departmentId: req.query.departmentId as string,
      entityType: req.query.entityType as string,
      entityId: req.query.entityId as string,
    };

    const events = await calendarService.getEvents(userOrgId!, filters);

    res.json({
      success: true,
      data: events,
    });
  } catch (error) {
    next(error);
  }
};

export const getDeadlines = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const daysAhead = parseInt(req.query.daysAhead as string) || 7;

    const deadlines = await calendarService.getDeadlines(userOrgId!, daysAhead);

    res.json({
      success: true,
      data: deadlines,
    });
  } catch (error) {
    next(error);
  }
};

export const getReminders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;
    const minutesAhead = parseInt(req.query.minutesAhead as string) || 30;

    const reminders = await calendarService.getReminders(userOrgId!, userId!, minutesAhead);

    res.json({
      success: true,
      data: reminders,
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

    const event = await calendarService.updateEvent(id, userOrgId!, data);

    res.json({
      success: true,
      data: event,
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

    const result = await calendarService.deleteEvent(id, userOrgId!);

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getMonthlyView = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth();

    const view = await calendarService.getMonthlyView(userOrgId!, year, month);

    res.json({
      success: true,
      data: view,
    });
  } catch (error) {
    next(error);
  }
};
