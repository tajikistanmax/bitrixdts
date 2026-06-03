export interface AuditLog {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actor: string;
  ip: string;
  createdAt: string;
}
