export type QuestionType = 'single' | 'multiple' | 'text';

export interface QuestionData {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options: string[];
  sortOrder: number;
}

export interface SurveyData {
  id?: string;
  title: string;
  description: string;
  startTime: string | null;
  endTime: string | null;
  questions: QuestionData[];
}

export interface Answer {
  id: string;
  response_id: string;
  question_id: string;
  answer: string;
}

export interface Response {
  id: string;
  survey_id: string;
  created_at: string;
}

export interface StatsData {
  survey: SurveyData & { created_at: string };
  responses: Response[];
  answers: Answer[];
  count: number;
}
