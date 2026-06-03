export interface Meeting {
  id: string;
  title: string;
  description?: string;
  organizationId: string;
  startTime: string;
  endTime: string;
  status: string;
  room?: string;
  participants: MeetingParticipant[];
  creator?: { id: string; fullName: string };
}

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  employeeId: string;
  status: string;
  employee: { id: string; fullName: string };
}
