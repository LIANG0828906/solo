import { EmotionRecord } from './types';
import { hslToHex, getEmotionByColor, calculateIntensity } from '@/color/emotionMap';

const STORAGE_KEY = 'color-emotion-records';
const SEED_KEY = 'color-emotion-seeded-v1';

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

export function saveRecordsBulk(newRecords: EmotionRecord[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(newRecords));
}

export function deleteRecord(id: string): void {
  const records = getAllRecords().filter(r => r.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export function seedDemoData(): EmotionRecord[] {
  const rand = seededRandom(42);
  const today = new Date();
  const records: EmotionRecord[] = [];

  const demoEmotions = [
    { hue: 50, sat: 80, note: '阳光明媚的一天' },
    { hue: 180, sat: 55, note: '工作很顺利，心情平静' },
    { hue: 340, sat: 70, note: '和朋友度过了浪漫的夜晚' },
    { hue: 120, sat: 60, note: '户外散步，充满希望' },
    { hue: 240, sat: 45, note: '有些忧郁，需要休息' },
    { hue: 280, sat: 65, note: '冥想中思考人生' },
    { hue: 20, sat: 85, note: '项目完成，充满热情' },
    { hue: 150, sat: 50, note: '听轻音乐，很放松' },
    { hue: 270, sat: 70, note: '读了一本好书' },
    { hue: 310, sat: 60, note: '收到了意外的礼物' },
    { hue: 90, sat: 70, note: '做了喜欢的运动' },
    { hue: 210, sat: 55, note: '专注编码的一天' },
    { hue: 0, sat: 75, note: '早上有点烦躁' },
    { hue: 160, sat: 45, note: '喝了一杯好茶' },
    { hue: 320, sat: 65, note: '和家人视频通话' },
    { hue: 40, sat: 80, note: '充满活力的早晨' },
    { hue: 200, sat: 40, note: '有些低沉但还好' },
    { hue: 100, sat: 55, note: '完成了一个小目标' },
  ];

  for (let i = 0; i < 25; i++) {
    const day = new Date(today);
    day.setDate(day.getDate() - rand() * 35);
    const date = formatDate(day);
    if (records.some(r => r.date === date)) continue;

    const emo = demoEmotions[Math.floor(rand() * demoEmotions.length)];
    const sat = Math.max(35, Math.min(90, emo.sat + (rand() - 0.5) * 25));
    const hue = (emo.hue + (rand() - 0.5) * 30 + 360) % 360;
    const color = hslToHex(hue, sat, 50);
    const emotion = getEmotionByColor(color);
    const intensity = calculateIntensity(color);

    const withNote = rand() > 0.25;

    records.push({
      id: generateId() + i,
      date,
      color,
      emotion: emotion.emotion,
      note: withNote ? emo.note : '',
      intensity,
    });
  }

  return records;
}

export function isSeeded(): boolean {
  return localStorage.getItem(SEED_KEY) === '1';
}

export function markSeeded(): void {
  localStorage.setItem(SEED_KEY, '1');
}

