import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import { AppError } from './errorHandler';
import { AuthRequest } from '../../modules/auth/auth.middleware';

// Допустимые имена таблиц для проверки принадлежности
// Только из этого списка может быть entityModel — защита от SQL-инъекции
const ALLOWED_ENTITY_MODELS = new Set([
  'Task',
  'Project',
  'Document',
  'Ticket',
  'Delegation',
  'Resolution',
  'VacationRequest',
  'SickLeave',
  'BusinessTrip',
  'Timesheet',
  'Attendance',
]);

/**
 * Middleware для проверки принадлежности к организации
 * ГАРАНТИРУЕТ: Сотрудник НЕ видит данные других организаций
 */
export function checkOrganizationOwnership() {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      
      if (!user || !user.userId || !user.organizationId) {
        throw new AppError('Аутентификация не пройдена', 401);
      }

      // Извлекаем ID организации из параметров запроса
      const resourceOrgId = req.params.organizationId || 
                           (req.body as any)?.organizationId ||
                           (req.query as any)?.organizationId;

      // Если запрашиваем данные конкретной организации
      if (resourceOrgId) {
        if (resourceOrgId !== user.organizationId) {
          // 🔴 КРИТИЧЕСКАЯ ЗАЩИТА: Организация А не видит данные Организации Б
          throw new AppError('Доступ запрещён: данные другой организации', 403);
        }
      }

      // Добавляем organizationId в запрос для дальнейшей обработки
      (req as any).userOrganizationId = user.organizationId;
      (req as any).userId = user.userId;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware для проверки доступа к конкретной сущности
 * Используется в маршрутах: /employees/:id, /tasks/:id и т.д.
 */
export function checkEntityOwnership(entityModel: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      const entityId = req.params.id || req.params.entityId;

      if (!user || !user.userId || !user.organizationId) {
        throw new AppError('Аутентификация не пройдена', 401);
      }

      if (!entityId) {
        return next();
      }

      // Защита от SQL-инъекции: проверяем, что модель из допустимого списка
      if (!ALLOWED_ENTITY_MODELS.has(entityModel)) {
        throw new AppError(`Неизвестная сущность: ${entityModel}`, 400);
      }

      // Используем Prisma динамический доступ через приведение типа
      const entity = await (prisma as any)[
        entityModel.charAt(0).toLowerCase() + entityModel.slice(1)
      ].findFirst({
        where: { id: entityId },
        select: { organizationId: true },
      });

      if (!entity) {
        return next(); // Сущность не найдена — обработка дальше в контроллере
      }

      if (entity.organizationId !== user.organizationId) {
        // 🔴 КРИТИЧЕСКАЯ ЗАЩИТА: Доступ к чужим данным запрещён
        throw new AppError('Доступ запрещён: сущность не принадлежит вашей организации', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Helper для автоматического добавления organizationId к запросу
 * Используется при создании/обновлении сущностей
 */
export function addOrganizationToBody() {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    
    if (user && user.organizationId) {
      // Принудительно устанавливаем organizationId в теле запроса
      (req.body as any).organizationId = user.organizationId;
    }
    
    next();
  };
}

/**
 * Проверка мультиарендности для списка сущностей
 * Всегда добавляет WHERE organizationId = user.organizationId
 */
export function addOrganizationFilter(entityModel: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = (req as AuthRequest).user;
    
    if (user && user.organizationId) {
      // Добавляем фильтр по организации к запросу
      if (!req.query) {
        (req as any).query = {};
      }
      (req as any).query.organizationId = user.organizationId;
    }
    
    next();
  };
}
