export type QuestionType = 'choice' | 'judge' | 'fill';

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  options?: string[];
  answer: string;
  score: number;
}

export interface Answer {
  questionId: string;
  answer: string;
  isCorrect: boolean;
  timeSpent: number;
}

export interface Quiz {
  id: string;
  title: string;
  questions: Question[];
  createdAt: string;
}

export interface Score {
  quizId: string;
  studentName: string;
  totalScore: number;
  correctCount: number;
  totalQuestions: number;
  accuracy: number;
  totalTime: number;
  answers: Answer[];
  questionStats: QuestionStat[];
  submittedAt: string;
}

export interface QuestionStat {
  questionId: string;
  questionIndex: number;
  accuracy: number;
  avgTimeSpent: number;
}

export interface QuizStoreState {
  quizzes: Quiz[];
  currentQuizId: string | null;
  currentQuestionIndex: number;
  userAnswers: Answer[];
  scoreResult: Score | null;
  allScores: Score[];
  questionStartTime: number;
  setQuizzes: (quizzes: Quiz[]) => void;
  setCurrentQuiz: (quizId: string) => void;
  setCurrentQuestionIndex: (index: number) => void;
  addAnswer: (answer: Answer) => void;
  setScoreResult: (score: Score | null) => void;
  setAllScores: (scores: Score[]) => void;
  setQuestionStartTime: (time: number) => void;
  resetQuiz: () => void;
}
