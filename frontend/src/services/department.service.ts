import apiClient from '../lib/api';
import type { Department, CreateDepartmentDTO, UpdateDepartmentDTO, DepartmentTree } from '../types/department';

export const departmentService = {
  async getAll(params?: { parentId?: string }): Promise<Department[]> {
    const response = await apiClient.get<Department[]>('/departments', { params });
    return response.data;
  },

  async getById(id: string): Promise<Department> {
    const response = await apiClient.get<Department>(`/departments/${id}`);
    return response.data;
  },

  async create(data: CreateDepartmentDTO): Promise<Department> {
    const response = await apiClient.post<Department>('/departments', data);
    return response.data;
  },

  async update(id: string, data: UpdateDepartmentDTO): Promise<Department> {
    const response = await apiClient.put<Department>(`/departments/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/departments/${id}`);
  },

  async getTree(): Promise<DepartmentTree[]> {
    const response = await apiClient.get<DepartmentTree[]>('/departments/tree');
    return response.data;
  },

  async getEmployees(departmentId: string): Promise<any[]> {
    const response = await apiClient.get(`/departments/${departmentId}/employees`);
    return response.data;
  },

  async getSubordinates(departmentId: string): Promise<Department[]> {
    const response = await apiClient.get<Department[]>(`/departments/${departmentId}/subordinates`);
    return response.data;
  },
};
