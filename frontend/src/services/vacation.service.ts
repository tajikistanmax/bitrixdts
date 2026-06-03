import apiClient from '../lib/api';
import type { VacationRequest } from '../types/vacation';

export const vacationService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<VacationRequest[]> {
    const response = await apiClient.get<VacationRequest[]>('/vacations', { params });
    return response.data;
  },

  async getById(id: string): Promise<VacationRequest> {
    const response = await apiClient.get<VacationRequest>(`/vacations/${id}`);
    return response.data;
  },

  async create(data: any): Promise<VacationRequest> {
    const response = await apiClient.post<VacationRequest>('/vacations', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<VacationRequest> {
    const response = await apiClient.put<VacationRequest>(`/vacations/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/vacations/${id}`);
  },
};
