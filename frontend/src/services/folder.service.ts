import apiClient from '../lib/api';
import type { FolderRecord } from '../types/file';

export const folderService = {
  /** Папки уровня parentId (null → корневые). */
  async getAll(parentId?: string | null): Promise<FolderRecord[]> {
    const response = await apiClient.get<FolderRecord[]>('/folders', {
      params: parentId ? { parentId } : {},
    });
    const data = response.data as unknown;
    return Array.isArray(data) ? (data as FolderRecord[]) : ((data as any)?.data ?? []);
  },

  async create(data: { name: string; parentId?: string | null; color?: string }): Promise<FolderRecord> {
    const response = await apiClient.post<FolderRecord>('/folders', data);
    return response.data;
  },

  async breadcrumbs(id: string): Promise<{ id: string; name: string }[]> {
    const response = await apiClient.get<{ id: string; name: string }[]>(`/folders/${id}/breadcrumbs`);
    const data = response.data as unknown;
    return Array.isArray(data) ? (data as any) : ((data as any)?.data ?? []);
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/folders/${id}`);
  },
};
