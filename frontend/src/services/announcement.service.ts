import apiClient from '../lib/api';
import type { Announcement } from '../types/announcement';

export const announcementService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<Announcement[]> {
    const response = await apiClient.get<Announcement[]>('/announcements', { params });
    return response.data;
  },

  async getById(id: string): Promise<Announcement> {
    const response = await apiClient.get<Announcement>(`/announcements/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Announcement> {
    const response = await apiClient.post<Announcement>('/announcements', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Announcement> {
    const response = await apiClient.put<Announcement>(`/announcements/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/announcements/${id}`);
  },
};
