import apiClient from '../lib/api';

export interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

export const aiService = {
  async getStatus(): Promise<{ configured: boolean }> {
    const response = await apiClient.get('/ai/status');
    return response.data;
  },

  async chat(messages: AiMessage[]): Promise<{ reply: string; model: string }> {
    const response = await apiClient.post('/ai/chat', { messages });
    return response.data;
  },
};
