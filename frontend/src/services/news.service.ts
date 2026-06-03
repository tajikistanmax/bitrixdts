import apiClient from '../lib/api';
import type { NewsItem } from '../types/news';

export const newsService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<NewsItem[]> {
    const response = await apiClient.get<NewsItem[]>('/news', { params });
    return response.data;
  },

  async getById(id: string): Promise<NewsItem> {
    const response = await apiClient.get<NewsItem>(`/news/${id}`);
    return response.data;
  },

  async create(data: any): Promise<NewsItem> {
    const response = await apiClient.post<NewsItem>('/news', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<NewsItem> {
    const response = await apiClient.put<NewsItem>(`/news/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/news/${id}`);
  },
};
