import { v4 as uuidv4 } from 'uuid';
import type { Bottle, Continuation } from '../types';

const MOCK_BOTTLES: Bottle[] = [
  {
    id: uuidv4(),
    content: '今天在海边看到日落，橙色的天空倒映在海面上，像打翻了的调色盘。有时候灵感就是这样不期而遇。',
    images: [],
    continuations: [],
    createdAt: Date.now() - 86400000,
    viewedBy: []
  },
  {
    id: uuidv4(),
    content: '在地铁上突然想到：如果每个人都是一本书，那擦肩而过的人们只是彼此的匆匆读者。',
    images: [],
    continuations: [
      {
        id: uuidv4(),
        content: '愿我们都能被温柔地翻阅。',
        createdAt: Date.now() - 3600000
      }
    ],
    createdAt: Date.now() - 172800000,
    viewedBy: []
  },
  {
    id: uuidv4(),
    content: '深夜的咖啡馆，一杯热拿铁，窗外下着小雨。这是写代码最好的时刻。',
    images: [],
    continuations: [],
    createdAt: Date.now() - 259200000,
    viewedBy: []
  }
];

let bottles: Bottle[] = [...MOCK_BOTTLES];

const delay = (ms: number): Promise<void> =>
  new Promise(resolve => setTimeout(resolve, ms));

export async function getRandomBottle(excludeIds: string[]): Promise<Bottle | null> {
  await delay(100);
  const available = bottles.filter(b => !excludeIds.includes(b.id));
  if (available.length === 0) return null;
  const idx = Math.floor(Math.random() * available.length);
  return available[idx];
}

export async function createBottle(content: string, images: string[]): Promise<Bottle> {
  await delay(100);
  const bottle: Bottle = {
    id: uuidv4(),
    content,
    images,
    continuations: [],
    createdAt: Date.now(),
    viewedBy: []
  };
  bottles.unshift(bottle);
  return bottle;
}

export async function addContinuation(bottleId: string, content: string): Promise<Bottle | null> {
  await delay(100);
  const idx = bottles.findIndex(b => b.id === bottleId);
  if (idx === -1) return null;
  const continuation: Continuation = {
    id: uuidv4(),
    content,
    createdAt: Date.now()
  };
  bottles[idx] = {
    ...bottles[idx],
    continuations: [...bottles[idx].continuations, continuation]
  };
  return bottles[idx];
}
