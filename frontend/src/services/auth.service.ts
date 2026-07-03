import apiClient from '../lib/api';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '../types/auth';

export const authService = {
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/login', data);
    const { accessToken, refreshToken, user } = response.data;
    return { user, tokens: { accessToken, refreshToken } };
  },

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await apiClient.post('/auth/register', data);
    const { accessToken, refreshToken, user } = response.data;
    return { user, tokens: { accessToken, refreshToken } };
  },

  async getCurrentUser(): Promise<User> {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  async logout(): Promise<void> {
    await apiClient.post('/auth/logout');
  },

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/change-password', { oldPassword, newPassword });
  },

  async forgotPassword(email: string): Promise<{ message?: string; resetUrl?: string }> {
    const response = await apiClient.post('/auth/forgot-password', { email });
    return response.data;
  },

  async resetPassword(resetToken: string, newPassword: string): Promise<void> {
    await apiClient.post('/auth/reset-password', { resetToken, newPassword });
  },
};
