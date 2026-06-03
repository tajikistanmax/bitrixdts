export interface ChatChannel {
  id: string;
  name: string;
  type: string;
  organizationId: string;
  members: ChatMember[];
  lastMessage?: ChatMessage;
}

export interface ChatMember {
  id: string;
  employeeId: string;
  employee: { id: string; fullName: string; avatarUrl?: string };
}

export interface ChatMessage {
  id: string;
  channelId: string;
  employeeId: string;
  content: string;
  createdAt: string;
  employee: { id: string; fullName: string; avatarUrl?: string };
}
