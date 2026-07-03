import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  login,
  register,
  refreshToken,
  logout,
  getProfile,
  changePassword,
  requestPasswordReset,
  resetPassword,
  assignRole,
  getEmployeeRoles,
  loginValidation,
  registerValidation,
} from './auth.controller';
import { authenticate } from './auth.middleware';

const router = Router();

// Rate limiting для auth-эндпоинтов (защита от брутфорса)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 минут
  max: 10,
  message: {
    success: false,
    error: 'Слишком много запросов. Попробуйте через 15 минут.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const resetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 час
  max: 5,
  message: {
    success: false,
    error: 'Слишком много запросов на сброс пароля. Попробуйте через час.',
  },
});

// Публичные маршруты
router.post('/login', authLimiter, loginValidation, login);
router.post('/register', authLimiter, registerValidation, register);
router.post('/refresh-token', authLimiter, refreshToken);
router.post('/forgot-password', resetLimiter, requestPasswordReset);
router.post('/reset-password', resetLimiter, resetPassword);

// Защищённые маршруты
router.get('/me', authenticate, getProfile);
router.post('/logout', authenticate, logout);
router.post('/change-password', authenticate, changePassword);

// Управление ролями (только администратор)
router.post('/roles/assign', authenticate, assignRole);
router.get('/employees/:employeeId/roles', authenticate, getEmployeeRoles);

export default router;
