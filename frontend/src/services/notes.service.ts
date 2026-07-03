import apiClient from '../lib/api';

export const notesService = {
  getAll: async (page = 1) => {
    const { data } = await apiClient.get('/notes', { params: { page } });
    return data;
  },
  create: async (body: string) => {
    const { data } = await apiClient.post('/notes', { body });
    return data;
  },
  update: async (id: string, body: string) => {
    const { data } = await apiClient.put(`/notes/${id}`, { body });
    return data;
  },
  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/notes/${id}`);
    return data;
  },
};
