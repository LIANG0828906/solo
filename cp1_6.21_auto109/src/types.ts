export type QuestionType = 'choice' | 'judge';

export interface Question {
  id: string;
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string;
  knowledgePoints: string[];
}

export interface Answer {
  questionId: string;
  answer: string;
}

export interface GradeResultItem {
  questionId: string;
  isCorrect: boolean;
  score: number;
  knowledgePoints: string[];
  explanation: string;
  correctAnswer: string;
  userAnswer: string;
}

export interface GradeResult {
  totalScore: number;
  maxScore: number;
  results: GradeResultItem[];
  knowledgePointErrors: Record<string, number>;
}

export interface CreateQuestionPayload {
  type: QuestionType;
  text: string;
  options?: string[];
  correctAnswer: string;
  knowledgePoints: string[];
}
