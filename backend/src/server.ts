import 'tsconfig-paths/register';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';

import { routes } from './core/config/routes';
import { errorHandler as globalErrorHandler } from './core/middleware/errorHandler';
import { sanitizeInput } from './core/middleware/sanitize.middleware';
import logger from './core/config/logger';
import notificationService from './modules/notifications/notifications.service';
import swaggerUi from 'swagger-ui-express';
import swaggerSpec from './core/config/swagger';
import { startOverdueCron } from './core/utils/overdue-cron';
import { startRecurringTasksCron } from './core/utils/recurring-tasks-cron';
import { startRemindersCron } from './core/utils/reminders-cron';

// Загрузка переменных окружения
dotenv.config();

// Проверка секретов: в production сервер не стартует с плейсхолдерами
import { assertSecureEnvironment } from './core/config/env-check';
if (process.env.NODE_ENV !== 'test') {
  assertSecureEnvironment();
}

const app = express();
const httpServer = createServer(app);

// Parse CORS origins (comma-separated)
const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:3001').split(',').map(s => s.trim());

// Инициализация Socket.IO для real-time
const io = new Server(httpServer, {
  cors: {
    origin: corsOrigins,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Инициализация сервиса уведомлений
notificationService.init(io);

// Middleware
app.use(helmet()); // Защита заголовков
app.use(sanitizeInput);
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));
app.use(compression()); // Сжатие ответов
app.use(morgan('combined', {
  stream: { write: (message: string) => logger.info(message.trim()) },
  skip: () => process.env.NODE_ENV === 'test',
}));
app.use(express.json()); // Парсинг JSON
app.use(express.urlencoded({ extended: true }));

// Global rate limiter
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // 200 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

app.use(globalLimiter);

// Swagger UI
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/api-docs.json', (_req, res) => res.json(swaggerSpec));

// API Роуты
app.use(process.env.API_PREFIX || '/api/v1', routes);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Root
app.get('/', (_req, res) => {
  res.json({
    name: 'HR Platform API',
    version: '4.0.0',
    health: '/health'
  });
});

// Обработка ошибок
app.use(globalErrorHandler);

// 404
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Socket.IO обработка через сервис уведомлений
// (инициализация выполнена выше через notificationService.init(io))

// Graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`${signal} received. Shutting down gracefully...`);
  httpServer.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Запуск сервера (не запускать в тестовом режиме)
const PORT = parseInt(process.env.PORT || '3000', 10);

if (process.env.NODE_ENV !== 'test') {
  httpServer.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running on port ${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    logger.info(`API: http://localhost:${PORT}${process.env.API_PREFIX || '/api/v1'}`);
  });

  // Запуск cron-задач
  startOverdueCron();
  startRecurringTasksCron();
  startRemindersCron();
}

export { httpServer, io };
