import type { Artwork } from '@/types';

const STORAGE_KEY = 'mojihuanjing_artworks';
const MAX_STORAGE_BYTES = 5 * 1024 * 1024;

export function generateShareCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 10);
}

function getStorageSize(): number {
  let total = 0;
  for (let key in localStorage) {
    if (localStorage.hasOwnProperty(key)) {
      total += (localStorage[key].length + key.length) * 2;
    }
  }
  return total;
}

function evictOldIfNeeded(): void {
  while (getStorageSize() > MAX_STORAGE_BYTES) {
    const all = loadAllArtworks();
    if (all.length === 0) break;
    const oldest = all.reduce((prev, curr) => prev.createdAt < curr.createdAt ? prev : curr);
    removeArtwork(oldest.id);
  }
}

export function saveArtwork(artwork: Artwork): void {
  evictOldIfNeeded();
  const all = loadAllArtworks();
  all.unshift(artwork);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
  } catch {
    evictOldIfNeeded();
    const all2 = loadAllArtworks();
    all2.unshift(artwork);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all2));
  }
}

export function loadAllArtworks(): Artwork[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadArtworkByCode(code: string): Artwork | undefined {
  const all = loadAllArtworks();
  return all.find(a => a.shareCode.toUpperCase() === code.toUpperCase());
}

export function loadArtworkById(id: string): Artwork | undefined {
  const all = loadAllArtworks();
  return all.find(a => a.id === id);
}

export function removeArtwork(id: string): void {
  const all = loadAllArtworks().filter(a => a.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function clearAllArtworks(): void {
  localStorage.removeItem(STORAGE_KEY);
}
