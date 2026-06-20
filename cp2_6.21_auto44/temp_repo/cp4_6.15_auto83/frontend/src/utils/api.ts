import type { Mood, Song } from '../types';

const BASE_URL = '/api';

export async function getMoods(): Promise<Mood[]> {
  const response = await fetch(`${BASE_URL}/moods`);
  if (!response.ok) {
    throw new Error(`Failed to fetch moods: ${response.status}`);
  }
  return response.json();
}

export async function predictMood(data: {
  text?: string;
  mood?: string;
}): Promise<{ emotion: string; confidence: number }> {
  const response = await fetch(`${BASE_URL}/predict-mood`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    throw new Error(`Failed to predict mood: ${response.status}`);
  }
  return response.json();
}

export async function getRecommendations(mood: string): Promise<Song[]> {
  const response = await fetch(`${BASE_URL}/recommend`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ mood }),
  });
  if (!response.ok) {
    throw new Error(`Failed to fetch recommendations: ${response.status}`);
  }
  return response.json();
}
