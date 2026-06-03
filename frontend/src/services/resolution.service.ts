import apiClient from '../lib/api';
import type { Resolution } from '../types/resolution';

export const resolutionService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<Resolution[]> {
    const response = await apiClient.get<Resolution[]>('/resolutions', { params });
    return response.data;
  },

  async getById(id: string): Promise<Resolution> {
    const response = await apiClient.get<Resolution>(`/resolutions/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Resolution> {
    const response = await apiClient.post<Resolution>('/resolutions', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Resolution> {
    const response = await apiClient.put<Resolution>(`/resolutions/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/resolutions/${id}`);
  },
};
