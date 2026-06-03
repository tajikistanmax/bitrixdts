import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AppError } from '../../core/middleware/errorHandler';
import { TokenPayload } from './auth.service';

export interface AuthRequest extends Request {
  user?: TokenPayload;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Токен доступа не предоставлен', 401);
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
      throw new AppError('Токен доступа не предоставлен', 401);
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload;

    req.user = payload;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError('Неверный токен доступа', 401));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new AppError('Токен доступа истёк', 401));
    } else {
      next(error);
    }
  }
};

export const optionalAuth = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as TokenPayload;
      req.user = payload;
    }

    next();
  } catch (error) {
    // Игнорируем ошибки аутентификации для опциональных маршрутов
    next();
  }
};

// Проверка роли
export const requireRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Требуется аутентификация', 401);
    }

    const hasRole = req.user.role.some(role => roles.includes(role));
    
    if (!hasRole) {
      throw new AppError('Недостаточно прав', 403);
    }

    next();
  };
};

// Проверка на руководителя или выше
export const requireManagerOrAbove = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    throw new AppError('Требуется аутентификация', 401);
  }

  const allowedRoles = ['admin', 'manager', 'hr', 'supervisor'];
  const hasRole = req.user.role.some(role => allowedRoles.includes(role));

  if (!hasRole) {
    throw new AppError('Доступ только для руководителей', 403);
  }

  next();
};
