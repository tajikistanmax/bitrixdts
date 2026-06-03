export interface BusinessTrip {
  id: string;
  employeeId: string;
  organizationId: string;
  destination: string;
  purpose: string;
  startDate: string;
  endDate: string;
  status: string;
  estimatedCost?: number;
  report?: string;
  employee?: { id: string; fullName: string };
}
