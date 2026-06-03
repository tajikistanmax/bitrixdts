import { Request, Response, NextFunction } from 'express';
import { body, param } from 'express-validator';
import meetingsService from './meetings.service';
import { AuthRequest } from '../auth/auth.middleware';

export const createMeetingValidation = [
  body('title').isString().notEmpty().withMessage('Название встречи обязательно'),
  body('description').optional().isString(),
  body('startTime').isISO8601().withMessage('Неверная дата начала'),
  body('endTime').isISO8601().withMessage('Неверная дата окончания'),
  body('participantIds').optional().isArray().withMessage('participantIds должен быть массивом'),
  body('location').optional().isString(),
];

export const meetingIdValidation = [
  param('meetingId').isUUID().withMessage('Неверный ID встречи'),
];

class MeetingsController {
  async createMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const { title, description, startTime, endTime, participantIds, location } = req.body;
      const user = (req as AuthRequest).user!;

      const employee = await meetingsService.findEmployee(user.userId);
      if (!employee) {
        return res.status(404).json({ success: false, error: 'Employee not found' });
      }

      const meeting = await meetingsService.createMeeting({
        organizationId: employee.organizationId, title, description,
        startTime, endTime, creatorId: user.userId, participantIds, location
      });
      res.status(201).json({ success: true, data: meeting });
    } catch (error) { next(error); }
  }

  async getMeetings(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const { startDate, endDate, status } = req.query;
      const meetings = await meetingsService.getMeetings(
        user.userId, startDate as string, endDate as string, status as string
      );
      res.json({ success: true, data: meetings });
    } catch (error) { next(error); }
  }

  async getMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingsService.getMeeting(req.params.meetingId);
      if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
      res.json({ success: true, data: meeting });
    } catch (error) { next(error); }
  }

  async updateMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingsService.updateMeeting(req.params.meetingId, req.body);
      if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
      res.json({ success: true, data: meeting });
    } catch (error) { next(error); }
  }

  async cancelMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const meeting = await meetingsService.cancelMeeting(req.params.meetingId);
      if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
      res.json({ success: true, data: meeting });
    } catch (error) { next(error); }
  }

  async confirmAttendance(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const meeting = await meetingsService.confirmAttendance(req.params.meetingId, user.userId);
      if (!meeting) return res.status(404).json({ success: false, error: 'Meeting not found' });
      res.json({ success: true, data: meeting });
    } catch (error) { next(error); }
  }

  async joinMeeting(req: Request, res: Response, next: NextFunction) {
    try {
      const user = (req as AuthRequest).user!;
      const joinUrl = await meetingsService.joinMeeting(req.params.meetingId, user.userId);
      res.json({ success: true, data: { joinUrl } });
    } catch (error) { next(error); }
  }
}

export default new MeetingsController();
