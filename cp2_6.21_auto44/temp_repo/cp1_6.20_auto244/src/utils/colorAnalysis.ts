import tinycolor from 'tinycolor2';

export interface ColorItem {
  hex: string;
  rgb: { r: number; g: number; b: number };
  name?: string;
  count?: number;
}

export const rgbToHex = (r: number, g: number, b: number): string => {
  return tinycolor({ r, g, b }).toHexString();
};

export const hexToRgb = (hex: string): { r: number; g: number; b: number } | null => {
  const color = tinycolor(hex);
  if (!color.isValid()) return null;
  const rgb = color.toRgb();
  return { r: rgb.r, g: rgb.g, b: rgb.b };
};

export const getLuminance = (r: number, g: number, b: number): number => {
  const [rs, gs, bs] = [r, g, b].map(c => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
};

export const calculateContrast = (color1: string, color2: string): number => {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  if (!rgb1 || !rgb2) return 1;

  const l1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
  const l2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

export const calculateHueDifference = (color1: string, color2: string): number => {
  const h1 = tinycolor(color1).toHsv().h;
  const h2 = tinycolor(color2).toHsv().h;
  let diff = Math.abs(h1 - h2);
  if (diff > 180) diff = 360 - diff;
  return diff;
};

export const filterSimilarColors = (colors: ColorItem[], threshold: number = 10): ColorItem[] => {
  const filtered: ColorItem[] = [];

  for (const color of colors) {
    const isSimilar = filtered.some(existing => {
      const hueDiff = calculateHueDifference(color.hex, existing.hex);
      const sat1 = tinycolor(color.hex).toHsv().s;
      const sat2 = tinycolor(existing.hex).toHsv().s;
      const val1 = tinycolor(color.hex).toHsv().v;
      const val2 = tinycolor(existing.hex).toHsv().v;
      const satDiff = Math.abs(sat1 - sat2) * 100;
      const valDiff = Math.abs(val1 - val2) * 100;
      return hueDiff < threshold && satDiff < threshold && valDiff < threshold;
    });

    if (!isSimilar) {
      filtered.push(color);
    }
  }

  return filtered;
};

export const getContrastRating = (contrast: number): { level: string; pass: boolean }[] => {
  return [
    { level: 'AA Normal', pass: contrast >= 4.5 },
    { level: 'AA Large', pass: contrast >= 3 },
    { level: 'AAA Normal', pass: contrast >= 7 },
    { level: 'AAA Large', pass: contrast >= 4.5 },
  ];
};

export const getColorName = (hex: string): string => {
  const color = tinycolor(hex);
  const hsv = color.toHsv();
  const h = hsv.h;
  const s = hsv.s;
  const v = hsv.v;

  if (v < 0.1) return '黑色';
  if (s < 0.1 && v > 0.9) return '白色';
  if (s < 0.1) return '灰色';

  if (h >= 0 && h < 30) return v < 0.5 ? '深红' : s > 0.8 ? '红色' : '粉红';
  if (h >= 30 && h < 60) return s > 0.5 ? '橙色' : '棕色';
  if (h >= 60 && h < 90) return v > 0.8 ? '黄色' : '卡其色';
  if (h >= 90 && h < 150) return v < 0.5 ? '深绿' : s > 0.5 ? '绿色' : '浅绿';
  if (h >= 150 && h < 210) return s > 0.5 ? '青色' : '浅青';
  if (h >= 210 && h < 270) return v < 0.5 ? '深蓝' : s > 0.5 ? '蓝色' : '浅蓝';
  if (h >= 270 && h < 330) return s > 0.5 ? '紫色' : '淡紫';
  if (h >= 330 && h <= 360) return s > 0.5 ? '品红' : '粉红';

  return color.toName() || hex;
};
