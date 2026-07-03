import apiClient from '../lib/api';

export const payrollService = {
  getAll: async (params?: any) => {
    const { data } = await apiClient.get('/payroll', { params });
    return data;
  },
  getById: async (id: string) => {
    const { data } = await apiClient.get(`/payroll/${id}`);
    return data;
  },
  create: async (period: string) => {
    const { data } = await apiClient.post('/payroll', { period });
    return data;
  },
  autoFill: async (id: string) => {
    const { data } = await apiClient.post(`/payroll/${id}/auto-fill`);
    return data;
  },
  addEntry: async (id: string, body: any) => {
    const { data } = await apiClient.post(`/payroll/${id}/entries`, body);
    return data;
  },
  removeEntry: async (id: string, entryId: string) => {
    const { data } = await apiClient.delete(`/payroll/${id}/entries/${entryId}`);
    return data;
  },
  calculate: async (id: string) => {
    const { data } = await apiClient.post(`/payroll/${id}/calculate`);
    return data;
  },
  approve: async (id: string) => {
    const { data } = await apiClient.post(`/payroll/${id}/approve`);
    return data;
  },
  markPaid: async (id: string) => {
    const { data } = await apiClient.post(`/payroll/${id}/pay`);
    return data;
  },
  getEmployeePayslips: async (employeeId: string, year?: number) => {
    const { data } = await apiClient.get(`/payroll/employee/${employeeId}`, { params: { year } });
    return data;
  },
};
