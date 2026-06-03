export interface Attendance {
  id: string;
  employeeId: string;
  organizationId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  source: string;
  status?: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  absent: number;
  late: number;
}
