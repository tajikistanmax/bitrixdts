import apiClient from '../lib/api';
import type { AuditLog } from '../types/audit-log';

export const auditLogService = {
  async getAll(params?: {
    action?: string;
    entityType?: string;
    dateFrom?: string;
    dateTo?: string;
  }): Promise<AuditLog[]> {
    const response = await apiClient.get<AuditLog[]>('/audit-logs', { params });
    return response.data;
  },
};
