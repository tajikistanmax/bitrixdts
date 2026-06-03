export interface WorkflowRoute {
  id: string;
  name: string;
  entityType: string;
  organizationId: string;
  steps: WorkflowStep[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStep {
  order: number;
  type: 'employee' | 'position' | 'department' | 'role' | 'condition';
  employeeId?: string;
  position?: string;
  departmentId?: string;
  roleId?: string;
  condition?: string;
}

export interface WorkflowInstance {
  id: string;
  routeId: string;
  route: WorkflowRoute;
  entityId: string;
  entityType: string;
  status: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  currentStep: number;
  startedBy: string;
  startedAt: string;
  completedAt?: string;
}

export interface WorkflowApproval {
  id: string;
  instanceId: string;
  approverId: string;
  approverName?: string;
  stepOrder: number;
  status: 'pending' | 'approved' | 'rejected';
  comment?: string;
  decidedAt?: string;
}

export interface CreateWorkflowRouteDTO {
  name: string;
  entityType: string;
  steps: WorkflowStep[];
}

export interface StartWorkflowDTO {
  routeId: string;
  entityId: string;
  entityType: string;
}

export interface ApproveWorkflowDTO {
  comment?: string;
}
