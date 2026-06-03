import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../core/middleware/errorHandler';
import meetingsController, { createMeetingValidation, meetingIdValidation } from './meetings.controller';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// CRUD операции
router.post('/', createMeetingValidation, validate, meetingsController.createMeeting);
router.get('/', meetingsController.getMeetings);
router.get('/:meetingId', meetingIdValidation, validate, meetingsController.getMeeting);
router.put('/:meetingId', meetingIdValidation, validate, meetingsController.updateMeeting);
router.delete('/:meetingId', meetingIdValidation, validate, meetingsController.cancelMeeting);

// Действия с встречей
router.post('/:meetingId/confirm', meetingIdValidation, validate, meetingsController.confirmAttendance);
router.post('/:meetingId/join', meetingIdValidation, validate, meetingsController.joinMeeting);

export default router;
