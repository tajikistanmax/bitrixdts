import apiClient from '../lib/api';

export const staffService = {
  getPositions: async (params?: any) => {
    const { data } = await apiClient.get('/staff/positions', { params });
    return data;
  },
  getPositionById: async (id: string) => {
    const { data } = await apiClient.get(`/staff/positions/${id}`);
    return data;
  },
  createPosition: async (body: any) => {
    const { data } = await apiClient.post('/staff/positions', body);
    return data;
  },
  updatePosition: async (id: string, body: any) => {
    const { data } = await apiClient.put(`/staff/positions/${id}`, body);
    return data;
  },
  deletePosition: async (id: string) => {
    const { data } = await apiClient.delete(`/staff/positions/${id}`);
    return data;
  },
  assignEmployee: async (positionId: string, body: any) => {
    const { data } = await apiClient.post(`/staff/positions/${positionId}/assign`, body);
    return data;
  },
  removeAssignment: async (assignmentId: string) => {
    const { data } = await apiClient.delete(`/staff/assignments/${assignmentId}`);
    return data;
  },
  getStatistics: async () => {
    const { data } = await apiClient.get('/staff/statistics');
    return data;
  },
  getOrgChart: async () => {
    const { data } = await apiClient.get('/staff/org-chart');
    return data;
  },
};
