export type EventStatus = 'upcoming' | 'ongoing' | 'ended';

export type RegistrationStatus = 'registered' | 'attended' | 'cancelled';

export interface ScheduleItem {
  id: string;
  time: string;
  title: string;
  description: string;
}

export interface RegistrationTrendPoint {
  date: string;
  count: number;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  coverColor: string;
  location: string;
  startDate: string;
  endDate: string;
  status: EventStatus;
  capacity: number;
  registrationCount: number;
  schedule: ScheduleItem[];
  registrationTrend: RegistrationTrendPoint[];
  createdAt: string;
}

export interface Registration {
  id: string;
  eventId: string;
  name: string;
  email: string;
  phone: string;
  participantCount: number;
  status: RegistrationStatus;
  registeredAt: string;
}
