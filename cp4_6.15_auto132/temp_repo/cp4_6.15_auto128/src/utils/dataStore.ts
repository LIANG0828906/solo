import * as fs from 'fs';
import * as path from 'path';
import type { InspirationCard } from '../types';

let cachedCards: InspirationCard[] | null = null;
let lastModifiedTime = 0;

const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'cards.json');

type WriteTask = {
  cards: InspirationCard[];
  resolve: () => void;
  reject: (err: Error) => void;
};

let writeQueue: WriteTask[] = [];
let isWriting = false;

function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([], null, 2), 'utf-8');
  }
}

function refreshCacheIfNeeded(): void {
  ensureDataDirectory();

  if (isWriting || writeQueue.length > 0) {
    return;
  }

  const stats = fs.statSync(DATA_FILE);
  const mtime = stats.mtime.getTime();

  if (cachedCards === null || mtime > lastModifiedTime) {
    const rawData = fs.readFileSync(DATA_FILE, 'utf-8');
    cachedCards = JSON.parse(rawData) as InspirationCard[];
    lastModifiedTime = mtime;
  }
}

export function getAllCards(): InspirationCard[] {
  refreshCacheIfNeeded();
  return cachedCards ? [...cachedCards] : [];
}

export function getCardById(id: string): InspirationCard | undefined {
  const cards = getAllCards();
  return cards.find((card) => card.id === id);
}

export function addCard(card: InspirationCard): void {
  const cards = getAllCards();
  cards.unshift(card);
  persistCards(cards);
}

export function updateCard(
  id: string,
  updater: (card: InspirationCard) => InspirationCard
): InspirationCard | undefined {
  const cards = getAllCards();
  const index = cards.findIndex((card) => card.id === id);
  if (index === -1) return undefined;

  cards[index] = updater(cards[index]);
  persistCards(cards);
  return cards[index];
}

export function deleteCard(id: string): boolean {
  const cards = getAllCards();
  const index = cards.findIndex((card) => card.id === id);
  if (index === -1) return false;

  cards.splice(index, 1);
  persistCards(cards);
  return true;
}

function processWriteQueue(): void {
  if (isWriting || writeQueue.length === 0) return;

  isWriting = true;
  const task = writeQueue.shift()!;

  try {
    ensureDataDirectory();
    const jsonData = JSON.stringify(task.cards, null, 2);
    fs.writeFileSync(DATA_FILE, jsonData, 'utf-8');

    if (writeQueue.length === 0) {
      cachedCards = [...task.cards];
      lastModifiedTime = Date.now();
    }
    task.resolve();
  } catch (err) {
    task.reject(err instanceof Error ? err : new Error(String(err)));
  } finally {
    isWriting = false;
    setImmediate(processWriteQueue);
  }
}

function persistCards(cards: InspirationCard[]): void {
  if (writeQueue.length > 0) {
    const lastTask = writeQueue[writeQueue.length - 1];
    lastTask.cards = cards;
    return;
  }

  writeQueue.push({
    cards,
    resolve: () => {},
    reject: (err) => {
      console.error('[dataStore] 写入失败:', err);
    },
  });
  processWriteQueue();
}

export function clearCache(): void {
  cachedCards = null;
  lastModifiedTime = 0;
}

export function getCacheStats(): {
  cachedCount: number;
  lastModified: number;
  pendingWrites: number;
  isWriting: boolean;
} {
  return {
    cachedCount: cachedCards?.length ?? 0,
    lastModified: lastModifiedTime,
    pendingWrites: writeQueue.length,
    isWriting,
  };
}
