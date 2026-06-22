export interface TeamMember {
  id: string;
  name: string;
  timezone: string;
  email?: string;
  availability: { [day: number]: number[] };
  avatarColor: string;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  members: TeamMember[];
  createdAt: number;
}

export interface Meeting {
  id: string;
  teamId: string;
  title: string;
  date: string;
  startTimeUTC: string;
  endTimeUTC: string;
  durationMinutes: number;
  notes?: string;
  participantIds: string[];
  notified15: boolean;
  notified5: boolean;
  createdAt: number;
}

export interface WSNotification {
  type: 'connected' | 'meeting_reminder_15' | 'meeting_reminder_5' | 'meeting_created';
  clientId?: string;
  meetingId?: string;
  title?: string;
  startTimeUTC?: string;
  endTimeUTC?: string;
  teamName?: string;
  minutesUntil?: number;
  timestamp: number;
}

export interface NotificationItem {
  id: string;
  type: 'reminder_15' | 'reminder_5' | 'created';
  meetingId: string;
  title: string;
  startTimeUTC: string;
  endTimeUTC: string;
  teamName: string;
  minutesUntil: number;
  timestamp: number;
  read: boolean;
}
