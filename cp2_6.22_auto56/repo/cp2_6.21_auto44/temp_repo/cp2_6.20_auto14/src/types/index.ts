export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Unit {
  id: string;
  title: string;
  description: string;
  difficulty: number;
  order: number;
  status: 'pending' | 'in-progress' | 'completed' | 'warning';
  quiz: QuizQuestion[];
  score?: number;
  timeSpent?: number;
  isExpanded?: boolean;
  estimatedTime?: number;
}

export interface Abilities {
  basicKnowledge: number;
  problemSpeed: number;
  reasoning: number;
  memory: number;
  comprehensive: number;
}

export interface QuestionDetail {
  questionId: string;
  isCorrect: boolean;
  userAnswer: number;
  correctAnswer: number;
  explanation: string;
}

export interface QuizResult {
  score: number;
  correctCount: number;
  totalCount: number;
  details: QuestionDetail[];
  timeSpent: number;
}

export interface LearningRecord {
  unitId: string;
  unitTitle: string;
  order: number;
  score: number;
  timeSpent: number;
  completedAt: string;
}

export type Subject = 'math' | 'english' | 'physics' | 'chemistry';
export type Level = 'beginner' | 'elementary' | 'intermediate' | 'advanced';

export const SUBJECT_LABELS: Record<Subject, string> = {
  math: '数学',
  english: '英语',
  physics: '物理',
  chemistry: '化学',
};

export const LEVEL_LABELS: Record<Level, string> = {
  beginner: '入门',
  elementary: '初级',
  intermediate: '中级',
  advanced: '高级',
};

export const ABILITY_LABELS: Record<keyof Abilities, string> = {
  basicKnowledge: '基础知识',
  problemSpeed: '解题速度',
  reasoning: '推理能力',
  memory: '记忆力',
  comprehensive: '综合运用',
};
