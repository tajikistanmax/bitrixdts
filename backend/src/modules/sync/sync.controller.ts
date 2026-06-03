import { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import syncService from './sync.service';
import { AuthRequest } from '../auth/auth.middleware';

export const addToQueueValidation = [
  body('entityType').isString().notEmpty().withMessage('Тип сущности обязателен'),
  body('entityId').isUUID().withMessage('Неверный ID сущности'),
  body('operation').isString().notEmpty().withMessage('Операция обязательна'),
  body('payload').optional().isObject().withMessage('payload должен быть объектом'),
];

export const syncItemIdValidation = [
  param('itemId').isUUID().withMessage('Неверный ID элемента очереди'),
];

class SyncController {
  async addToQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const { entityType, entityId, operation, payload } = req.body;
      const user = (req as AuthRequest).user!;
      const employee = await syncService.findEmployee(user.userId);
      if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
      const item = await syncService.addToQueue({
        organizationId: employee.organizationId, entityType, entityId, operation, payload
      });
      res.status(201).json({ success: true, data: item });
    } catch (error) { next(error); }
  }

  async getQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const employee = await syncService.findEmployee(user.userId);
      if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
      const items = await syncService.getQueueItems(employee.organizationId, req.query.status as string, Number(req.query.limit) || 100);
      res.json({ success: true, data: items });
    } catch (error) { next(error); }
  }

  async processItem(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await syncService.processQueueItem(req.params.itemId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async processQueue(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const employee = await syncService.findEmployee(user.userId);
      if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
      const result = await syncService.processQueue(employee.organizationId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const employee = await syncService.findEmployee(user.userId);
      if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
      const stats = await syncService.getSyncStats(employee.organizationId, Number(req.query.days) || 7);
      res.json({ success: true, data: stats });
    } catch (error) { next(error); }
  }

  async forceSync(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const employee = await syncService.findEmployee(user.userId);
      if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
      const result = await syncService.forceSync(employee.organizationId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }
}

export default new SyncController();
