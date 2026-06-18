import type { Palette, ColorSwatch } from './types';
import { generateId, isValidHex, normalizeHex } from './types';

const STORAGE_KEY = 'color-palette-manager:v1';

const delay = <T>(data: T, ms: number = 80): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

const readStorage = (): Palette[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return seedPalettes();
    const parsed = JSON.parse(raw) as Palette[];
    if (!Array.isArray(parsed)) return seedPalettes();
    return parsed;
  } catch {
    return seedPalettes();
  }
};

const writeStorage = (palettes: Palette[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(palettes));
};

const seedPalettes = (): Palette[] => {
  const now = Date.now();
  const samples: Omit<Palette, 'id' | 'createdAt' | 'updatedAt'>[] = [
    {
      name: '复古海报',
      colors: ['#E63946', '#F1FAEE', '#A8DADC', '#457B9D', '#1D3557'].map((hex, i) => ({
        id: generateId() + i,
        hex,
      })),
      tags: ['复古', '海报', '红蓝'],
      rating: 4,
    },
    {
      name: '柔和UI',
      colors: ['#FFADAD', '#FFD6A5', '#FDFFB6', '#CAFFBF', '#9BF6FF', '#A0C4FF'].map((hex, i) => ({
        id: generateId() + i,
        hex,
      })),
      tags: ['柔和', 'UI', '渐变'],
      rating: 5,
    },
    {
      name: '森林插画',
      colors: ['#2D5016', '#556B2F', '#8FBC8F', '#DDE5B6', '#A98467', '#6C584C'].map((hex, i) => ({
        id: generateId() + i,
        hex,
      })),
      tags: ['自然', '插画', '绿色'],
      rating: 3,
    },
    {
      name: '霓虹都市',
      colors: ['#0D0221', '#0F084B', '#3D138D', '#822FAC', '#FF3864', '#FFEBFC'].map((hex, i) => ({
        id: generateId() + i,
        hex,
      })),
      tags: ['赛博', 'UI', '霓虹'],
      rating: 5,
    },
    {
      name: '海岸日落',
      colors: ['#003049', '#D62828', '#F77F00', '#FCBF49', '#EAE2B7'].map((hex, i) => ({
        id: generateId() + i,
        hex,
      })),
      tags: ['自然', '海报', '暖色'],
      rating: 4,
    },
    {
      name: '莫兰迪灰',
      colors: ['#C9ADA7', '#9A8C98', '#4A4E69', '#22223B', '#F2E9E4'].map((hex, i) => ({
        id: generateId() + i,
        hex,
      })),
      tags: ['高级', 'UI', '灰色'],
      rating: 4,
    },
  ];
  return samples.map((s, idx) => ({
    ...s,
    id: `seed-${idx}-${generateId()}`,
    createdAt: now - idx * 86400000,
    updatedAt: now - idx * 86400000,
  }));
};

export const getAllPalettes = (): Promise<Palette[]> => delay(readStorage());

export const getPaletteById = (id: string): Promise<Palette | undefined> => {
  const list = readStorage();
  return delay(list.find((p) => p.id === id));
};

export const createPalette = (
  data: Partial<Omit<Palette, 'id' | 'createdAt' | 'updatedAt'>> = {}
): Promise<Palette> => {
  const list = readStorage();
  const now = Date.now();
  const newPalette: Palette = {
    id: generateId(),
    name: data.name || `新色板 ${list.length + 1}`,
    colors: data.colors ?? [],
    tags: data.tags ?? [],
    rating: data.rating ?? 0,
    createdAt: now,
    updatedAt: now,
  };
  list.unshift(newPalette);
  writeStorage(list);
  return delay(newPalette);
};

export const updatePalette = (
  id: string,
  patch: Partial<Omit<Palette, 'id' | 'createdAt'>>
): Promise<Palette | undefined> => {
  const list = readStorage();
  const idx = list.findIndex((p) => p.id === id);
  if (idx === -1) return delay(undefined);
  const updated: Palette = {
    ...list[idx],
    ...patch,
    updatedAt: Date.now(),
  };
  list[idx] = updated;
  writeStorage(list);
  return delay(updated);
};

export const deletePalette = (id: string): Promise<boolean> => {
  const list = readStorage();
  const next = list.filter((p) => p.id !== id);
  const changed = next.length !== list.length;
  if (changed) writeStorage(next);
  return delay(changed);
};

export const addColorToPalette = (
  paletteId: string,
  hex: string
): Promise<Palette | undefined> => {
  if (!isValidHex(hex)) return Promise.reject(new Error('无效的颜色值'));
  const normalized = normalizeHex(hex);
  return getPaletteById(paletteId).then((pal) => {
    if (!pal) return undefined;
    if (pal.colors.length >= 10) return pal;
    const newColor: ColorSwatch = { id: generateId(), hex: normalized };
    return updatePalette(paletteId, { colors: [...pal.colors, newColor] });
  });
};

export const removeColorFromPalette = (
  paletteId: string,
  colorId: string
): Promise<Palette | undefined> =>
  getPaletteById(paletteId).then((pal) => {
    if (!pal) return undefined;
    return updatePalette(paletteId, {
      colors: pal.colors.filter((c) => c.id !== colorId),
    });
  });

export const reorderColors = (
  paletteId: string,
  fromIndex: number,
  toIndex: number
): Promise<Palette | undefined> =>
  getPaletteById(paletteId).then((pal) => {
    if (!pal) return undefined;
    const colors = [...pal.colors];
    const [item] = colors.splice(fromIndex, 1);
    colors.splice(toIndex, 0, item);
    return updatePalette(paletteId, { colors });
  });

export const filterPalettes = (opts: {
  tags?: string[];
  minRating?: number;
  search?: string;
}): Promise<Palette[]> => {
  const list = readStorage();
  const { tags = [], minRating = 0, search = '' } = opts;
  const q = search.trim().toLowerCase();
  const filtered = list.filter((p) => {
    if (p.rating < minRating) return false;
    if (tags.length > 0 && !tags.every((t) => p.tags.includes(t))) return false;
    if (q && !p.name.toLowerCase().includes(q)) return false;
    return true;
  });
  return delay(filtered);
};

export const getAllTags = (): Promise<string[]> => {
  const list = readStorage();
  const set = new Set<string>();
  list.forEach((p) => p.tags.forEach((t) => set.add(t)));
  return delay(Array.from(set).sort());
};
