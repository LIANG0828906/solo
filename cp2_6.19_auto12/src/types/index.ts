export interface Option {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  title: string;
  options: Option[];
  correctOptionIndex: number;
}

export interface AnswerRecord {
  id: string;
  questionId: string;
  selectedOptionIndex: number;
  isCorrect: boolean;
}

export interface QuestionStats {
  questionId: string;
  totalAnswers: number;
  correctAnswers: number;
  accuracyRate: number;
  optionCounts: number[];
}

export type Page = 'builder' | 'stats';
