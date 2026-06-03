export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  organizationId: string;
  startDate: string;
  endDate: string;
  type: string;
  employeeId?: string;
}
