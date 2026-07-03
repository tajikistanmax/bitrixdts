import apiClient from '../lib/api';

export const feedService = {
  getFeed: async (page = 1, limit = 30) => {
    const { data } = await apiClient.get('/feed', { params: { page, limit } });
    return data;
  },
};
