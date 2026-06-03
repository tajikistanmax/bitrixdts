import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';
import logger from '../config/logger';

export const validate = (req: Request, _res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array()[0] as any;
    return next(new AppError(firstError.msg || 'Ошибка валидации', 400));
  }
  next();
};

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
  }

  // Неожиданная ошибка
  logger.error('Unhandled error', { error: err, stack: err instanceof Error ? err.stack : undefined });
  
  return res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
  });
};

export default errorHandler;
