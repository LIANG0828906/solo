export interface EventItem {
  id: string;
  name: string;
  time: string;
  location: string;
  maxParticipants: number;
  checkInCode: string;
  participantIds: string[];
  checkedInIds: string[];
  createdAt: number;
}

export interface Participant {
  id: string;
  name: string;
  checkInCode: string;
  points: number;
}

export interface CheckInRecord {
  id: string;
  eventId: string;
  participantId: string;
  participantName: string;
  timestamp: number;
}

export interface PointsLog {
  id: string;
  participantId: string;
  participantName: string;
  eventId?: string;
  eventName?: string;
  change: number;
  reason: string;
  timestamp: number;
}

export type Page = 'events' | 'checkin' | 'points';

export interface ToastState {
  message: string;
  type: 'success' | 'error';
  visible: boolean;
}
