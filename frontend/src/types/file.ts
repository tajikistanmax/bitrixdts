export interface FileRecord {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url?: string;
  organizationId: string;
  uploadedById?: string;
  createdAt: string;
}
