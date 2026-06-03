import apiClient from '../lib/api';
import type { Ticket } from '../types/serviceDesk';

export const serviceDeskService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<Ticket[]> {
    const response = await apiClient.get<Ticket[]>('/tickets', { params });
    return response.data;
  },

  async getById(id: string): Promise<Ticket> {
    const response = await apiClient.get<Ticket>(`/tickets/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Ticket> {
    const response = await apiClient.post<Ticket>('/tickets', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Ticket> {
    const response = await apiClient.put<Ticket>(`/tickets/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tickets/${id}`);
  },
};
