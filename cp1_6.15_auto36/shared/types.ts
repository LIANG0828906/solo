export interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export type ElementType = 'fire' | 'water' | 'wind' | 'thunder';

export interface SpellTemplate {
  id: string;
  element: ElementType;
  name: string;
  difficulty: number;
  points: Point[];
}

export interface ScoreRequest {
  trajectory: Point[];
  element: ElementType;
}

export interface ScoreResponse {
  score: number;
  element: ElementType;
  matchQuality: 'perfect' | 'normal' | 'fail';
  message: string;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  element: ElementType;
  timestamp: number;
}

export interface LeaderboardSubmitRequest {
  nickname: string;
  score: number;
  element: ElementType;
}

export interface LeaderboardSubmitResponse {
  success: boolean;
  rank: number;
  isTopTen: boolean;
}

export interface GameState {
  currentElement: ElementType;
  combo: number;
  totalScore: number;
  highScore: number;
  dailyElement: ElementType;
  isDrawing: boolean;
  currentTrajectory: Point[];
}
