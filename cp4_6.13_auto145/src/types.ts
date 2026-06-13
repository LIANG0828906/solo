export interface Rule {
  id: string;
  name: string;
  type: 'regex' | 'keyword' | 'structural';
  pattern: string;
  weight: number;
  suggestion: string;
}

export interface ScoreResult {
  ruleId: string;
  ruleName: string;
  score: number;
  maxScore: number;
  passed: boolean;
  matchedTexts: string[];
  suggestion: string;
}

export interface GradingResult {
  id: string;
  filename: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  results: ScoreResult[];
  timestamp: string;
}

export interface HistoryRecord {
  id: string;
  filename: string;
  totalScore: number;
  maxScore: number;
  percentage: number;
  timestamp: string;
}
