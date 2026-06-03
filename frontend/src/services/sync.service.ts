import apiClient from '../lib/api';
import type { SyncItem, SyncStats } from '../types/sync';

export const syncService = {
  async getQueue(params?: { page?: number; limit?: number }): Promise<SyncItem[]> {
    const response = await apiClient.get<SyncItem[]>('/sync/queue', { params });
    return response.data;
  },

  async getStats(): Promise<SyncStats> {
    const response = await apiClient.get<SyncStats>('/sync/stats');
    return response.data;
  },

  async addToQueue(data: { entityType: string; entityId: string; action: string }): Promise<SyncItem> {
    const response = await apiClient.post<SyncItem>('/sync/queue', data);
    return response.data;
  },

  async processAll(): Promise<void> {
    await apiClient.post('/sync/process');
  },

  async forceSync(): Promise<void> {
    await apiClient.post('/sync/force');
  },
};
