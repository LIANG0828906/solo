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
  points: Point[];
  difficulty: number;
}

export interface ScoreRequest {
  trajectory: Point[];
  element: ElementType;
}

export type MatchQuality = 'perfect' | 'normal' | 'fail';

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

export interface AddScoreResult {
  rank: number;
  isInTopTen: boolean;
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

export interface LeaderboardResponse {
  rankings: LeaderboardRanking[];
}
