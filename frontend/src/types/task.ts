export interface Task {
  id: string;
  title: string;
  description?: string;
  organizationId: string;
  projectId?: string;
  assigneeId?: string;
  controllerId?: string;
  creatorId: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  dueDate?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  parentTaskId?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  authorId: string;
  body: string;
  attachments?: any[];
  systemComment: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskDTO {
  title: string;
  description?: string;
  projectId?: string;
  assigneeId?: string;
  controllerId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: string;
}

export interface UpdateTaskDTO {
  title?: string;
  description?: string;
  assigneeId?: string;
  controllerId?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
  dueDate?: string;
}

export interface KanbanColumn {
  status: string;
  title: string;
  tasks: Task[];
}
