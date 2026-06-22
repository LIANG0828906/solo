export type QuestionType = 'single' | 'multiple' | 'rating';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options?: string[];
}

export interface Vote {
  id: string;
  answers: Record<number, string | string[] | number>;
  submittedAt: number;
}

export interface Poll {
  id: string;
  title: string;
  shortCode: string;
  questions: Question[];
  votes: Vote[];
  createdAt: number;
  closed: boolean;
  closedAt: number | null;
}
