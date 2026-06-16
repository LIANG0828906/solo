export interface EventItem {
  id: string;
  name: string;
  date: string;
  location: string;
  maxParticipants: number;
  createdAt: string;
}

export interface CheckIn {
  id: string;
  eventId: string;
  participantName: string;
  timestamp: string;
}

export type EmotionType = 'happy' | 'neutral' | 'sad' | 'angry' | 'excited';

export interface Feedback {
  id: string;
  eventId: string;
  checkInId: string;
  emotion: EmotionType;
  timestamp: string;
}

export interface EmotionStats {
  happy: number;
  neutral: number;
  sad: number;
  angry: number;
  excited: number;
}

export interface TrendDataPoint {
  time: string;
  count: number;
}
