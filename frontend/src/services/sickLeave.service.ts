import apiClient from '../lib/api';
import type { SickLeave } from '../types/sickLeave';

export const sickLeaveService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<SickLeave[]> {
    const response = await apiClient.get<SickLeave[]>('/sickleaves', { params });
    return response.data;
  },

  async getById(id: string): Promise<SickLeave> {
    const response = await apiClient.get<SickLeave>(`/sickleaves/${id}`);
    return response.data;
  },

  async create(data: any): Promise<SickLeave> {
    const response = await apiClient.post<SickLeave>('/sickleaves', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<SickLeave> {
    const response = await apiClient.put<SickLeave>(`/sickleaves/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/sickleaves/${id}`);
  },
};
