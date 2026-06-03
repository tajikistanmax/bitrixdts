import { create } from 'zustand';
import { websocketService } from '../lib/websocket';
import { notificationService } from '../services/notification.service';
import type { Notification, NotificationStats } from '../types/notification';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  stats: NotificationStats | null;
  isLoading: boolean;
  isInitialized: boolean;
  
  // Actions
  initialize: (userId: string) => void;
  cleanup: () => void;
  fetchNotifications: () => Promise<void>;
  fetchStats: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
  deleteNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  stats: null,
  isLoading: false,
  isInitialized: false,

  initialize: (userId: string) => {
    if (get().isInitialized) return;
    
    // Fetch initial data
    get().fetchNotifications();
    get().fetchStats();
    
    // Setup WebSocket listeners
    websocketService.connect(localStorage.getItem('token') || '');
    websocketService.joinUserRoom(userId);
    
    websocketService.onNotification((notification: any) => {
      get().addNotification(notification);
      get().fetchStats();
    });
    
    websocketService.onTaskAssigned((task: any) => {
      get().addNotification({
        id: Math.random().toString(),
        employeeId: userId,
        type: 'task_assigned',
        title: 'Новая задача',
        message: `Вам назначена задача: ${task.title}`,
        data: { taskId: task.id, taskTitle: task.title },
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });
    
    websocketService.onTaskStatusChanged((task: any) => {
      get().addNotification({
        id: Math.random().toString(),
        employeeId: userId,
        type: 'task_status_changed',
        title: 'Статус задачи изменён',
        message: `Статус задачи "${task.title}" изменён на ${task.status}`,
        data: { taskId: task.id, taskTitle: task.title },
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });
    
    websocketService.onWorkflowApproval((workflow: any) => {
      get().addNotification({
        id: Math.random().toString(),
        employeeId: userId,
        type: 'workflow_approval',
        title: 'Требуется согласование',
        message: `Ожидается ваше согласование: ${workflow.name}`,
        data: { workflowId: workflow.id, workflowName: workflow.name },
        isRead: false,
        createdAt: new Date().toISOString(),
      });
    });
    
    set({ isInitialized: true });
  },

  cleanup: () => {
    const userId = localStorage.getItem('userId');
    if (userId) {
      websocketService.leaveUserRoom(userId);
    }
    websocketService.disconnect();
    set({ isInitialized: false });
  },

  fetchNotifications: async () => {
    set({ isLoading: true });
    try {
      const notifications = await notificationService.getAll({ limit: 50 });
      set({ notifications });
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStats: async () => {
    try {
      const stats = await notificationService.getStats();
      set({ stats, unreadCount: stats.unread });
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  },

  markAsRead: async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationService.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          isRead: true,
          readAt: new Date().toISOString(),
        })),
        unreadCount: 0,
      }));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  },

  addNotification: (notification: Notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  deleteNotification: (id: string) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },
}));
