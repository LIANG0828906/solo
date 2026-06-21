export type QuestionType = 'single' | 'buzz';

export interface Question {
  id: string;
  type: QuestionType;
  title: string;
  options: string[];
  correctIndex: number;
  duration: number;
  createdAt: number;
  status: 'pending' | 'active' | 'ended';
  buzzerId: string | null;
  buzzerName: string | null;
}

export interface Student {
  id: string;
  name: string;
  roomId: string;
  score: number;
  rank: number;
  prevRank: number;
  connected: boolean;
}

export interface Answer {
  questionId: string;
  studentId: string;
  studentName: string;
  selectedIndex: number | null;
  isCorrect: boolean;
  timestamp: number;
}

export interface Room {
  id: string;
  code: string;
  teacherId: string;
  createdAt: number;
  students: Map<string, Student>;
  questions: Question[];
  activeQuestionId: string | null;
  answers: Map<string, Answer[]>;
  ended: boolean;
  totalCorrect: number;
  totalAnswers: number;
}

export interface WSMessage {
  type: string;
  payload: any;
}

export type WSHandler = (message: WSMessage) => void;
