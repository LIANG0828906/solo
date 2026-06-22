export interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
  code: string;
  qrCode: string;
  createdAt: string;
  checkInCount: number;
  status: 'upcoming' | 'ongoing' | 'ended';
}

export interface CheckInRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  participantName: string;
  checkInTime: string;
}

export interface CreateEventData {
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  location: string;
  maxParticipants: number;
}

export interface CheckInTrend {
  time: string;
  count: number;
}

export interface DashboardStats {
  totalEvents: number;
  ongoingEvents: number;
  totalCheckIns: number;
  averageCheckInRate: number;
  trend: CheckInTrend[];
  recentCheckIns: CheckInRecord[];
}
