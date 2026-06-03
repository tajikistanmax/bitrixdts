import apiClient from '../lib/api';
import type { Meeting, MeetingParticipant } from '../types/meeting';

export const meetingService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<Meeting[]> {
    const response = await apiClient.get<Meeting[]>('/meetings', { params });
    return response.data;
  },

  async getById(id: string): Promise<Meeting> {
    const response = await apiClient.get<Meeting>(`/meetings/${id}`);
    return response.data;
  },

  async create(data: any): Promise<Meeting> {
    const response = await apiClient.post<Meeting>('/meetings', data);
    return response.data;
  },

  async update(id: string, data: any): Promise<Meeting> {
    const response = await apiClient.put<Meeting>(`/meetings/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/meetings/${id}`);
  },

  async getParticipants(meetingId: string): Promise<MeetingParticipant[]> {
    const response = await apiClient.get<MeetingParticipant[]>(`/meetings/${meetingId}/participants`);
    return response.data;
  },

  async addParticipant(meetingId: string, employeeId: string): Promise<MeetingParticipant> {
    const response = await apiClient.post<MeetingParticipant>(`/meetings/${meetingId}/participants`, { employeeId });
    return response.data;
  },

  async removeParticipant(meetingId: string, participantId: string): Promise<void> {
    await apiClient.delete(`/meetings/${meetingId}/participants/${participantId}`);
  },
};
