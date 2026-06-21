export interface Question {
  id: string;
  type: 'single' | 'multiple' | 'text';
  title: string;
  options?: string[];
  maxLength?: number;
  order: number;
}

export interface Questionnaire {
  id: string;
  title: string;
  questions: Question[];
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireListItem {
  id: string;
  title: string;
  questionCount: number;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
}

export type TraineeStatus = 'not_viewed' | 'viewed' | 'submitted';

export interface Trainee {
  id: string;
  email: string;
  name: string;
  department: string;
  status: TraineeStatus;
  viewLink: string;
  createdAt: string;
  submittedAt: string | null;
  answers: any;
}

export interface DepartmentStats {
  name: string;
  total: number;
  submitted: number;
  completionRate: number;
}
