export type QuestionType = 'single' | 'multiple' | 'rating';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options?: string[];
  order: number;
}

export interface VoteSubmission {
  id: string;
  timestamp: number;
  answers: Record<string, string | string[] | number>;
}

export interface Poll {
  id: string;
  shortCode: string;
  title: string;
  description?: string;
  questions: Question[];
  submissions: VoteSubmission[];
  createdAt: number;
  closedAt?: number;
  isActive: boolean;
}

export interface PollListItem {
  id: string;
  shortCode: string;
  title: string;
  description?: string;
  questionCount: number;
  submissionCount: number;
  createdAt: number;
  isActive: boolean;
  closedAt?: number;
}

export interface CreatePollDto {
  title: string;
  description?: string;
  questions: Omit<Question, 'id'>[];
}

export interface SubmitVoteDto {
  pollId: string;
  answers: Record<string, string | string[] | number>;
}

export interface SingleStat {
  label: string;
  value: number;
}

export interface RatingBucket {
  label: string;
  rating: number;
  value: number;
}

export interface RatingTrendPoint {
  index: number;
  average: number;
}

export interface QuestionStat {
  questionId: string;
  type: QuestionType;
  title: string;
  total: number;
  data: SingleStat[] | RatingBucket[];
  average?: number;
  trend?: RatingTrendPoint[];
}

export interface ResultData {
  pollId: string;
  stats: QuestionStat[];
  updatedAt: number;
}
