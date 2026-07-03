import { Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import authService from '../auth/auth.service';
import { AppError } from '../../core/middleware/errorHandler';

// Валидация
export const loginValidation = [
  body('email').isEmail().withMessage('Неверный email'),
  body('password').notEmpty().withMessage('Пароль обязателен'),
];

export const registerValidation = [
  body('email').isEmail().withMessage('Неверный email'),
  body('password').isLength({ min: 8 }).withMessage('Пароль должен быть не менее 8 символов'),
  body('fullName').notEmpty().withMessage('ФИО обязательно'),
];

// Контроллеры
export const login = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const { email, password } = req.body;
    const result = await authService.login({ email, password });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const register = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const error = errors.array()[0] as any;
      throw new AppError(error.msg || 'Ошибка валидации', 400);
    }

    const result = await authService.register(req.body);
    
    res.status(201).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const refreshToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;
    
    if (!refreshToken) {
      throw new AppError('Refresh token обязателен', 400);
    }

    const result = await authService.refreshTokens(refreshToken);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await authService.logout(refreshToken);
    }

    res.json({ success: true, message: 'Выход выполнен' });
  } catch (error) {
    next(error);
  }
};

export const getProfile = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    
    const profile = await authService.getProfile(userId);
    
    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = (req as any).user.userId;
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      throw new AppError('Текущий и новый пароль обязательны', 400);
    }

    const result = await authService.changePassword(userId, oldPassword, newPassword);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const requestPasswordReset = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError('Email обязателен', 400);
    }

    const result = await authService.requestPasswordReset(email);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      throw new AppError('Токен и новый пароль обязательны', 400);
    }

    const result = await authService.resetPassword(resetToken, newPassword);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const assignRole = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId, roleId } = req.body;

    if (!employeeId || !roleId) {
      throw new AppError('employeeId и roleId обязательны', 400);
    }

    const result = await authService.assignRole(employeeId, roleId);
    
    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const getEmployeeRoles = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { employeeId } = req.params;

    const roles = await authService.getEmployeeRoles(employeeId);
    
    res.json({
      success: true,
      data: roles,
    });
  } catch (error) {
    next(error);
  }
};
