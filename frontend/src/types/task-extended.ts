import type { Task, TaskComment } from '../types/task';
import type { Employee } from '../types/employee';

export interface TaskWithDetails extends Task {
  assignee?: Employee;
  controller?: Employee;
  creator?: Employee;
  comments?: TaskComment[];
  attachments?: TaskAttachment[];
  history?: TaskHistory[];
  project?: {
    id: string;
    name: string;
  };
}

export interface TaskAttachment {
  id: string;
  taskId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedBy: string;
  uploadedAt: string;
  url: string;
}

export interface TaskHistory {
  id: string;
  taskId: string;
  changedBy: string;
  changedByName?: string;
  fieldName: string;
  oldValue?: string;
  newValue?: string;
  comment?: string;
  createdAt: string;
}

export interface TaskFilter {
  status?: string;
  assigneeId?: string;
  projectId?: string;
  priority?: string;
  search?: string;
  dueDateFrom?: string;
  dueDateTo?: string;
}

export interface TaskStatistics {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  overdue: number;
  completedThisWeek: number;
}
