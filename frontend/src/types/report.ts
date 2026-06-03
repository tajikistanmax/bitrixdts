export interface Report {
  id: string;
  title: string;
  type: string;
  organizationId: string;
  config: any;
  createdAt: string;
  createdBy?: { id: string; fullName: string };
}
