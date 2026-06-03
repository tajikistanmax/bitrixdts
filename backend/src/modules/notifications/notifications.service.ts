import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import prisma from '../../core/config/database';

// Redis клиент для Pub/Sub (опционально)
let redisClient: any = null;
try {
  const Redis = require('ioredis');
  redisClient = new Redis(process.env.REDIS_URL || 'redis://:hrplatform123@localhost:6379');
} catch (e) {
  console.log('Redis not available, using in-memory notifications only');
}

// Интерфейсы событий
export interface NotificationEvent {
  type: 'task_assigned' | 'task_status_changed' | 'task_comment' | 'task_overdue' | 'general';
  title: string;
  message: string;
  recipientId: string; // employeeId
  organizationId: string;
  data?: any;
  link?: string;
}

// Хранение активных подключений
const clientSockets = new Map<string, string>(); // socketId -> employeeId
const employeeSockets = new Map<string, Set<string>>(); // employeeId -> Set<socketId>

export class NotificationService {
  private io: Server | null = null;

  // Инициализация WebSocket сервера
  init(io: Server) {
    this.io = io;

    io.use((socket, next) => {
      const token = socket.handshake.auth?.token;
      if (!token) {
        return next(new Error('Authentication required'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET!) as any;
        (socket as any).user = decoded;
        next();
      } catch {
        next(new Error('Invalid token'));
      }
    });

    io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      const registerEmployee = (employeeId: string) => {
        clientSockets.set(socket.id, employeeId);
        if (!employeeSockets.has(employeeId)) {
          employeeSockets.set(employeeId, new Set());
        }
        employeeSockets.get(employeeId)!.add(socket.id);
        console.log(`Employee ${employeeId} registered with socket ${socket.id}`);
      };

      // Авторегистрация из JWT
      const user = (socket as any).user;
      if (user?.userId) {
        registerEmployee(user.userId);
      }

      // Регистрация пользователя (старый протокол)
      socket.on('register', (employeeId: string) => {
        registerEmployee(employeeId);
      });

      // Регистрация через join_user_room (новый протокол)
      socket.on('join_user_room', ({ userId }: { userId: string }) => {
        registerEmployee(userId);
      });

      socket.on('leave_user_room', ({ userId }: { userId: string }) => {
        const sockets = employeeSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) {
            employeeSockets.delete(userId);
          }
        }
        clientSockets.delete(socket.id);
      });

      // Отключение
      socket.on('disconnect', () => {
        const employeeId = clientSockets.get(socket.id);
        if (employeeId) {
          clientSockets.delete(socket.id);
          const sockets = employeeSockets.get(employeeId);
          if (sockets) {
            sockets.delete(socket.id);
            if (sockets.size === 0) {
              employeeSockets.delete(employeeId);
            }
          }
          console.log(`Employee ${employeeId} disconnected`);
        }
      });
    });

    // Подписка на Redis каналы (если Redis доступен)
    if (redisClient) {
      const subscriber = redisClient.duplicate();
      subscriber.subscribe('notifications', 'tasks', 'chat', (err, count) => {
        if (err) {
          console.error('Redis subscription error:', err);
        } else {
          console.log(`Subscribed to ${count} Redis channels`);
        }
      });

      subscriber.on('message', (channel, message) => {
        try {
          const data = JSON.parse(message);
          this.handleRedisMessage(channel, data);
        } catch (error) {
          console.error('Error handling Redis message:', error);
        }
      });
    }
  }

  // Обработка сообщений из Redis
  private handleRedisMessage(channel: string, data: any) {
    if (channel === 'notifications' && data.type === 'broadcast') {
      this.broadcastNotification(data);
    } else if (channel === 'tasks') {
      this.handleTaskEvent(data);
    }
  }

  // Отправить уведомление конкретному пользователю
  async sendNotification(event: NotificationEvent) {
    const { recipientId, organizationId, type, title, message, link, data } = event;

    // Сохранить в БД
    try {
      await prisma.notification.create({
        data: {
          organizationId,
          employeeId: recipientId,
          type,
          title,
          body: message,
          link,
        },
      });
    } catch (error) {
      console.error('Error saving notification to DB:', error);
    }

    const payload = {
      id: Date.now().toString(),
      type,
      title,
      message,
      link,
      data,
      createdAt: new Date().toISOString(),
    };

    // Отправить через WebSocket (общий канал)
    this.sendToUser(recipientId, { type: 'notification', data: payload });

    // Отправить через специализированный канал
    const eventMap: Record<string, string> = {
      task_assigned: 'task_assigned',
      task_status_changed: 'task_status_changed',
      task_comment: 'task_comment',
      task_overdue: 'task_overdue',
      workflow_approval: 'workflow_approval',
    };
    const channel = eventMap[type];
    if (channel) {
      this.sendToUser(recipientId, { type: channel, data: payload });
    }

    // Опубликовать в Redis для масштабирования
    if (redisClient) {
      await redisClient.publish('notifications', JSON.stringify({
        type: 'direct',
        recipientId,
        organizationId,
        event,
      }));
    }
  }

  // Отправить уведомление группе пользователей
  async sendToOrganization(organizationId: string, event: Omit<NotificationEvent, 'recipientId'>) {
    const employees = await prisma.employee.findMany({
      where: { organizationId, status: 'active' },
      select: { id: true },
    });

    for (const employee of employees) {
      await this.sendNotification({ ...event, recipientId: employee.id });
    }
  }

  // Отправить пользователю
  private sendToUser(employeeId: string, payload: any) {
    const sockets = employeeSockets.get(employeeId);
    if (sockets) {
      sockets.forEach(socketId => {
        this.io?.to(socketId).emit('notification', payload);
      });
    }
  }

  // Широковещательная рассылка
  private broadcastNotification(event: any) {
    this.io?.emit('notification', {
      type: 'broadcast',
      data: event,
    });
  }

  // Обработка событий задач
  private async handleTaskEvent(data: any) {
    const { eventType, taskId, organizationId, assigneeId, controllerId, creatorId } = data;

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: {
        assignee: true,
        controller: true,
        creator: true,
      },
    });

    if (!task) return;

    let notification: NotificationEvent | null = null;

    switch (eventType) {
      case 'assigned':
        if (assigneeId) {
          notification = {
            type: 'task_assigned',
            title: 'Новая задача',
            message: `Вам назначена задача: ${task.title}`,
            recipientId: assigneeId,
            organizationId,
            link: `/tasks/${taskId}`,
            data: { taskId, taskTitle: task.title },
          };
        }
        break;

      case 'status_changed':
        if (controllerId) {
          notification = {
            type: 'task_status_changed',
            title: 'Изменён статус задачи',
            message: `Статус задачи "${task.title}" изменён на ${task.status}`,
            recipientId: controllerId,
            organizationId,
            link: `/tasks/${taskId}`,
            data: { taskId, taskTitle: task.title, status: task.status },
          };
        }
        break;

      case 'comment_added':
        // Уведомить исполнителя и контролёра
        const recipients = new Set<string>();
        if (assigneeId) recipients.add(assigneeId);
        if (controllerId && controllerId !== assigneeId) recipients.add(controllerId);

        for (const recipientId of recipients) {
          await this.sendNotification({
            type: 'task_comment',
            title: 'Новый комментарий',
            message: `Новый комментарий к задаче: ${task.title}`,
            recipientId,
            organizationId,
            link: `/tasks/${taskId}`,
            data: { taskId, taskTitle: task.title },
          });
        }
        break;

      case 'overdue':
        if (assigneeId) {
          notification = {
            type: 'task_overdue',
            title: 'Просроченная задача',
            message: `Задача "${task.title}" просрочена!`,
            recipientId: assigneeId,
            organizationId,
            link: `/tasks/${taskId}`,
            data: { taskId, taskTitle: task.title, dueDate: task.dueDate },
          };
        }
        break;
    }

    if (notification) {
      await this.sendNotification(notification);
    }
  }

  // Отправить событие в Redis (для масштабирования)
  async publishTaskEvent(eventType: string, data: any) {
    if (redisClient) {
      await redisClient.publish('tasks', JSON.stringify({
        eventType,
        ...data,
      }));
    }
  }

  // Проверить подключение пользователя
  isUserOnline(employeeId: string): boolean {
    const sockets = employeeSockets.get(employeeId);
    return sockets && sockets.size > 0;
  }

  // Получить количество подключённых пользователей
  getConnectedUsersCount(): number {
    return employeeSockets.size;
  }

  // Получить уведомления (с пагинацией)
  async getNotifications(where: any, orderBy: any, skip: number, take: number) {
    return prisma.notification.findMany({ where, orderBy, skip, take });
  }

  // Количество уведомлений
  async countNotifications(where: any) {
    return prisma.notification.count({ where });
  }

  // Найти уведомление
  async findNotification(where: any) {
    return prisma.notification.findFirst({ where });
  }

  // Отметить как прочитанное
  async markNotificationAsRead(id: string) {
    return prisma.notification.update({
      where: { id },
      data: { isRead: true, readAt: new Date() },
    });
  }

  // Отметить все как прочитанные
  async markAllNotificationsAsRead(where: any) {
    return prisma.notification.updateMany({
      where,
      data: { isRead: true, readAt: new Date() },
    });
  }

  // Удалить уведомление
  async removeNotification(id: string) {
    return prisma.notification.delete({ where: { id } });
  }
}

export default new NotificationService();
