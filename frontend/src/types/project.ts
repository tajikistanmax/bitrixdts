export interface Project {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  ownerId: string;
  status: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate: string;
  endDate?: string;
  progress: number;
  budget?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectMember {
  id: string;
  projectId: string;
  employeeId: string;
  role: 'owner' | 'manager' | 'member' | 'viewer';
  joinedAt: string;
}

export interface CreateProjectDTO {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  budget?: number;
  memberIds?: string[];
}

export interface UpdateProjectDTO {
  name?: string;
  description?: string;
  status?: 'active' | 'completed' | 'on_hold' | 'cancelled';
  startDate?: string;
  endDate?: string;
  budget?: number;
  progress?: number;
}

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  totalMembers: number;
  daysRemaining: number;
}
