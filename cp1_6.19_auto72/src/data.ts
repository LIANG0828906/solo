import { MoodLevel, MoodRecord, getMoodConfig } from './types';

const STORAGE_KEY = 'mood_weather_records';
let recordsCache: MoodRecord[] | null = null;

function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function loadRecords(): MoodRecord[] {
  if (recordsCache) return recordsCache;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      recordsCache = JSON.parse(raw);
      return recordsCache || [];
    }
  } catch (_e) {
    // ignore
  }
  recordsCache = generateMockRecords();
  saveRecords(recordsCache);
  return recordsCache;
}

function saveRecords(records: MoodRecord[]): void {
  recordsCache = records;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

function generateMockRecords(): MoodRecord[] {
  const records: MoodRecord[] = [];
  const today = new Date();
  for (let i = 0; i < 60; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = formatDate(d);
    const rand = Math.random();
    let level: MoodLevel;
    if (rand < 0.25) level = MoodLevel.Sunny;
    else if (rand < 0.5) level = MoodLevel.Cloudy;
    else if (rand < 0.65) level = MoodLevel.Overcast;
    else if (rand < 0.8) level = MoodLevel.LightRain;
    else if (rand < 0.92) level = MoodLevel.HeavyRain;
    else level = MoodLevel.Thunderstorm;
    const cfg = getMoodConfig(level);
    records.push({
      date: dateStr,
      level,
      text: cfg.autoText,
      createdAt: d.getTime(),
    });
  }
  return records;
}

export function getRecordByDate(date: Date | string): MoodRecord | undefined {
  const records = loadRecords();
  const dateStr = typeof date === 'string' ? date : formatDate(date);
  return records.find((r) => r.date === dateStr);
}

export function getRecordsByMonth(year: number, month: number): MoodRecord[] {
  const records = loadRecords();
  const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  return records.filter((r) => r.date.startsWith(prefix));
}

export function getRecordsByDateRange(start: Date, end: Date): MoodRecord[] {
  const records = loadRecords();
  const startStr = formatDate(start);
  const endStr = formatDate(end);
  return records.filter((r) => r.date >= startStr && r.date <= endStr);
}

export function upsertRecord(date: Date | string, level: MoodLevel, text?: string): MoodRecord {
  const records = loadRecords();
  const dateStr = typeof date === 'string' ? date : formatDate(date);
  const cfg = getMoodConfig(level);
  const existingIndex = records.findIndex((r) => r.date === dateStr);
  const record: MoodRecord = {
    date: dateStr,
    level,
    text: text ?? cfg.autoText,
    createdAt: existingIndex >= 0 ? records[existingIndex].createdAt : Date.now(),
  };
  if (existingIndex >= 0) {
    records[existingIndex] = record;
  } else {
    records.push(record);
  }
  saveRecords(records);
  return record;
}

export function deleteRecord(date: Date | string): boolean {
  const records = loadRecords();
  const dateStr = typeof date === 'string' ? date : formatDate(date);
  const idx = records.findIndex((r) => r.date === dateStr);
  if (idx >= 0) {
    records.splice(idx, 1);
    saveRecords(records);
    return true;
  }
  return false;
}

export function getAllRecords(): MoodRecord[] {
  return loadRecords();
}

export function formatDateKey(date: Date): string {
  return formatDate(date);
}
