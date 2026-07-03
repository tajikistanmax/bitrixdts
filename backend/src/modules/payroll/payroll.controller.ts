import { Request, Response, NextFunction } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import payrollService, { PayrollFilters } from './payroll.service';
import { AppError } from '../../core/middleware/errorHandler';
import { AuthRequest } from '../auth/auth.middleware';

// ─── Валидация ──────────────────────────────────────────────────────────────

export const createPayrollValidation = [
  body('period').notEmpty().isISO8601().withMessage('Период обязателен (формат: YYYY-MM-DD)'),
];

export const addEntryValidation = [
  body('employeeId').notEmpty().withMessage('ID сотрудника обязателен'),
  body('type').isIn(['salary', 'bonus', 'overtime', 'deduction', 'advance', 'vacation_pay', 'sick_pay', 'tax', 'pension', 'other'])
    .withMessage('Неверный тип начисления'),
  body('amount').isNumeric().withMessage('Сумма обязательна'),
  body('description').optional().isString(),
  body('hoursWorked').optional().isNumeric(),
  body('rate').optional().isNumeric(),
];

export const idValidation = [
  param('id').notEmpty().withMessage('ID ведомости обязателен'),
];

export const entryIdValidation = [
  param('id').notEmpty().withMessage('ID ведомости обязателен'),
  param('entryId').notEmpty().withMessage('ID записи обязателен'),
];

// ─── Контроллеры ────────────────────────────────────────────────────────────

export const createPayroll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const { period } = req.body;

    const payroll = await payrollService.createPayroll({ organizationId, period });

    res.status(201).json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

export const findAll = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = (req as AuthRequest).user?.organizationId!;

    const filters: PayrollFilters = {
      status: req.query.status as any,
      year: req.query.year ? parseInt(req.query.year as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 12,
    };

    const result = await payrollService.findAll(organizationId, filters);

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

export const getById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const payroll = await payrollService.getPayrollById(req.params.id, organizationId);

    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

export const autoFill = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const payroll = await payrollService.autoFillFromStaff(req.params.id, organizationId);

    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

export const addEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const entry = await payrollService.addEntry({
      payrollId: req.params.id,
      employeeId: req.body.employeeId,
      type: req.body.type,
      description: req.body.description,
      amount: req.body.amount,
      hoursWorked: req.body.hoursWorked,
      rate: req.body.rate,
    });

    res.status(201).json({
      success: true,
      data: entry,
    });
  } catch (error) {
    next(error);
  }
};

export const removeEntry = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const result = await payrollService.removeEntry(req.params.entryId, req.params.id);

    res.json({
      success: true,
      message: 'Запись удалена',
    });
  } catch (error) {
    next(error);
  }
};

export const calculate = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const payroll = await payrollService.calculate(req.params.id, organizationId);

    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

export const approve = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const approverId = (req as AuthRequest).user?.userId!;
    const payroll = await payrollService.approve(req.params.id, organizationId, approverId);

    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

export const markPaid = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const organizationId = (req as AuthRequest).user?.organizationId!;
    const payroll = await payrollService.markPaid(req.params.id, organizationId);

    res.json({
      success: true,
      data: payroll,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeePayslips = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const organizationId = (req as AuthRequest).user?.organizationId!;
    const employeeId = req.params.employeeId;
    const year = req.query.year ? parseInt(req.query.year as string) : undefined;

    const payslips = await payrollService.getEmployeePayslips(employeeId, organizationId, year);

    res.json({
      success: true,
      data: payslips,
    });
  } catch (error) {
    next(error);
  }
};
