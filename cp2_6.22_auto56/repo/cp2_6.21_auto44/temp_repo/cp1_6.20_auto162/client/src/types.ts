export interface EventData {
  id: string;
  name: string;
  date: string;
  time: string;
  location: string;
  maxCapacity: number;
  roleLimits: Record<string, number>;
  createdAt: string;
}

export interface ParticipantData {
  id: string;
  eventId: string;
  name: string;
  contact: string;
  role: string;
  checkInCode: string;
  checkedIn: boolean;
  checkInTime: string | null;
  registeredAt: string;
}
