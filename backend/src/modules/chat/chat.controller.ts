import { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import chatService from './chat.service';
import { AuthRequest } from '../auth/auth.middleware';
import { AppError } from '../../core/middleware/errorHandler';

export const createChannelValidation = [
  body('name').isString().notEmpty().withMessage('Название канала обязательно'),
  body('type').optional().isIn(['channel', 'direct']).withMessage('Неверный тип канала'),
  body('memberIds').optional().isArray().withMessage('memberIds должен быть массивом'),
];

export const channelIdValidation = [
  param('channelId').isUUID().withMessage('Неверный ID канала'),
];

export const sendMessageValidation = [
  param('channelId').isUUID().withMessage('Неверный ID канала'),
  body('body').isString().notEmpty().withMessage('Текст сообщения обязателен'),
  body('attachments').optional().isArray().withMessage('attachments должен быть массивом'),
];

export const employeeIdValidation = [
  param('employeeId').isUUID().withMessage('Неверный ID сотрудника'),
];

export const sendDirectMessageValidation = [
  param('employeeId').isUUID().withMessage('Неверный ID сотрудника'),
  body('body').isString().notEmpty().withMessage('Текст сообщения обязателен'),
  body('attachments').optional().isArray().withMessage('attachments должен быть массивом'),
];

class ChatController {
  async getChannels(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const employee = await chatService.findEmployee(user.userId);
      if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
      const channels = await chatService.getChannels(employee.organizationId);
      res.json({ success: true, data: channels });
    } catch (error) { next(error); }
  }

  async createChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, type, memberIds } = req.body;
      const user = (req as AuthRequest).user!;
      const employee = await chatService.findEmployee(user.userId);
      if (!employee) return res.status(404).json({ success: false, error: 'Employee not found' });
      const channel = await chatService.createChannel({
        organizationId: employee.organizationId, name, type, memberIds, createdBy: user.userId
      });
      res.status(201).json({ success: true, data: channel });
    } catch (error) { next(error); }
  }

  async getChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const channel = await chatService.getChannel(req.params.channelId);
      if (!channel) return res.status(404).json({ success: false, error: 'Channel not found' });
      res.json({ success: true, data: channel });
    } catch (error) { next(error); }
  }

  async joinChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const channel = await chatService.joinChannel(req.params.channelId, user.userId);
      res.json({ success: true, data: channel });
    } catch (error) { next(error); }
  }

  async leaveChannel(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const result = await chatService.leaveChannel(req.params.channelId, user.userId);
      res.json({ success: true, data: result });
    } catch (error) { next(error); }
  }

  async getChannelMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const { limit = 50, before } = req.query;
      const messages = await chatService.getChannelMessages(
        req.params.channelId, Number(limit), before as string
      );
      res.json({ success: true, data: messages });
    } catch (error) { next(error); }
  }

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { body, attachments } = req.body;
      const message = await chatService.sendMessage({
        channelId: req.params.channelId,
        authorId: user.userId,
        body, attachments
      });
      res.status(201).json({ success: true, data: message });
    } catch (error) { next(error); }
  }

  async getDirectMessages(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { employeeId } = req.params;
      const { limit = 50, before } = req.query;
      const userOrgId = user.organizationId;
      const messages = await chatService.getDirectMessages(
        user.userId, employeeId, userOrgId, Number(limit), before as string
      );
      res.json({ success: true, data: messages });
    } catch (error) { next(error); }
  }

  async sendDirectMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { body, attachments } = req.body;
      const message = await chatService.sendDirectMessage({
        senderId: user.userId,
        receiverId: req.params.employeeId,
        body, attachments
      });
      res.status(201).json({ success: true, data: message });
    } catch (error) { next(error); }
  }
}

export default new ChatController();
