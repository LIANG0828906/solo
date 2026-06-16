import { v4 as uuidv4 } from 'uuid';
import type { Plot, GrowthPoint } from './types';

const RANDOM_USER_NAMES = [
  '小南瓜', '番茄君', '青青草', '菜园达人', '阳光农夫',
  '菜菜子', '田园诗人', '种子守望者', '蜜蜂先生', '泥土香',
  '绿萝萝', '麦穗儿', '豆芽菜', '葫芦娃', '樱桃小园丁'
];

const RANDOM_AVATARS = ['🌱', '🌿', '🍀', '🌾', '🌻', '🌵', '🌴', '🎋', '🪴', '🌳'];

const CROP_POOL = [
  '番茄', '黄瓜', '生菜', '茄子', '辣椒',
  '豆角', '南瓜', '玉米', '土豆', '胡萝卜',
  '菠菜', '芹菜', '白菜', '草莓', '西瓜'
];

export function generateRandomUserName(): { name: string; avatar: string } {
  const name = RANDOM_USER_NAMES[Math.floor(Math.random() * RANDOM_USER_NAMES.length)];
  const avatar = RANDOM_AVATARS[Math.floor(Math.random() * RANDOM_AVATARS.length)];
  return { name, avatar };
}

export function randomCropName(): string {
  return CROP_POOL[Math.floor(Math.random() * CROP_POOL.length)];
}

export function createInitialPlots(rows = 6, cols = 6): Plot[] {
  const plots: Plot[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      plots.push({
        id: `plot-${r}-${c}`,
        row: r,
        col: c,
        status: 'idle',
        waterRecords: [],
        journal: [],
        exchangeable: false
      });
    }
  }
  return plots;
}

export function formatDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function daysBetween(dateStr: string): number {
  const target = new Date(dateStr).getTime();
  const now = Date.now();
  return Math.max(0, Math.floor((now - target) / (1000 * 60 * 60 * 24)));
}

export function generateGrowthData(days = 7, base = 5, variance = 4): GrowthPoint[] {
  const result: GrowthPoint[] = [];
  const today = new Date();
  let height = base + Math.random() * variance;
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const label = `${d.getMonth() + 1}/${d.getDate()}`;
    height = Math.max(1, height + (Math.random() - 0.2) * variance * 0.6);
    result.push({ dayLabel: label, height: Number(height.toFixed(1)) });
  }
  return result;
}

export function uid(): string {
  return uuidv4();
}
