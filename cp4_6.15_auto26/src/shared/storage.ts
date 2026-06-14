import { EmotionRecord } from './types';

const STORAGE_KEY = 'color-emotion-records';

export function getAllRecords(): EmotionRecord[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function getRecordsByDateRange(start: string, end: string): EmotionRecord[] {
  return getAllRecords().filter(r => r.date >= start && r.date <= end);
}

export function getRecordByDate(date: string): EmotionRecord | undefined {
  return getAllRecords().find(r => r.date === date);
}

export function saveRecord(record: EmotionRecord): void {
  const records = getAllRecords();
  const index = records.findIndex(r => r.date === record.date);
  if (index >= 0) {
    records[index] = record;
  } else {
    records.push(record);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function deleteRecord(id: string): void {
  const records = getAllRecords().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}
