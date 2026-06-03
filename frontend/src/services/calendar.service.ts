import apiClient from '../lib/api';
import type { CalendarEvent } from '../types/calendar';

export const calendarService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<CalendarEvent[]> {
    const response = await apiClient.get<CalendarEvent[]>('/calendar', { params });
    return response.data;
  },

  async getById(id: string): Promise<CalendarEvent> {
    const response = await apiClient.get<CalendarEvent>(`/calendar/${id}`);
    return response.data;
  },

  async create(data: any): Promise<CalendarEvent> {
    const response = await apiClient.post<CalendarEvent>('/calendar', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<CalendarEvent> {
    const response = await apiClient.put<CalendarEvent>(`/calendar/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/calendar/${id}`);
  },
};
