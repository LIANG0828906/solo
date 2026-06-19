export interface FontPair {
  id: string;
  titleFont: string;
  bodyFont: string;
}

const warmFontPairs: Omit<FontPair, 'id'>[] = [
  { titleFont: 'Playfair Display', bodyFont: 'Lora' },
  { titleFont: 'Merriweather', bodyFont: 'Open Sans' },
  { titleFont: 'Lora', bodyFont: 'Roboto' }
];

const coolFontPairs: Omit<FontPair, 'id'>[] = [
  { titleFont: 'Roboto', bodyFont: 'Open Sans' },
  { titleFont: 'Playfair Display', bodyFont: 'Roboto' },
  { titleFont: 'Open Sans', bodyFont: 'Merriweather' }
];

const fontFamilies: Record<string, string> = {
  'Playfair Display': "'Playfair Display', serif",
  'Lora': "'Lora', serif",
  'Roboto': "'Roboto', sans-serif",
  'Open Sans': "'Open Sans', sans-serif",
  'Merriweather': "'Merriweather', serif"
};

export function getFontFamily(fontName: string): string {
  return fontFamilies[fontName] || 'sans-serif';
}

export function getRecommendedFontPairs(isWarm: boolean): FontPair[] {
  const pairs = isWarm ? warmFontPairs : coolFontPairs;
  return pairs.map(pair => ({
    ...pair,
    id: Math.random().toString(36).substring(2, 9)
  }));
}

export const sampleText = `这是一部关于时间与记忆的小说，讲述了一位老摄影师在整理旧照片时，重新发现了被遗忘的青春岁月与深藏心底的秘密。`;

export const layoutTitles = [
  '《追光者的旅程》',
  '《时光深处》',
  '《静谧的回响》'
];

export const layoutAuthors = [
  '作者：林晚星',
  '作者：陈默之',
  '作者：苏清然'
];
