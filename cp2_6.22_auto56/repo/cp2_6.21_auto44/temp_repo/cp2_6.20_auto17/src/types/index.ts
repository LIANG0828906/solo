export interface Question {
  id: number;
  content: string;
  standardAnswer: string;
  keywords: string[];
  maxWords: number;
}

export interface Assignment {
  id: string;
  title: string;
  subject: string;
  questions: Question[];
  deadline: string;
  createdAt: string;
  createdBy: string;
}

export interface Answer {
  questionId: number;
  content: string;
}

export interface GradingResult {
  questionId: number;
  score: number;
  feedback: string;
  errorType?: ErrorType;
}

export type ErrorType = 'knowledge_gap' | 'unclear_expression' | 'misunderstanding';

export interface Submission {
  id: string;
  assignmentId: string;
  userId: string;
  answers: Answer[];
  gradingResults: GradingResult[];
  submittedAt: string;
  status: 'pending' | 'grading' | 'graded';
}

export interface ErrorBookEntry {
  id: string;
  userId: string;
  assignmentId: string;
  assignmentTitle: string;
  subject: string;
  question: Question;
  studentAnswer: string;
  score: number;
  feedback: string;
  errorType: ErrorType;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  role: 'teacher' | 'student';
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  assignments: Assignment[];
  submissions: Submission[];
  errorBook: ErrorBookEntry[];
  notifications: Notification[];
}

export interface Notification {
  id: string;
  type: 'success' | 'warning' | 'error' | 'info';
  message: string;
  visible: boolean;
}
