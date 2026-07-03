import apiClient from '../lib/api';

export const workspaceService = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/workspaces', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/workspaces/${id}`);
    return data;
  },
  create: async (body: any) => {
    const { data } = await apiClient.post('/workspaces', body);
    return data;
  },
  update: async (id: string, body: any) => {
    const { data } = await apiClient.put(`/workspaces/${id}`, body);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/workspaces/${id}`);
    return data;
  },
  getMembers: async (id: string) => {
    const { data } = await apiClient.get(`/workspaces/${id}/members`);
    return data;
  },
  addMember: async (id: string, body: any) => {
    const { data } = await apiClient.post(`/workspaces/${id}/members`, body);
    return data;
  },
  getDiscussions: async (id: string) => {
    const { data } = await apiClient.get(`/workspaces/${id}/discussions`);
    return data;
  },
  createDiscussion: async (id: string, body: any) => {
    const { data } = await apiClient.post(`/workspaces/${id}/discussions`, body);
    return data;
  },
  getWiki: async (id: string) => {
    const { data } = await apiClient.get(`/workspaces/${id}/wiki`);
    return data;
  },
  createWikiPage: async (id: string, body: any) => {
    const { data } = await apiClient.post(`/workspaces/${id}/wiki`, body);
    return data;
  },
};
