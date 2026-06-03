import apiClient from '../lib/api';
import type { Notification, NotificationStats } from '../types/notification';

export const notificationService = {
  async getAll(params?: { page?: number; limit?: number; unread?: boolean }): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>('/notifications', { params });
    return response.data;
  },

  async getUnread(): Promise<Notification[]> {
    const response = await apiClient.get<Notification[]>('/notifications', { params: { unread: true } });
    return response.data;
  },

  async getStats(): Promise<NotificationStats> {
    const response = await apiClient.get<NotificationStats>('/notifications/stats');
    return response.data;
  },

  async markAsRead(notificationId: string): Promise<void> {
    await apiClient.patch(`/notifications/${notificationId}/read`);
  },

  async markAllAsRead(): Promise<void> {
    await apiClient.patch('/notifications/read-all');
  },

  async delete(notificationId: string): Promise<void> {
    await apiClient.delete(`/notifications/${notificationId}`);
  },
};
