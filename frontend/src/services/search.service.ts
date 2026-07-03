import apiClient from '../lib/api';

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  subtitle?: string;
  url?: string;
  createdAt?: string;
}

export const searchService = {
  search: async (query: string, types?: string[], limit = 20): Promise<{ results: SearchResult[]; total: number }> => {
    const params: any = { q: query, limit };
    if (types && types.length > 0) params.types = types.join(',');
    const { data } = await apiClient.get('/search', { params });
    return data;
  },
};
