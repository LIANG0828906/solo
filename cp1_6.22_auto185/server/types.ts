export interface TeamMember {
  id: string;
  name: string;
  timezone: string;
  email?: string;
  availability: MemberAvailability;
  avatarColor: string;
}

export interface MemberAvailability {
  [day: number]: number[];
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

export interface TimeSlot {
  startHourUTC: number;
  endHourUTC: number;
  durationHours: number;
  availableMemberIds: string[];
  unavailableMemberIds: string[];
}

export interface Recommendation {
  startHourUTC: number;
  endHourUTC: number;
  availableMemberIds: string[];
  score: number;
}
