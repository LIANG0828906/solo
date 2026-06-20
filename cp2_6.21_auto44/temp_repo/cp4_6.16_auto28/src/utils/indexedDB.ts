import { get, set, keys, del } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Palette } from '@/types';

const PALETTE_PREFIX = 'palette:';
const FAVORITES_KEY = 'favorites';

export async function savePalette(palette: Omit<Palette, 'id' | 'createdAt' | 'favoriteCount'>): Promise<Palette> {
  const id = uuidv4();
  const newPalette: Palette = {
    id,
    title: palette.title,
    colors: palette.colors,
    createdAt: Date.now(),
    favoriteCount: 0,
  };
  await set(`${PALETTE_PREFIX}${id}`, newPalette);
  return newPalette;
}

export async function loadAllPalettes(): Promise<Palette[]> {
  const allKeys = await keys();
  const paletteKeys = allKeys.filter((key) =>
    typeof key === 'string' && key.startsWith(PALETTE_PREFIX)
  ) as string[];

  const palettes: Palette[] = [];
  for (const key of paletteKeys) {
    const palette = await get<Palette>(key);
    if (palette) {
      palettes.push(palette);
    }
  }
  return palettes;
}

export async function loadPaletteById(id: string): Promise<Palette | undefined> {
  return get<Palette>(`${PALETTE_PREFIX}${id}`);
}

export async function updatePaletteFavoriteCount(id: string, increment: boolean): Promise<void> {
  const palette = await loadPaletteById(id);
  if (palette) {
    palette.favoriteCount = Math.max(0, palette.favoriteCount + (increment ? 1 : -1));
    await set(`${PALETTE_PREFIX}${id}`, palette);
  }
}

export async function saveFavorites(favoriteIds: string[]): Promise<void> {
  await set(FAVORITES_KEY, favoriteIds);
}

export async function loadFavorites(): Promise<string[]> {
  const favorites = await get<string[]>(FAVORITES_KEY);
  return favorites || [];
}

export async function deletePalette(id: string): Promise<void> {
  await del(`${PALETTE_PREFIX}${id}`);
}
