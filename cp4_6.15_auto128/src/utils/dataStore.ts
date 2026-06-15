import * as fs from 'fs';
import * as path from 'path';
import type { InspirationCard } from '../types';

let cachedCards: InspirationCard[] | null = null;
let lastModifiedTime = 0;

const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.join(DATA_DIR, 'cards.json');

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

export function updateCard(id: string, updater: (card: InspirationCard) => InspirationCard): InspirationCard | undefined {
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

function persistCards(cards: InspirationCard[]): void {
  ensureDataDirectory();
  const jsonData = JSON.stringify(cards, null, 2);
  fs.writeFileSync(DATA_FILE, jsonData, 'utf-8');
  cachedCards = [...cards];
  lastModifiedTime = Date.now();
}

export function clearCache(): void {
  cachedCards = null;
  lastModifiedTime = 0;
}
