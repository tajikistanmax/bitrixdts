import { Request, Response, NextFunction } from 'express';
import { body, param, validationResult } from 'express-validator';
import attendanceService, { CheckInData, CheckOutData, AttendanceFilters } from './attendance.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// Валидация
export const checkInValidation = [
  body('employeeId').optional().isUUID().withMessage('Неверный ID сотрудника'),
  body('source').optional().isIn(['manual', 'terminal', 'geo', 'ip']).withMessage('Неверный источник'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
];

export const checkOutValidation = [
  body('employeeId').optional().isUUID().withMessage('Неверный ID сотрудника'),
  body('organizationId').isUUID().withMessage('Неверный ID организации'),
];

export const idValidation = [
  param('id').isUUID().withMessage('Неверный ID записи'),
];

export const statisticsValidation = [
  body('dateFrom').isISO8601().withMessage('Неверная дата начала'),
  body('dateTo').isISO8601().withMessage('Неверная дата окончания'),
];

// Контроллеры
export const checkIn = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const data: CheckInData = {
      employeeId: req.body.employeeId || (req as AuthRequest).user?.userId!,
      organizationId: req.body.organizationId || (req as AuthRequest).user?.organizationId!,
      source: req.body.source || 'manual',
    };
    const userId = (req as AuthRequest).user?.userId || 'system';

    const record = await attendanceService.checkIn(data, userId);

    res.status(201).json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const checkOut = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка выгрузки', 400);
    }

    const data: CheckOutData = {
      employeeId: req.body.employeeId || (req as AuthRequest).user?.userId!,
      organizationId: req.body.organizationId || (req as AuthRequest).user?.organizationId!,
    };

    const record = await attendanceService.checkOut(data);

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const filters: AttendanceFilters = {
      employeeId: req.query.employeeId as string,
      departmentId: req.query.departmentId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      status: req.query.status as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 20,
      sortBy: (req.query.sortBy as string) || 'date',
      sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
    };

    const result = await attendanceService.findAll(userOrgId!, filters);

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
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка выгрузки', 400);
    }

    const id = req.params.id;
    const userOrgId = (req as AuthRequest).user?.organizationId;

    const record = await attendanceService.findById(id, userOrgId!);

    res.json({
      success: true,
      data: record,
    });
  } catch (error) {
    next(error);
  }
};

export const getTodayAttendance = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userOrgId = (req as AuthRequest).user?.organizationId;
    const departmentId = req.query.departmentId as string;

    const records = await attendanceService.getTodayAttendance(userOrgId!, departmentId);

    res.json({
      success: true,
      data: records,
    });
  } catch (error) {
    next(error);
  }
};

export const getStatistics = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError((errors.array()[0] as any).msg || 'Ошибка выгрузки', 400);
    }

    const userOrgId = (req as AuthRequest).user?.organizationId;
    const dateFrom = req.body.dateFrom;
    const dateTo = req.body.dateTo;

    const stats = await attendanceService.getStatistics(userOrgId!, dateFrom, dateTo);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    next(error);
  }
};
