import { Request, Response, NextFunction } from 'express';
import { param, validationResult } from 'express-validator';
import notificationService from './notifications.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID уведомления'),
];

// Контроллеры
export const getNotifications = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const unreadOnly = req.query.unreadOnly === 'true';

    const skip = (page - 1) * limit;

    const where: any = {
      organizationId: userOrgId,
      employeeId: userId,
    };

    if (unreadOnly) {
      where.isRead = false;
    }

    const total = await notificationService.countNotifications(where);

    const notifications = await notificationService.getNotifications(where, { createdAt: 'desc' }, skip, limit);

    res.json({
      success: true,
      data: notifications,
      meta: {
        total,
        page,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
};

export const markAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;

    const notification = await notificationService.findNotification({ id, organizationId: userOrgId, employeeId: userId });

    if (!notification) {
      throw new AppError('Уведомление не найдено', 404);
    }

    await notificationService.markNotificationAsRead(id);

    res.json({
      success: true,
      message: 'Уведомление отмечено как прочитанное',
    });
  } catch (error) {
    next(error);
  }
};

export const markAllAsRead = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;

    await notificationService.markAllNotificationsAsRead({
      organizationId: userOrgId,
      employeeId: userId,
      isRead: false,
    });

    res.json({
      success: true,
      message: 'Все уведомления отмечены как прочитанные',
    });
  } catch (error) {
    next(error);
  }
};

export const getUnreadCount = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;

    const count = await notificationService.countNotifications({
      organizationId: userOrgId,
      employeeId: userId,
      isRead: false,
    });

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
};

export const deleteNotification = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка валидации', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const userId = (req as AuthRequest).user?.userId;

    const notification = await notificationService.findNotification({ id, organizationId: userOrgId, employeeId: userId });

    if (!notification) {
      throw new AppError('Уведомление не найдено', 404);
    }

    await notificationService.removeNotification(id);

    res.json({
      success: true,
      message: 'Уведомление удалено',
    });
  } catch (error) {
    next(error);
  }
};
