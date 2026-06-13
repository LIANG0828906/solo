export enum ClothingCategory {
  TOP = '上衣',
  BOTTOM = '裤子',
  OUTERWEAR = '外套',
  SHOES = '鞋子',
  ACCESSORY = '配饰',
}

export enum Season {
  SPRING = '春',
  SUMMER = '夏',
  AUTUMN = '秋',
  WINTER = '冬',
}

export enum OutfitTag {
  HARMONIOUS = '色彩和谐',
  CONTRAST = '撞色对比',
  MONOTONE = '单色系',
  WARM = '暖色调',
  COOL = '冷色调',
}

export interface ClothingItem {
  id: string;
  name: string;
  category: ClothingCategory;
  color: string;
  imageUrl: string;
  season: Season;
  createdAt: string;
}

export interface Outfit {
  id: string;
  name: string;
  items: string[];
  tags: OutfitTag[];
  createdAt: string;
}

export interface DailyOutfit {
  date: string;
  outfitId: string;
}

export interface FilterCriteria {
  category: ClothingCategory | null;
  color: string | null;
  season: Season | null;
}

export const PRESET_COLORS = [
  '#1a1a2e', '#16213e', '#0f3460', '#533483',
  '#e94560', '#f38181', '#fce38a', '#eaffd0',
  '#95e1d3', '#aa96da', '#fcbad3', '#ffffd2',
  '#ffffff', '#c4c4c4', '#808080', '#2d2d2d',
  '#a0522d', '#d2691e', '#f4a460', '#ffe4b5',
  '#ff6b6b', '#ee5a24', '#f0932b', '#6ab04c',
  '#22a6b3', '#30336b', '#7ed6df', '#686de0',
  '#e056fd', '#be2edd', '#f9ca24', '#badc58',
];

export const CATEGORY_OPTIONS = Object.values(ClothingCategory);
export const SEASON_OPTIONS = Object.values(Season);

export function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return { h: 0, s: 0, l: 0 };

  let r = parseInt(result[1], 16) / 255;
  let g = parseInt(result[2], 16) / 255;
  let b = parseInt(result[3], 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;

  return { h: h * 360, s: s * 100, l: l * 100 };
}

export function analyzeColorHarmony(colors: string[]): OutfitTag[] {
  if (colors.length < 2) return [OutfitTag.MONOTONE];

  const hslColors = colors.map(hexToHsl);
  const hues = hslColors.map((c) => c.h);
  const tags: OutfitTag[] = [];

  let allHarmonious = true;
  let hasContrast = false;

  for (let i = 0; i < hues.length; i++) {
    for (let j = i + 1; j < hues.length; j++) {
      const diff = Math.abs(hues[i] - hues[j]);
      const normalizedDiff = Math.min(diff, 360 - diff);
      if (normalizedDiff > 60) allHarmonious = false;
      if (normalizedDiff > 150) hasContrast = true;
    }
  }

  if (allHarmonious) tags.push(OutfitTag.HARMONIOUS);
  if (hasContrast) tags.push(OutfitTag.CONTRAST);

  const isAllWarm = hslColors.every(
    (c) => c.h <= 60 || c.h >= 300
  );
  const isAllCool = hslColors.every(
    (c) => c.h >= 120 && c.h <= 240
  );

  if (isAllWarm) tags.push(OutfitTag.WARM);
  if (isAllCool) tags.push(OutfitTag.COOL);

  const maxHueDiff = Math.max(...hues) - Math.min(...hues);
  if (maxHueDiff < 30 || (360 - maxHueDiff) < 30) {
    tags.push(OutfitTag.MONOTONE);
  }

  if (tags.length === 0) tags.push(OutfitTag.HARMONIOUS);

  return tags;
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
