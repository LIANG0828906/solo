import type { MoodSnapshot } from './calendar';

const STORAGE_KEY = 'pixel-mood-log';

export function saveSnapshots(snapshots: Record<string, MoodSnapshot[]>): void {
  try {
    const json = JSON.stringify(snapshots);
    localStorage.setItem(STORAGE_KEY, json);
  } catch (e) {
    console.error('Failed to save snapshots:', e);
  }
}

export function loadSnapshots(): Record<string, MoodSnapshot[]> | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as Record<string, MoodSnapshot[]>;
  } catch (e) {
    console.error('Failed to load snapshots:', e);
    return null;
  }
}
