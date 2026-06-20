export type Era = '先秦' | '秦汉' | '三国两晋' | '唐宋' | '明清' | '近代';

export interface Question {
  id: string;
  year: number;
  event: string;
  description: string;
  era: Era;
}

export interface AnswerItem {
  id: string;
  year: number;
  event: string;
}

export interface CheckResult {
  id: string;
  isCorrect: boolean;
  userPosition: number;
  correctPosition: number;
  correctYear: number;
  correctEvent: string;
}

export interface StoreState {
  currentQuestions: Question[];
  userOrder: Question[];
  score: number | null;
  results: CheckResult[];
  isStarted: boolean;
  isSubmitted: boolean;
  scoreHistory: number[];

  setQuestions: (questions: Question[]) => void;
  setUserOrder: (order: Question[]) => void;
  setScore: (score: number) => void;
  setResults: (results: CheckResult[]) => void;
  setStarted: (started: boolean) => void;
  setSubmitted: (submitted: boolean) => void;
  reset: () => void;
}

export const ERA_COLORS: Record<Era, string> = {
  '先秦': '#8B4513',
  '秦汉': '#B22222',
  '三国两晋': '#DAA520',
  '唐宋': '#1E90FF',
  '明清': '#2E8B57',
  '近代': '#9370DB',
};
