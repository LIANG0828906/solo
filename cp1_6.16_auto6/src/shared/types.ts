export type QuestionType = 'single' | 'multiple' | 'text' | 'rating';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  required: boolean;
  options?: string[];
  maxRating?: number;
}

export interface Survey {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: Date;
  published: boolean;
}

export interface Answer {
  id: string;
  surveyId: string;
  questionId: string;
  value: string | string[] | number;
  submittedAt: Date;
}

export interface Submission {
  id: string;
  surveyId: string;
  answers: Answer[];
  submittedAt: Date;
}

export interface QuestionStats {
  questionId: string;
  questionTitle: string;
  questionType: QuestionType;
  totalResponses: number;
  skippedCount: number;
  optionCounts?: Record<string, number>;
  averageRating?: number;
  textResponses?: string[];
}

export interface SurveyResults {
  surveyId: string;
  surveyTitle: string;
  totalSubmissions: number;
  startTime?: Date;
  endTime?: Date;
  questionStats: QuestionStats[];
}

export type SurveyCreateInput = Omit<Survey, 'id' | 'createdAt' | 'published'>;

export type SurveyUpdateInput = Partial<Omit<Survey, 'id' | 'createdAt'>>;

export interface SubmissionCreateInput {
  surveyId: string;
  answers: Array<Omit<Answer, 'id' | 'surveyId' | 'submittedAt'>>;
}

export interface ExportData {
  surveys: Survey[];
  submissions: Submission[];
  exportedAt: Date;
}
