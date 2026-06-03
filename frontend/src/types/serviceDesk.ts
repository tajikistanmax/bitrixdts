export interface Ticket {
  id: string;
  title: string;
  description?: string;
  organizationId: string;
  priority: string;
  status: string;
  requester?: { id: string; fullName: string };
  assignee?: { id: string; fullName: string };
  createdAt: string;
}
