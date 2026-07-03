import { Router } from 'express';
import {
  createPayroll,
  findAll,
  getById,
  autoFill,
  addEntry,
  removeEntry,
  calculate,
  approve,
  markPaid,
  getEmployeePayslips,
  createPayrollValidation,
  addEntryValidation,
  idValidation,
  entryIdValidation,
} from './payroll.controller';
import { authenticate } from '../auth/auth.middleware';
import { requireRole } from '../../core/middleware/rbac.middleware';
import { addOrganizationToBody } from '../../core/middleware/tenantIsolation';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);
router.use(addOrganizationToBody());

// Список ведомостей (admin, hr, manager)
router.get('/', requireRole('admin', 'hr', 'manager'), findAll);

// Создать ведомость
router.post('/', requireRole('admin', 'hr'), createPayrollValidation, createPayroll);

// Зарплатные квитки сотрудника (ВАЖНО: до /:id чтобы не конфликтовал)
router.get('/employee/:employeeId', requireRole('admin', 'hr', 'manager', 'employee'), getEmployeePayslips);

// Получить ведомость по ID
router.get('/:id', idValidation, requireRole('admin', 'hr', 'manager'), getById);

// Автозаполнение из штатного расписания
router.post('/:id/auto-fill', idValidation, requireRole('admin', 'hr'), autoFill);

// Добавить запись (премия, удержание и т.д.)
router.post('/:id/entries', idValidation, requireRole('admin', 'hr'), addEntryValidation, addEntry);

// Удалить запись
router.delete('/:id/entries/:entryId', entryIdValidation, requireRole('admin', 'hr'), removeEntry);

// Рассчитать ведомость
router.post('/:id/calculate', idValidation, requireRole('admin', 'hr'), calculate);

// Утвердить ведомость
router.post('/:id/approve', idValidation, requireRole('admin'), approve);

// Отметить как выплаченную
router.post('/:id/pay', idValidation, requireRole('admin'), markPaid);

export default router;
