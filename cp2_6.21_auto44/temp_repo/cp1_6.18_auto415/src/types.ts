export interface User {
  id: string;
  email: string;
  createdAt: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export type EmotionType = 'joy' | 'sadness' | 'anger' | 'excitement' | 'neutral';

export interface TextSegment {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  emotion: EmotionType;
  confidence: number;
  orderIndex?: number;
}

export interface Work {
  id: string;
  title: string;
  duration: number;
  audio_path: string | null;
  image_path: string | null;
  audio_url: string | null;
  image_url: string | null;
  createdAt: string;
  updatedAt: string;
  text_segments: TextSegment[];
}

export interface WorkListItem {
  id: string;
  title: string;
  duration: number;
  audio_path: string | null;
  image_path: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SentimentResponse {
  emotion: EmotionType;
  confidence: number;
  keywords: string[];
}

export interface ShareResponse {
  share_id: string;
  share_url: string;
  view_count: number;
  expires_at: string;
}

export interface SharedWork {
  id: string;
  title: string;
  duration: number;
  audio_url: string | null;
  image_url: string | null;
  text_segments: TextSegment[];
  view_count: number;
}
