export type QuestionType = 'single' | 'multiple' | 'rating';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options?: string[];
}

export interface Answer {
  questionId: string;
  value: string | string[] | number;
}

export interface Vote {
  id: string;
  pollId: string;
  answers: Answer[];
  submittedAt: number;
}

export interface Poll {
  id: string;
  title: string;
  shortCode: string;
  questions: Question[];
  createdAt: number;
  closed: boolean;
  closedAt: number | null;
  voteCount?: number;
}

export interface ResultData {
  questionId: string;
  type: QuestionType;
  data: Record<string, number>;
  average?: number;
}

export interface PollResults {
  pollId: string;
  totalVotes: number;
  results: Record<string, ResultData>;
  lastUpdated: number;
}
