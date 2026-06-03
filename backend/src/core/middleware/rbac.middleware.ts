import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from './errorHandler';
import { AuthRequest } from '../../modules/auth/auth.middleware';

/**
 * RBAC (Role-Based Access Control)
 * Проверка прав доступа на основе ролей
 */

export type Permission = 
  | 'employee:create'
  | 'employee:read'
  | 'employee:update'
  | 'employee:delete'
  | 'task:create'
  | 'task:read'
  | 'task:update'
  | 'task:delete'
  | 'task:approve'
  | 'workflow:create'
  | 'workflow:approve'
  | 'document:create'
  | 'document:approve'
  | 'admin:all';

/**
 * Проверка наличия роли у пользователя
 */
export function requireRole(...roles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;

      if (!user || !user.userId) {
        throw new AppError('Аутентификация не пройдена', 401);
      }

      // Проверка: пользователь существует и активен
      const employee = await prisma.employee.findFirst({
        where: { 
          id: user.userId,
          status: 'active'
        },
        include: {
          employeeRoles: {
            include: {
              role: true
            }
          }
        }
      });

      if (!employee) {
        throw new AppError('Сотрудник не найден или неактивен', 403);
      }

      const userRoleNames = employee.employeeRoles.map(er => er.role.name);

      // Проверка: есть ли хотя бы одна из требуемых ролей
      const hasRole = roles.some(role => userRoleNames.includes(role));

      if (!hasRole) {
        throw new AppError(`Доступ запрещён: требуются роли: ${roles.join(', ')}`, 403);
      }

      // Добавляем роли пользователя в запрос
      (req as any).userRoles = userRoleNames;
      (req as any).employee = employee;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Проверка прав доступа к сущностям
 * Сотрудник -> только свои задачи
 * Руководитель -> задачи отдела
 * Администратор -> всё
 */
export function requirePermission(permission: Permission) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      const userId = user?.userId;
      const userOrgId = user?.organizationId;

      if (!userId || !userOrgId) {
        throw new AppError('Аутентификация не пройдена', 401);
      }

      // Получаем данные пользователя с ролями
      const employee = await prisma.employee.findFirst({
        where: { id: userId, organizationId: userOrgId },
        include: {
          employeeRoles: {
            include: { role: true }
          },
        }
      });

      if (!employee) {
        throw new AppError('Сотрудник не найден', 403);
      }

      const userRoles = employee.employeeRoles.map(er => er.role.name);

      // Проверка администратора
      if (userRoles.includes('admin')) {
        (req as any).canAccessAll = true;
        return next();
      }

      // Проверка прав по типу операции
      switch (permission) {
        case 'employee:create':
        case 'employee:update':
        case 'employee:delete':
          if (!userRoles.includes('admin') && !userRoles.includes('manager') && !userRoles.includes('hr')) {
            throw new AppError('Доступ запрещён: недостаточно прав', 403);
          }
          break;

        case 'task:create':
          // Все могут создавать задачи
          break;

        case 'task:read':
          // Проверка: сотрудник видит только свои задачи
          if (req.params.id) {
            const task = await prisma.task.findFirst({
              where: { id: req.params.id, organizationId: userOrgId }
            });

            if (!task) {
              throw new AppError('Задача не найдена', 404);
            }

            const canAccess =
              task.assigneeId === userId ||    // Исполнитель
              task.controllerId === userId ||  // Контролёр
              task.creatorId === userId ||     // Создатель
              userRoles.includes('manager') ||
              userRoles.includes('admin');

            if (!canAccess) {
              throw new AppError('Доступ запрещён: задача не принадлежит вам', 403);
            }
          }
          break;

        case 'task:update':
        case 'task:delete':
          if (req.params.id) {
            const task = await prisma.task.findFirst({
              where: { id: req.params.id, organizationId: userOrgId }
            });

            if (!task) {
              throw new AppError('Задача не найдена', 404);
            }

            const canUpdate = 
              task.assigneeId === userId ||                    // Исполнитель
              task.creatorId === userId ||                     // Создатель
              userRoles.includes('manager') ||                 // Руководитель
              userRoles.includes('admin');                     // Админ

            if (!canUpdate) {
              throw new AppError('Доступ запрещён: нельзя редактировать чужую задачу', 403);
            }
          }
          break;

        case 'task:approve':
          if (req.params.id) {
            const task = await prisma.task.findFirst({
              where: { id: req.params.id, organizationId: userOrgId }
            });

            if (!task) {
              throw new AppError('Задача не найдена', 404);
            }

            const isManagerOfCreator = employee.departmentId
              ? await prisma.department.findFirst({
                  where: { id: employee.departmentId, headId: userId },
                })
              : null;

            const canApprove =
              task.controllerId === userId ||     // Контролёр задачи
              !!isManagerOfCreator ||             // Руководитель отдела
              userRoles.includes('admin');

            if (!canApprove) {
              throw new AppError('Доступ запрещён: нет прав на утверждение', 403);
            }
          }
          break;

        case 'workflow:approve':
          // Проверка в workflow.service.ts
          break;

        default:
          throw new AppError(`Неизвестное разрешение: ${permission}`, 400);
      }

      (req as any).user = employee;
      (req as any).userRoles = userRoles;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Проверка: руководитель видит задачи своего отдела
 */
export function requireDepartmentAccess() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      const employee = (req as any).employee;

      if (!employee || !employee.departmentId) {
        throw new AppError('Отдел не найден', 403);
      }

      // Проверяем: является ли сотрудник руководителем отдела
      const isDepartmentHead = await prisma.department.findFirst({
        where: { 
          id: employee.departmentId,
          headId: employee.id
        }
      });

      if (!isDepartmentHead) {
        throw new AppError('Доступ запрещён: не руководитель отдела', 403);
      }

      (req as any).isDepartmentHead = true;
      (req as any).departmentId = employee.departmentId;

      next();
    } catch (error) {
      next(error);
    }
  };
}
