export enum QuestionType {
  SINGLE_CHOICE = 'single_choice',
  MULTIPLE_CHOICE = 'multiple_choice',
  TEXT = 'text',
}

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: QuestionOption[];
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
  questions: Question[];
}

export interface SurveyAnswer {
  questionId: string;
  value: string | string[];
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  submittedAt: Date;
  answers: SurveyAnswer[];
}

export const QuestionTypeLabel: Record<QuestionType, string> = {
  [QuestionType.SINGLE_CHOICE]: '单选题',
  [QuestionType.MULTIPLE_CHOICE]: '多选题',
  [QuestionType.TEXT]: '文本题',
};

export const generateId = (): string => {
  return Math.random().toString(36).substring(2, 11) + Date.now().toString(36);
};
