export interface FileRecord {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  organizationId: string;
  entityType?: string | null;
  entityId?: string | null;
  folderId?: string | null;
  uploaderId?: string;
  uploader?: { id: string; fullName: string; avatarUrl?: string | null };
  createdAt: string;
}

export interface FolderRecord {
  id: string;
  name: string;
  parentId: string | null;
  color?: string;
  isShared?: boolean;
  createdById?: string;
  createdBy?: { id: string; fullName: string };
  createdAt?: string;
  _count?: { children: number };
}
