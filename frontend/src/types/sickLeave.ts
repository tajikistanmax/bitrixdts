export interface SickLeave {
  id: string;
  employeeId: string;
  organizationId: string;
  startDate: string;
  endDate: string;
  reason?: string;
  status: string;
  verifiedById?: string;
  employee?: { id: string; fullName: string };
}
