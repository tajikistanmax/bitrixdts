import apiClient from '../lib/api';
import type { Attendance, AttendanceStats } from '../types/attendance';

export const attendanceService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<Attendance[]> {
    const response = await apiClient.get<Attendance[]>('/attendance', { params });
    return response.data;
  },

  async getById(id: string): Promise<Attendance> {
    const response = await apiClient.get<Attendance>(`/attendance/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Attendance> {
    const response = await apiClient.post<Attendance>('/attendance', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Attendance> {
    const response = await apiClient.put<Attendance>(`/attendance/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/attendance/${id}`);
  },

  async getStats(): Promise<AttendanceStats> {
    const response = await apiClient.get<AttendanceStats>('/attendance/stats');
    return response.data;
  },
};
