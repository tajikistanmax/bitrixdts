export interface Announcement {
  id: string;
  title: string;
  body: string;
  priority: string;
  organizationId: string;
  createdAt: string;
  author?: { id: string; fullName: string };
}
