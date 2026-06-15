export interface Point {
  x: number;
  y: number;
  timestamp: number;
}

export type ElementType = 'fire' | 'water' | 'wind' | 'thunder';

export type MatchQuality = 'perfect' | 'normal' | 'fail';

export interface SpellTemplate {
  id: string;
  element: ElementType;
  name: string;
  points: Point[];
  difficulty: number;
}

export interface ScoreRequest {
  trajectory: Point[];
  element: ElementType;
}

export interface ScoreResponse {
  score: number;
  element: ElementType;
  matchQuality: MatchQuality;
  message: string;
}

export interface LeaderboardEntry {
  id: string;
  nickname: string;
  score: number;
  element: ElementType;
  timestamp: number;
  isNewRecord?: boolean;
}

export interface LeaderboardRanking {
  rank: number;
  nickname: string;
  score: number;
  isNewRecord?: boolean;
}

export interface LeaderboardResponse {
  rankings: LeaderboardRanking[];
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

export interface AddScoreResult {
  rank: number;
  isInTopTen: boolean;
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

export const ELEMENT_COLORS: Record<ElementType, { primary: string; gradient: [string, string] }> = {
  fire: { primary: '#ff6b35', gradient: ['#ff3d00', '#ffb347'] },
  water: { primary: '#4fc3f7', gradient: ['#0288d1', '#b3e5fc'] },
  wind: { primary: '#66bb6a', gradient: ['#2e7d32', '#b9f6ca'] },
  thunder: { primary: '#b388ff', gradient: ['#7c4dff', '#e1bee7'] },
};

export const ELEMENT_COUNTER: Record<ElementType, ElementType> = {
  fire: 'wind',
  wind: 'thunder',
  thunder: 'water',
  water: 'fire',
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  fire: '火焰',
  water: '水波',
  wind: '旋风',
  thunder: '雷电',
};
