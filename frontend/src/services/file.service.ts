import apiClient from '../lib/api';
import type { FileRecord } from '../types/file';

export const fileService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<FileRecord[]> {
    const response = await apiClient.get<FileRecord[]>('/files', { params });
    return response.data;
  },

  async upload(file: File, onProgress?: (progress: number) => void): Promise<FileRecord> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post<FileRecord>('/files', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: onProgress ? (event) => {
        if (event.total) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      } : undefined,
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/files/${id}`);
  },
};
