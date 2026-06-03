export interface VacationRequest {
  id: string;
  employeeId: string;
  organizationId: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  reason?: string;
  approvedById?: string;
  employee?: { id: string; fullName: string; avatarUrl?: string };
}
