import apiClient from '../lib/api';
import type { ChatChannel, ChatMessage } from '../types/chat';

export const chatService = {
  async getChannels(): Promise<ChatChannel[]> {
    const response = await apiClient.get<ChatChannel[]>('/chat/channels');
    return response.data;
  },

  async getChannelById(id: string): Promise<ChatChannel> {
    const response = await apiClient.get<ChatChannel>(`/chat/channels/${id}`);
    return response.data;
  },

  async createChannel(data: Partial<ChatChannel>): Promise<ChatChannel> {
    const response = await apiClient.post<ChatChannel>('/chat/channels', data);
    return response.data;
  },

  async sendMessage(channelId: string, data: { content: string }): Promise<ChatMessage> {
    const response = await apiClient.post<ChatMessage>(`/chat/channels/${channelId}/messages`, data);
    return response.data;
  },

  async getMessages(channelId: string, params?: { page?: number; limit?: number }): Promise<ChatMessage[]> {
    const response = await apiClient.get<ChatMessage[]>(`/chat/channels/${channelId}/messages`, { params });
    return response.data;
  },

  async getDirectMessageChannels(): Promise<ChatChannel[]> {
    const response = await apiClient.get<ChatChannel[]>('/chat/dm');
    return response.data;
  },

  async getDirectMessages(employeeId: string, params?: { page?: number; limit?: number }): Promise<ChatMessage[]> {
    const response = await apiClient.get<ChatMessage[]>(`/chat/dm/${employeeId}`, { params });
    return response.data;
  },
};
