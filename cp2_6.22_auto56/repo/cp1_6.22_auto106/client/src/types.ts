export interface Question {
  id: string;
  type: 'single' | 'judge';
  content: string;
  options: string[];
  correctAnswer: number;
}

export interface Student {
  id: string;
  name: string;
}

export interface AnswerRecord {
  studentId: string;
  questionIndex: number;
  answer: number;
  timeSpent: number;
  isCorrect: boolean;
  submittedAt: number;
}

export interface Quiz {
  id: string;
  questions: Question[];
  startTime: number;
  status: 'active' | 'ended';
  perQuestionTime: number;
}

export interface ClassroomState {
  code: string;
  className: string;
  teacherName: string;
  studentCount: number;
  students: Student[];
  currentQuiz: Quiz | null;
  answers: AnswerRecord[];
}

export interface QuestionStat {
  questionIndex: number;
  question: Question;
  correctCount: number;
  wrongCount: number;
  totalCount: number;
  avgTime: number;
  accuracy: number;
  studentAnswers: StudentAnswer[];
}

export interface StudentAnswer {
  studentId: string;
  studentName: string;
  answer: number | null;
  timeSpent: number;
  isCorrect: boolean;
  answered: boolean;
}

export interface StudentStat {
  studentId: string;
  studentName: string;
  correctCount: number;
  totalQuestions: number;
  totalTime: number;
  accuracy: number;
}

export interface QuizReport {
  className: string;
  teacherName: string;
  studentCount: number;
  totalQuestions: number;
  overallAccuracy: number;
  questionStats: QuestionStat[];
  studentStats: StudentStat[];
  generatedAt: number;
}
