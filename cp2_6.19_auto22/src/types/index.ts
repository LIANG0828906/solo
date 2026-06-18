export interface CourseUnit {
  id: string;
  title: string;
  content: string;
}

export interface Course {
  id: string;
  title: string;
  cover: string;
  description: string;
  quizId: string;
  units: CourseUnit[];
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  difficulty: 'easy' | 'medium' | 'hard';
  hint: string;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  questions: QuizQuestion[];
}

export interface UnitProgress {
  unitId: string;
  completed: boolean;
  completedAt?: string;
}

export interface CourseProgress {
  courseId: string;
  units: UnitProgress[];
  quizAttempts: QuizAttempt[];
  lastStudiedAt?: string;
}

export interface QuizAttempt {
  quizId: string;
  score: number;
  totalQuestions: number;
  wrongAnswers: WrongAnswer[];
  completedAt: string;
  timeSpent: number;
}

export interface WrongAnswer {
  questionId: string;
  question: string;
  userAnswer: number;
  correctAnswer: number;
  options: string[];
  hint: string;
}

export interface UserProgress {
  courses: Record<string, CourseProgress>;
}

export type View = 'courseList' | 'courseDetail' | 'quiz' | 'review';

export interface AppState {
  currentView: View;
  selectedCourseId: string | null;
  selectedUnitId: string | null;
  quizQuestions: QuizQuestion[];
  wrongAnswers: WrongAnswer[];
  isReviewMode: boolean;
}
