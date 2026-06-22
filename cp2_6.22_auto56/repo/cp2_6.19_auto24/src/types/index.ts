export type Role = 'host' | 'participant' | 'observer';

export type Rating = 1 | 2 | 3 | 4 | 5;

export interface Meeting {
  id: string;
  title: string;
  createdAt: string;
  createdBy: string;
  participantCount: number;
}

export interface Feedback {
  id: string;
  meetingId: string;
  name: string;
  role: Role;
  rating: Rating;
  keyTakeaways: string;
  improvements: string;
  createdAt: string;
  isProcessed: boolean;
  reply?: string;
  repliedAt?: string;
}

export interface MeetingStats {
  avgScore: number;
  totalFeedbacks: number;
  processedCount: number;
  ratingDistribution: Record<number, number>;
  scoreTrend: { index: number; score: number }[];
}

export type ViewType = 'list' | 'detail' | 'create';
