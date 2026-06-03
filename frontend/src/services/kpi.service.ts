import apiClient from '../lib/api';
import type { KPIMetric, KPIMetricValue } from '../types/kpi';

export const kpiService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<KPIMetric[]> {
    const response = await apiClient.get<KPIMetric[]>('/kpi', { params });
    return response.data;
  },

  async getById(id: string): Promise<KPIMetric> {
    const response = await apiClient.get<KPIMetric>(`/kpi/${id}`);
    return response.data;
  },

  async create(data: any): Promise<KPIMetric> {
    const response = await apiClient.post<KPIMetric>('/kpi', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<KPIMetric> {
    const response = await apiClient.put<KPIMetric>(`/kpi/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/kpi/${id}`);
  },

  async getValues(metricId: string): Promise<KPIMetricValue[]> {
    const response = await apiClient.get<KPIMetricValue[]>(`/kpi/${metricId}/values`);
    return response.data;
  },

  async addValue(metricId: string, data: any): Promise<KPIMetricValue> {
    const response = await apiClient.post<KPIMetricValue>(`/kpi/${metricId}/values`, data);
    return response.data;
  },

  async updateValue(metricId: string, valueId: string, data: any): Promise<KPIMetricValue> {
    const response = await apiClient.put<KPIMetricValue>(`/kpi/${metricId}/values/${valueId}`, data);
    return response.data;
  },

  async deleteValue(metricId: string, valueId: string): Promise<void> {
    await apiClient.delete(`/kpi/${metricId}/values/${valueId}`);
  },
};
