export interface Question {
  id: string;
  content: string;
  duration: number;
}

export interface ScoreRecord {
  interviewId: string;
  questionId: string;
  timestamp: number;
  techDepth: number;
  expression: number;
  logic: number;
  adaptability: number;
  comment: string;
  submitted: boolean;
}

export interface InterviewMeta {
  interviewId: string;
  date: string;
  questionIds: string[];
}

export interface InterviewState {
  isStarted: boolean;
  isFinished: boolean;
  interviewId: string | null;
  currentQuestionIndex: number;
  questions: Question[];
}

export type DimensionKey = 'techDepth' | 'expression' | 'logic' | 'adaptability';

export interface DimensionConfig {
  key: DimensionKey;
  label: string;
  color: string;
}
