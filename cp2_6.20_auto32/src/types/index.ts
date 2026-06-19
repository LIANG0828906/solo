export type ErrorType = 'spelling' | 'punctuation' | 'grammar';

export interface GrammarError {
  id: string;
  type: ErrorType;
  text: string;
  offset: number;
  length: number;
  suggestion: string;
  message: string;
}

export interface StructureAnalysis {
  hasIntro: boolean;
  hasBody: boolean;
  hasConclusion: boolean;
  introPercent: number;
  bodyPercent: number;
  conclusionPercent: number;
  suggestions: string[];
}

export interface ScoreBreakdown {
  grammar: number;
  structure: number;
  vocabulary: number;
  relevance: number;
  total: number;
}

export interface EssaySubmission {
  id: string;
  title: string;
  content: string;
  submittedAt: string;
  errors: GrammarError[];
  structure: StructureAnalysis;
  scores: ScoreBreakdown;
}

export interface StatsResponse {
  totalSubmissions: number;
  scoreDistribution: Record<string, number>;
  errorTypeCount: Record<string, number>;
  averageScore: number;
}

export interface SubmitEssayRequest {
  title: string;
  content: string;
}

export type ScoreLevel = 'excellent' | 'medium' | 'poor';

export function getScoreLevel(total: number): ScoreLevel {
  if (total >= 85) return 'excellent';
  if (total >= 60) return 'medium';
  return 'poor';
}

export const SCORE_COLORS: Record<ScoreLevel, string> = {
  excellent: '#43A047',
  medium: '#1E88E5',
  poor: '#FF7043',
};

export const ERROR_COLORS: Record<ErrorType, string> = {
  spelling: '#E53935',
  punctuation: '#FB8C00',
  grammar: '#8E24AA',
};

export const ERROR_LABELS: Record<ErrorType, string> = {
  spelling: '拼写错误',
  punctuation: '标点错误',
  grammar: '语法错误',
};
