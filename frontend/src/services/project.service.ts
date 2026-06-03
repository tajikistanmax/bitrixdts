import apiClient from '../lib/api';
import type { Project, ProjectMember, CreateProjectDTO, UpdateProjectDTO, ProjectStats } from '../types/project';

export const projectService = {
  async getAll(params?: { status?: string; ownerId?: string }): Promise<Project[]> {
    const response = await apiClient.get<Project[]>('/projects', { params });
    return response.data;
  },

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<Project>(`/projects/${id}`);
    return response.data;
  },

  async create(data: CreateProjectDTO): Promise<Project> {
    const response = await apiClient.post<Project>('/projects', data);
    return response.data;
  },

  async update(id: string, data: UpdateProjectDTO): Promise<Project> {
    const response = await apiClient.put<Project>(`/projects/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/projects/${id}`);
  },

  async getMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await apiClient.get<ProjectMember[]>(`/projects/${projectId}/members`);
    return response.data;
  },

  async addMember(projectId: string, employeeId: string, role: string): Promise<ProjectMember> {
    const response = await apiClient.post<ProjectMember>(`/projects/${projectId}/members`, {
      employeeId,
      role
    });
    return response.data;
  },

  async removeMember(projectId: string, employeeId: string): Promise<void> {
    await apiClient.delete(`/projects/${projectId}/members/${employeeId}`);
  },

  async getStats(projectId: string): Promise<ProjectStats> {
    const response = await apiClient.get<ProjectStats>(`/projects/${projectId}/stats`);
    return response.data;
  },
};
