import apiClient from '../lib/api';
import type { Delegation } from '../types/delegation';

export const delegationService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<Delegation[]> {
    const response = await apiClient.get<Delegation[]>('/delegation', { params });
    return response.data;
  },

  async getById(id: string): Promise<Delegation> {
    const response = await apiClient.get<Delegation>(`/delegation/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Delegation> {
    const response = await apiClient.post<Delegation>('/delegation', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Delegation> {
    const response = await apiClient.put<Delegation>(`/delegation/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/delegation/${id}`);
  },
};
