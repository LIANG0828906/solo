import type { SprintData, StandupEntry } from '../types';

const SPRINT_DATA_KEY = 'sprintData';
const STANDUP_LOG_KEY = 'standupLog';

export function getSprintData(): SprintData {
  try {
    const data = localStorage.getItem(SPRINT_DATA_KEY);
    if (data) {
      return JSON.parse(data) as SprintData;
    }
  } catch (e) {
    console.error('Failed to load sprint data from localStorage', e);
  }
  return { sprints: [], activeSprintId: null };
}

export function setSprintData(data: SprintData): void {
  try {
    localStorage.setItem(SPRINT_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save sprint data to localStorage', e);
  }
}

export function getStandupLog(): StandupEntry[] {
  try {
    const data = localStorage.getItem(STANDUP_LOG_KEY);
    if (data) {
      return JSON.parse(data) as StandupEntry[];
    }
  } catch (e) {
    console.error('Failed to load standup log from localStorage', e);
  }
  return [];
}

export function setStandupLog(entries: StandupEntry[]): void {
  try {
    localStorage.setItem(STANDUP_LOG_KEY, JSON.stringify(entries));
  } catch (e) {
    console.error('Failed to save standup log to localStorage', e);
  }
}

export function appendStandupEntry(entry: StandupEntry): void {
  const entries = getStandupLog();
  const existingIndex = entries.findIndex((e) => e.date === entry.date);
  if (existingIndex >= 0) {
    entries[existingIndex] = entry;
  } else {
    entries.push(entry);
  }
  setStandupLog(entries);
}
