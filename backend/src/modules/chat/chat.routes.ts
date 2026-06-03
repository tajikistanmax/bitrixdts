import { Router } from 'express';
import { authenticate } from '../auth/auth.middleware';
import { validate } from '../../core/middleware/errorHandler';
import chatController, {
  createChannelValidation,
  channelIdValidation,
  sendMessageValidation,
  employeeIdValidation,
  sendDirectMessageValidation,
} from './chat.controller';

const router = Router();

// Все маршруты требуют аутентификации
router.use(authenticate);

// Получение каналов чата организации
router.get('/channels', chatController.getChannels);

// Создание канала
router.post('/channels', createChannelValidation, validate, chatController.createChannel);

// Получение информации о канале
router.get('/channels/:channelId', channelIdValidation, validate, chatController.getChannel);

// Вступление в канал
router.post('/channels/:channelId/join', channelIdValidation, validate, chatController.joinChannel);

// Выход из канала
router.post('/channels/:channelId/leave', channelIdValidation, validate, chatController.leaveChannel);

// Получение сообщений канала
router.get('/channels/:channelId/messages', channelIdValidation, validate, chatController.getChannelMessages);

// Отправка сообщения
router.post('/channels/:channelId/messages', sendMessageValidation, validate, chatController.sendMessage);

// Получение личных сообщений с пользователем
router.get('/direct/:employeeId', employeeIdValidation, validate, chatController.getDirectMessages);

// Отправка личного сообщения
router.post('/direct/:employeeId', sendDirectMessageValidation, validate, chatController.sendDirectMessage);

export default router;
