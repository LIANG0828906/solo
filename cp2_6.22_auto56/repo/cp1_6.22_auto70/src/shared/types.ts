export interface User {
  id: string;
  name: string;
  city: string;
  timezone: string;
  utcOffset: number;
  workStart: string;
  workEnd: string;
  online: boolean;
}

export interface Schedule {
  id: string;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  participantIds: string[];
  color: string;
}

export interface ParticipantLocalTime {
  userId: string;
  localTime: string;
}

export interface Recommendation {
  startTime: string;
  endTime: string;
  overlapCount: number;
  overlapPercent: number;
  participantLocalTimes: ParticipantLocalTime[];
}

export interface ChatMessage {
  id: string;
  scheduleId: string;
  userId: string;
  content: string;
  timestamp: string;
  type: 'text' | 'emoji';
}
