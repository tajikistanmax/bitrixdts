import apiClient from '../lib/api';
import type {
  WorkflowRoute,
  WorkflowInstance,
  WorkflowApproval,
  CreateWorkflowRouteDTO,
  StartWorkflowDTO,
  ApproveWorkflowDTO,
} from '../types/workflow';

export const workflowService = {
  // Routes
  async getAllRoutes(): Promise<WorkflowRoute[]> {
    const response = await apiClient.get<WorkflowRoute[]>('/workflow/routes');
    return response.data;
  },

  async createRoute(data: CreateWorkflowRouteDTO): Promise<WorkflowRoute> {
    const response = await apiClient.post<WorkflowRoute>('/workflow/routes', data);
    return response.data;
  },

  async startWorkflow(data: StartWorkflowDTO): Promise<WorkflowInstance> {
    const response = await apiClient.post<WorkflowInstance>('/workflow/start', data);
    return response.data;
  },

  // Instances
  async getMyActive(): Promise<WorkflowInstance[]> {
    const response = await apiClient.get<WorkflowInstance[]>('/workflow/instances/my-active');
    return response.data;
  },

  async approve(instanceId: string, stepOrder: number, data?: ApproveWorkflowDTO): Promise<void> {
    await apiClient.put(`/workflow/instances/${instanceId}/approve/${stepOrder}`, data);
  },

  async reject(
    instanceId: string,
    stepOrder: number,
    comment: string
  ): Promise<void> {
    await apiClient.put(`/workflow/instances/${instanceId}/reject/${stepOrder}`, { comment });
  },

  async getInstance(instanceId: string): Promise<WorkflowInstance> {
    const response = await apiClient.get<WorkflowInstance>(`/workflow/instances/${instanceId}`);
    return response.data;
  },

  async getApprovals(instanceId: string): Promise<WorkflowApproval[]> {
    const response = await apiClient.get<WorkflowApproval[]>(
      `/workflow/instances/${instanceId}/approvals`
    );
    return response.data;
  },
};
