export interface Keyword {
  word: string;
  scorePoint: number;
}

export interface Question {
  id: string;
  text: string;
  referenceAnswer: string;
  keywords: Keyword[];
  maxScore: number;
  createdAt: string;
}

export interface ScoreRecord {
  id: string;
  questionId: string;
  studentName: string;
  studentClass: string;
  studentAnswer: string;
  totalScore: number;
  keywordScore: number;
  lengthScore: number;
  semanticScore: number;
  feedback: string;
  scoredAt: string;
  algorithmVersion?: number;
}

export interface GlobalStats {
  totalSubmissions: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
}

export interface ScoringResult {
  totalScore: number;
  keywordScore: number;
  lengthScore: number;
  semanticScore: number;
  feedback: string;
}
