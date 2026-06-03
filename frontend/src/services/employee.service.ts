import apiClient from '../lib/api';
import type { Employee, CreateEmployeeDTO, UpdateEmployeeDTO } from '../types/employee';

export const employeeService = {
  async getAll(params?: { page?: number; limit?: number; search?: string }): Promise<Employee[]> {
    const response = await apiClient.get<Employee[]>('/employees', { params });
    return response.data;
  },

  async getById(id: string): Promise<Employee> {
    const response = await apiClient.get<Employee>(`/employees/${id}`);
    return response.data;
  },

  async create(data: CreateEmployeeDTO): Promise<Employee> {
    const response = await apiClient.post<Employee>('/employees', data);
    return response.data;
  },

  async update(id: string, data: UpdateEmployeeDTO): Promise<Employee> {
    const response = await apiClient.put<Employee>(`/employees/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await apiClient.delete(`/employees/${id}`);
  },

  async getHistory(id: string): Promise<any> {
    const response = await apiClient.get(`/employees/${id}/history`);
    return response.data;
  },

  async getSubordinates(id: string): Promise<Employee[]> {
    const response = await apiClient.get<Employee[]>(`/employees/${id}/subordinates`);
    return response.data;
  },
};
