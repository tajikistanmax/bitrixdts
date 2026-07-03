import apiClient from '../lib/api';
import type { 
  Task, 
  TaskComment, 
  CreateTaskDTO, 
  UpdateTaskDTO, 
  KanbanColumn,
} from '../types/task';
import type { TaskWithDetails, TaskFilter, TaskStatistics } from '../types/task-extended';

export const taskService = {
  async getAll(params?: { status?: string; assigneeId?: string; projectId?: string; search?: string; controllerId?: string }): Promise<Task[]> {
    const response = await apiClient.get<Task[]>('/tasks', { params });
    return response.data;
  },

  async getWithFilters(filters: TaskFilter): Promise<Task[]> {
    const response = await apiClient.get<Task[]>('/tasks', { params: filters });
    return response.data;
  },

  async getById(id: string): Promise<TaskWithDetails> {
    const response = await apiClient.get<TaskWithDetails>(`/tasks/${id}`);
    return response.data;
  },

  async create(data: CreateTaskDTO): Promise<Task> {
    const response = await apiClient.post<Task>('/tasks', data);
    return response.data;
  },

  async update(id: string, data: UpdateTaskDTO): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },

  async getKanban(): Promise<KanbanColumn[]> {
    const response = await apiClient.get<KanbanColumn[]>('/tasks/kanban');
    return response.data;
  },

  async getComments(taskId: string): Promise<TaskComment[]> {
    const response = await apiClient.get<TaskComment[]>(`/tasks/${taskId}/comments`);
    return response.data;
  },

  async addComment(taskId: string, body: string): Promise<TaskComment> {
    const response = await apiClient.post<TaskComment>(`/tasks/${taskId}/comments`, { body });
    return response.data;
  },

  async getStatistics(): Promise<TaskStatistics> {
    const response = await apiClient.get<TaskStatistics>('/tasks/statistics');
    return response.data;
  },

  async updateStatus(taskId: string, status: string): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${taskId}/status`, { status });
    return response.data;
  },

  async assign(taskId: string, assigneeId: string): Promise<Task> {
    const response = await apiClient.put<Task>(`/tasks/${taskId}/assign`, { assigneeId });
    return response.data;
  },
};
