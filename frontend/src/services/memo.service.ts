import apiClient from '../lib/api';

export const memoService = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/memos', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/memos/${id}`);
    return data;
  },
  create: async (body: any) => {
    const { data } = await apiClient.post('/memos', body);
    return data;
  },
  update: async (id: string, body: any) => {
    const { data } = await apiClient.put(`/memos/${id}`, body);
    return data;
  },
  send: async (id: string) => {
    const { data } = await apiClient.post(`/memos/${id}/send`);
    return data;
  },
  resolve: async (id: string, resolution: string) => {
    const { data } = await apiClient.post(`/memos/${id}/resolve`, { resolution });
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/memos/${id}`);
    return data;
  },
  getStatistics: async () => {
    const { data } = await apiClient.get('/memos/statistics');
    return data;
  },
};
