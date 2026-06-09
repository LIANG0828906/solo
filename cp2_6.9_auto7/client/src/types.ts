export interface Bubble {
  id: string;
  content: string;
  source: 'voice' | 'text';
  timestamp: number;
  x: number;
  y: number;
  cluster?: string;
  sentiment?: number;
  isEditing?: boolean;
  isDeleting?: boolean;
  isBouncing?: boolean;
  createdAt: number;
}

export interface Cluster {
  name: string;
  color: string;
  count: number;
  bubbleIds: string[];
}

export interface SentimentPoint {
  time: number;
  value: number;
}

export interface TranscribeResponse {
  text: string;
  confidence: number;
}

export interface AnalyzeResponse {
  clusters: Cluster[];
  sentiments: { [bubbleId: string]: number };
}
