import type { RecordingData } from './store';

export interface AudioFeatures {
  pitch: number;
  energy: number;
  zeroCrossingRate: number;
  duration: number;
}

export interface EmotionResult {
  valence: number;
  arousal: number;
  emotionCategory: 'happy' | 'calm' | 'sad' | 'angry';
}

export async function analyzeEmotion(features: AudioFeatures): Promise<RecordingData> {
  const response = await fetch('/api/emotion', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(features),
  });

  if (!response.ok) {
    throw new Error('Failed to analyze emotion');
  }

  return response.json();
}

export async function getHistory(): Promise<RecordingData[]> {
  const response = await fetch('/api/emotion?all=true');

  if (!response.ok) {
    throw new Error('Failed to fetch history');
  }

  return response.json();
}
