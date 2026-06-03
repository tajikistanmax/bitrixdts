export interface SyncItem {
  id: string;
  entityType: string;
  entityId: string;
  action: string;
  status: string;
  createdAt: string;
}

export interface SyncStats {
  total: number;
  pending: number;
  processing: number;
  failed: number;
  completed: number;
}
