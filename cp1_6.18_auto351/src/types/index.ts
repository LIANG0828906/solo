export interface EmotionCoords {
  arousal: number;
  valence: number;
}

export interface AudioFeatures {
  speechRate: number;
  pitch: number;
  energy: number;
  energyVariance: number;
}

export type EmotionType = 'happy' | 'calm' | 'sad' | 'anxious' | 'angry';

export interface DiaryEntry {
  id: string;
  audioUrl?: string;
  emotionCoords: EmotionCoords;
  emotionType: EmotionType;
  emotionKeyword: string;
  textContent: string;
  isPublic: boolean;
  createdAt: string;
  userId: string;
  commentCount: number;
}

export interface Comment {
  id: string;
  diaryId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email?: string;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
}
