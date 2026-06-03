import apiClient from '../lib/api';
import type { Report } from '../types/report';

export const reportService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<Report[]> {
    const response = await apiClient.get<Report[]>('/reports', { params });
    return response.data;
  },

  async getById(id: string): Promise<Report> {
    const response = await apiClient.get<Report>(`/reports/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Report> {
    const response = await apiClient.post<Report>('/reports', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Report> {
    const response = await apiClient.put<Report>(`/reports/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/reports/${id}`);
  },
};
