export interface Question {
  id: number;
  question: string;
  imageUrl: string;
  options: string[];
  correctAnswer: number;
  category: string;
}

export interface Level {
  id: number;
  name: string;
  theme: string;
  questionCount: number;
  status: 'locked' | 'current' | 'completed';
}

export interface GameState {
  currentLevel: number;
  lives: number;
  score: number;
  combo: number;
  completedLevels: number[];
}

export interface AnimationContextType {
  isMobile: boolean;
  theme: 'neon-dark';
}
