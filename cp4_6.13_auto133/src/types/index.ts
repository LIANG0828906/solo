export interface Comment {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
  sentiment?: string;
}

export interface Post {
  id: string;
  username: string;
  content: string;
  timestamp: string;
  likes: number;
  comments: Comment[];
  tags?: string[];
}

export interface SentimentResult {
  score: number;
  label: 'positive' | 'neutral' | 'negative';
  positiveWords: string[];
  negativeWords: string[];
  positiveCount: number;
  negativeCount: number;
}

export type TimeRange = '24h' | '7d' | '30d';
