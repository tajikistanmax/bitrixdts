import apiClient from '../lib/api';
import type { BusinessTrip } from '../types/trip';

export const tripService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<BusinessTrip[]> {
    const response = await apiClient.get<BusinessTrip[]>('/trips', { params });
    return response.data;
  },

  async getById(id: string): Promise<BusinessTrip> {
    const response = await apiClient.get<BusinessTrip>(`/trips/${id}`);
    return response.data;
  },

  async create(data: any): Promise<BusinessTrip> {
    const response = await apiClient.post<BusinessTrip>('/trips', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<BusinessTrip> {
    const response = await apiClient.put<BusinessTrip>(`/trips/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/trips/${id}`);
  },
};
