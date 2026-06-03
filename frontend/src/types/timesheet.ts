export interface Timesheet {
  id: string;
  employeeId: string;
  organizationId: string;
  date: string;
  hours: number;
  description?: string;
  status: string;
  approvedById?: string;
}

export interface TimesheetStats {
  totalHours: number;
  totalOvertime: number;
  records: number;
}
