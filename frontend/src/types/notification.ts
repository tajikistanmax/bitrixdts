export interface Notification {
  id: string;
  employeeId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: NotificationData;
  isRead: boolean;
  createdAt: string;
  readAt?: string;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_status_changed'
  | 'task_comment'
  | 'task_overdue'
  | 'workflow_approval'
  | 'workflow_approved'
  | 'workflow_rejected'
  | 'mention'
  | 'general';

export interface NotificationData {
  taskId?: string;
  taskTitle?: string;
  workflowId?: string;
  workflowName?: string;
  authorId?: string;
  authorName?: string;
  url?: string;
  [key: string]: any;
}

export interface NotificationStats {
  total: number;
  unread: number;
  byType: Record<string, number>;
}
