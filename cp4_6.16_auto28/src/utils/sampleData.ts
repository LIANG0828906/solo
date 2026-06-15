import { get, set } from 'idb-keyval';
import type { Palette } from '@/types';

const PALETTE_PREFIX = 'palette:';
const INIT_FLAG = 'sampleDataInitialized';

const samplePalettes: Omit<Palette, 'id' | 'createdAt'>[] = [
  {
    title: '极光之夜',
    colors: ['#0f0c29', '#302b63', '#24243e', '#1a1a2e', '#16213e'],
    favoriteCount: 42,
  },
  {
    title: '日落黄昏',
    colors: ['#ff512f', '#dd2476', '#ff6b6b', '#ffa502', '#ff7675'],
    favoriteCount: 38,
  },
  {
    title: '森林清晨',
    colors: ['#134e5e', '#71b280', '#2d5016', '#52b788', '#74c69d'],
    favoriteCount: 35,
  },
  {
    title: '深海蓝调',
    colors: ['#000428', '#004e92', '#1e3c72', '#2a5298', '#19547b'],
    favoriteCount: 28,
  },
  {
    title: '樱花粉色',
    colors: ['#ff9a9e', '#fecfef', '#fecfef', '#fdfbfb', '#ebedee'],
    favoriteCount: 45,
  },
  {
    title: '复古暖棕',
    colors: ['#c9a063', '#8b6914', '#d4af37', '#a67c00', '#bf9b30'],
    favoriteCount: 22,
  },
  {
    title: '赛博朋克',
    colors: ['#ff006e', '#8338ec', '#3a86ff', '#00f5d4', '#fb5607'],
    favoriteCount: 52,
  },
  {
    title: '莫兰迪色系',
    colors: ['#9a8c98', '#c9ada7', '#f2e9e4', '#4a4e69', '#22223b'],
    favoriteCount: 61,
  },
  {
    title: '热带风情',
    colors: ['#f72585', '#b5179e', '#7209b7', '#560bad', '#480ca8'],
    favoriteCount: 19,
  },
  {
    title: '雾霾蓝灰',
    colors: ['#6c757d', '#adb5bd', '#ced4da', '#dee2e6', '#e9ecef'],
    favoriteCount: 31,
  },
];

export async function initSampleData(): Promise<void> {
  const initialized = await get<boolean>(INIT_FLAG);
  if (initialized) return;

  for (let i = 0; i < samplePalettes.length; i++) {
    const palette = samplePalettes[i];
    const id = `sample-${i + 1}`;
    const existing = await get<Palette>(`${PALETTE_PREFIX}${id}`);

    if (!existing) {
      const newPalette: Palette = {
        id,
        title: palette.title,
        colors: palette.colors,
        createdAt: Date.now() - (samplePalettes.length - i) * 86400000,
        favoriteCount: palette.favoriteCount,
      };
      await set(`${PALETTE_PREFIX}${id}`, newPalette);
    }
  }

  await set(INIT_FLAG, true);
}
