export interface Delegation {
  id: string;
  delegatorId: string;
  delegateeId: string;
  organizationId: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  delegator?: { id: string; fullName: string };
  delegatee?: { id: string; fullName: string };
}
