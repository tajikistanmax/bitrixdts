import apiClient from '../lib/api';
import type { Timesheet, TimesheetStats } from '../types/timesheet';

export const timesheetService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<Timesheet[]> {
    const response = await apiClient.get<Timesheet[]>('/timesheet', { params });
    return response.data;
  },

  async getById(id: string): Promise<Timesheet> {
    const response = await apiClient.get<Timesheet>(`/timesheet/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Timesheet> {
    const response = await apiClient.post<Timesheet>('/timesheet', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Timesheet> {
    const response = await apiClient.put<Timesheet>(`/timesheet/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/timesheet/${id}`);
  },

  async getStats(): Promise<TimesheetStats> {
    const response = await apiClient.get<TimesheetStats>('/timesheet/stats');
    return response.data;
  },
};
