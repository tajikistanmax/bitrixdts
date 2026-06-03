import apiClient from '../lib/api';
import type { Document } from '../types/document';

export const documentService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<Document[]> {
    const response = await apiClient.get<Document[]>('/documents', { params });
    return response.data;
  },

  async getById(id: string): Promise<Document> {
    const response = await apiClient.get<Document>(`/documents/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Document> {
    const response = await apiClient.post<Document>('/documents', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Document> {
    const response = await apiClient.put<Document>(`/documents/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/documents/${id}`);
  },
};
