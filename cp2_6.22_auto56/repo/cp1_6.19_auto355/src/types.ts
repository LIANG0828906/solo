import type { ReactNode } from 'react';

export type QuestionType = 'single' | 'multiple' | 'rating';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options?: string[];
  maxRating?: number;
  required?: boolean;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  isPublished: boolean;
  createdAt: number;
  publishedAt?: number;
}

export interface ResponseAnswer {
  questionId: string;
  value: string | string[] | number;
}

export interface SurveyResponse {
  id: string;
  surveyId: string;
  answers: ResponseAnswer[];
  submittedAt: number;
  completionTime: number;
}

export interface PieChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface BarChartDatum {
  label: string;
  value: number;
  color?: string;
}

export interface LineChartDatum {
  label: string;
  value: number;
}

export interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: ReactNode;
}
