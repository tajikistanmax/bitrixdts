export interface Resolution {
  id: string;
  title: string;
  description?: string;
  organizationId: string;
  dueDate?: string;
  status: string;
  executor?: { id: string; fullName: string };
  controller?: { id: string; fullName: string };
  createdAt: string;
}
