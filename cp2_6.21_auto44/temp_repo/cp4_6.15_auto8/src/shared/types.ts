export interface Question {
  id: string;
  title: string;
  options: string[];
  correctIndex: number;
  duration: number;
  createdAt: number;
}

export interface StudentAnswer {
  questionId: string;
  studentId: string;
  studentName: string;
  selectedIndex: number;
  submittedAt: number;
}

export interface QuestionStats {
  questionId: string;
  optionCounts: number[];
  totalAnswers: number;
}

export interface LeaderboardEntry {
  studentId: string;
  studentName: string;
  score: number;
  rank: number;
}

export interface HistoryItem {
  question: Question;
  answers: StudentAnswer[];
  stats: QuestionStats;
  topStudents: LeaderboardEntry[];
  endedAt: number;
}

export type Role = 'teacher' | 'student' | null;

export interface AppState {
  role: Role;
  studentName: string;
  currentQuestion: Question | null;
  timeRemaining: number;
  isQuestionActive: boolean;
}
