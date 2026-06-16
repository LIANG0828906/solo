export type QuestionType = 'single' | 'multiple' | 'rating' | 'text';

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options?: QuestionOption[];
  required: boolean;
  order: number;
}

export interface QuestionnaireTemplate {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: string;
}

export interface ResponseAnswer {
  questionId: string;
  value: string | string[] | number;
}

export interface QuestionnaireResponse {
  id: string;
  templateId: string;
  answers: ResponseAnswer[];
  submittedAt: string;
}

export interface AnalysisResult {
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  stats: {
    counts?: Record<string, number>;
    percentages?: Record<string, number>;
    mean?: number;
    totalResponses: number;
  };
}
