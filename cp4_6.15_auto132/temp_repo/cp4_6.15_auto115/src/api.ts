import { MoodRecord } from './types';

export async function getMoods(userId: string): Promise<MoodRecord[]> {
  const res = await fetch(`/api/moods/${userId}`);
  if (!res.ok) throw new Error('Failed to fetch moods');
  return res.json();
}

export async function submitMood(record: Omit<MoodRecord, 'id'>): Promise<MoodRecord> {
  const res = await fetch('/api/moods', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(record),
  });
  if (!res.ok) throw new Error('Failed to submit mood');
  return res.json();
}

export async function getCommunity(): Promise<MoodRecord[]> {
  const res = await fetch('/api/community');
  if (!res.ok) throw new Error('Failed to fetch community');
  return res.json();
}
