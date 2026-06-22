import type { LeaderboardEntry } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'geo_quiz_leaderboard';

export const getEntries = (): LeaderboardEntry[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Failed to read leaderboard from localStorage', e);
  }
  return [];
};

export const addEntry = (
  score: number,
  streak: number,
  duration: number,
  countriesAnswered: string[]
): LeaderboardEntry => {
  const entry: LeaderboardEntry = {
    id: uuidv4(),
    score,
    streak,
    duration,
    timestamp: Date.now(),
    countriesAnswered,
  };

  const entries = getEntries();
  entries.push(entry);
  entries.sort((a, b) => b.score - a.score);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save leaderboard to localStorage', e);
  }

  return entry;
};

export const getTopTen = (): LeaderboardEntry[] => {
  const entries = getEntries();
  return entries.slice(0, 10);
};

export const clearAll = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear leaderboard from localStorage', e);
  }
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const getLatestEntryId = (): string | null => {
  const entries = getEntries();
  if (entries.length === 0) return null;
  return entries.reduce((latest, entry) =>
    entry.timestamp > latest.timestamp ? entry : latest
  ).id;
};
