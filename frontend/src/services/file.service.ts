import apiClient from '../lib/api';
import type { FileRecord } from '../types/file';

const DRIVE_ENTITY = 'drive';

export const fileService = {
  /** Файлы в папке (folderId = 'root' → корень). Возвращает массив (обёртка распакована интерцептором). */
  async getAll(params?: { folderId?: string | null; entityType?: string; search?: string }): Promise<FileRecord[]> {
    const response = await apiClient.get<FileRecord[]>('/files', {
      params: {
        entityType: params?.entityType ?? DRIVE_ENTITY,
        folderId: params?.folderId === null ? 'root' : params?.folderId,
        limit: 200,
      },
    });
    const data = response.data as unknown;
    return Array.isArray(data) ? (data as FileRecord[]) : ((data as any)?.data ?? []);
  },

  /** Реальная загрузка файла (multipart) в папку Диска. */
  async upload(
    file: File,
    opts?: { folderId?: string | null; onProgress?: (p: number) => void }
  ): Promise<FileRecord> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', DRIVE_ENTITY);
    if (opts?.folderId) formData.append('folderId', opts.folderId);

    const response = await apiClient.post<FileRecord>('/files/upload-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: opts?.onProgress
        ? (event) => {
            if (event.total) opts.onProgress!(Math.round((event.loaded * 100) / event.total));
          }
        : undefined,
    });
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/files/${id}`);
  },
};
