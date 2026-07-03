import apiClient from '../lib/api';

export const dashboardService = {
  getEmployeeDashboard: async () => {
    const { data } = await apiClient.get('/dashboard/employee');
    return data;
  },

  getManagerDashboard: async () => {
    const { data } = await apiClient.get('/dashboard/manager');
    return data;
  },

  getExecutiveDashboard: async () => {
    const { data } = await apiClient.get('/dashboard/executive');
    return data;
  },
};
