export interface Option {
  value: string;
  label: string;
}

export interface SkipLogic {
  condition: {
    questionId: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
    value: string | number | string[];
  };
  skipToQuestionId?: string;
  skip: boolean;
}

export interface Question {
  id: string;
  type: 'single' | 'multiple' | 'text' | 'rating';
  title: string;
  description?: string;
  options?: Option[];
  skipLogic?: SkipLogic[];
  required: boolean;
}

export interface QuestionnaireModel {
  title: string;
  description: string;
  questions: Question[];
}

export type AnswerValue = string | string[] | number | null;

export interface Answers {
  [questionId: string]: AnswerValue;
}

export interface ParsedResponse {
  success: boolean;
  message: string;
  data: QuestionnaireModel;
}
