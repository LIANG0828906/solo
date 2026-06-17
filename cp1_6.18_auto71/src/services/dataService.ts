import { v4 as uuidv4 } from 'uuid';
import { Capsule, CapsuleColor } from '../types';
import { STORAGE_KEY, API_DELAY, CAPSULE_COLORS, EMOJIS } from '../constants';

interface StorageData {
  capsules: Capsule[];
}

function readStorage(): StorageData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (_) {
    // ignore parse error
  }
  return { capsules: [] };
}

function writeStorage(data: StorageData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (_) {
    // ignore storage error
  }
}

function delay<T>(value: T, ms: number = API_DELAY): Promise<T> {
  return new Promise(resolve => setTimeout(() => resolve(value), ms));
}

function pickRandom<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateSampleData(): Capsule[] {
  const now = Date.now();
  const samples: Omit<Capsule, 'id'>[] = [
    {
      position: { x: 200, y: 250 },
      color: pickRandom(CAPSULE_COLORS) as CapsuleColor,
      emoji: pickRandom(EMOJIS),
      content: '愿未来的自己依然热爱生活，保持好奇心 🌊',
      createdAt: now - 86400000 * 3,
      openedAt: null,
      isOpened: false,
      isMine: false
    },
    {
      position: { x: 550, y: 180 },
      color: pickRandom(CAPSULE_COLORS) as CapsuleColor,
      emoji: pickRandom(EMOJIS),
      content: '给三年后的你：希望你已经实现了当年的小目标 ✨',
      createdAt: now - 86400000 * 7,
      openedAt: null,
      isOpened: false,
      isMine: false
    },
    {
      position: { x: 380, y: 420 },
      color: pickRandom(CAPSULE_COLORS) as CapsuleColor,
      emoji: pickRandom(EMOJIS),
      content: '陌生人，如果你看到这个，愿你今天也被温柔以待 💛',
      createdAt: now - 86400000 * 2,
      openedAt: null,
      isOpened: false,
      isMine: false
    },
    {
      position: { x: 120, y: 480 },
      color: pickRandom(CAPSULE_COLORS) as CapsuleColor,
      emoji: pickRandom(EMOJIS),
      content: '2025年夏天的风，我记住了。',
      createdAt: now - 86400000 * 10,
      openedAt: now - 3600000,
      isOpened: true,
      isMine: true
    },
    {
      position: { x: 650, y: 380 },
      color: pickRandom(CAPSULE_COLORS) as CapsuleColor,
      emoji: pickRandom(EMOJIS),
      content: '今天的夕阳特别美，想分享给未来的某个人。',
      createdAt: now - 86400000 * 5,
      openedAt: now - 7200000,
      isOpened: true,
      isMine: true
    }
  ];
  return samples.map(s => ({ ...s, id: uuidv4() }));
}

export async function fetchCapsules(): Promise<Capsule[]> {
  const data = readStorage();
  if (data.capsules.length === 0) {
    const samples = generateSampleData();
    writeStorage({ capsules: samples });
    return delay(samples);
  }
  return delay(data.capsules);
}

export async function addCapsule(capsule: Omit<Capsule, 'id' | 'createdAt' | 'openedAt' | 'isOpened'>): Promise<Capsule> {
  const data = readStorage();
  const newCapsule: Capsule = {
    ...capsule,
    id: uuidv4(),
    createdAt: Date.now(),
    openedAt: null,
    isOpened: false
  };
  data.capsules.push(newCapsule);
  writeStorage(data);
  return delay(newCapsule);
}

export async function updateCapsule(id: string, patch: Partial<Capsule>): Promise<Capsule | null> {
  const data = readStorage();
  const idx = data.capsules.findIndex(c => c.id === id);
  if (idx === -1) return delay(null);
  data.capsules[idx] = { ...data.capsules[idx], ...patch };
  writeStorage(data);
  return delay(data.capsules[idx]);
}

export async function openCapsule(id: string): Promise<Capsule | null> {
  const data = readStorage();
  const idx = data.capsules.findIndex(c => c.id === id);
  if (idx === -1) return delay(null);
  const capsule = data.capsules[idx];
  if (!capsule.isOpened) {
    capsule.isOpened = true;
    capsule.openedAt = Date.now();
    data.capsules[idx] = capsule;
    writeStorage(data);
  }
  return delay(capsule);
}
