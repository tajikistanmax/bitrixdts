export interface Document {
  id: string;
  title: string;
  description?: string;
  organizationId: string;
  fileUrl?: string;
  fileType?: string;
  fileSize?: number;
  status: string;
  owner?: { id: string; fullName: string };
  createdAt: string;
}
