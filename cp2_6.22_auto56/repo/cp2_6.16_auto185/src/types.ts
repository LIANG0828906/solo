export interface ColorHSL {
  h: number;
  s: number;
  l: number;
}

export type ColorHEX = string;

export interface ColorCard {
  id: string;
  hex: ColorHEX;
  hsl: ColorHSL;
  label: string;
}

export interface ColorSchemeGroup {
  id: string;
  name: string;
  description: string;
  colors: ColorCard[];
}

export interface PreviewState {
  updateKey: number;
}

export const hslToHex = (h: number, s: number, l: number): ColorHEX => {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const toHex = (x: number) => {
    const hex = Math.round(255 * x).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
};

export const hexToHsl = (hex: ColorHEX): ColorHSL => {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
        break;
      case g:
        h = ((b - r) / d + 2) * 60;
        break;
      case b:
        h = ((r - g) / d + 4) * 60;
        break;
    }
  }

  return {
    h: Math.round(h),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
};

export const hslToString = (hsl: ColorHSL): string => {
  return `hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
};

export const generateMonochromatic = (baseHsl: ColorHSL): ColorCard[] => {
  const colors: ColorCard[] = [];
  const steps = [15, 30, 50, 70, 85];
  steps.forEach((l, i) => {
    const hsl = { h: baseHsl.h, s: baseHsl.s, l };
    colors.push({
      id: `mono-${i}`,
      hex: hslToHex(hsl.h, hsl.s, hsl.l),
      hsl,
      label: `M${i + 1}`,
    });
  });
  return colors;
};

export const generateAnalogous = (baseHsl: ColorHSL): ColorCard[] => {
  const offsets = [-30, -15, 0, 15, 30];
  return offsets.map((offset, i) => {
    const h = (baseHsl.h + offset + 360) % 360;
    const hsl = { h, s: baseHsl.s, l: baseHsl.l };
    return {
      id: `analogous-${i}`,
      hex: hslToHex(hsl.h, hsl.s, hsl.l),
      hsl,
      label: `A${i + 1}`,
    };
  });
};

export const generateComplementary = (baseHsl: ColorHSL): ColorCard[] => {
  const colors: ColorCard[] = [];
  const baseHsl2 = { h: baseHsl.h, s: baseHsl.s, l: baseHsl.l };
  const compH = (baseHsl.h + 180) % 360;
  const compHsl = { h: compH, s: baseHsl.s, l: baseHsl.l };

  colors.push({
    id: 'comp-0',
    hex: hslToHex(baseHsl2.h, baseHsl2.s, baseHsl2.l - 15),
    hsl: { ...baseHsl2, l: baseHsl2.l - 15 },
    label: 'C1',
  });
  colors.push({
    id: 'comp-1',
    hex: hslToHex(baseHsl2.h, baseHsl2.s, baseHsl2.l),
    hsl: baseHsl2,
    label: 'C2',
  });
  colors.push({
    id: 'comp-2',
    hex: hslToHex(compHsl.h, compHsl.s, compHsl.l),
    hsl: compHsl,
    label: 'C3',
  });
  colors.push({
    id: 'comp-3',
    hex: hslToHex(compHsl.h, compHsl.s, compHsl.l + 15),
    hsl: { ...compHsl, l: compHsl.l + 15 },
    label: 'C4',
  });
  colors.push({
    id: 'comp-4',
    hex: hslToHex(compHsl.h, compHsl.s - 20, compHsl.l + 30),
    hsl: { ...compHsl, s: compHsl.s - 20, l: compHsl.l + 30 },
    label: 'C5',
  });
  return colors;
};

export const generateSplitComplementary = (baseHsl: ColorHSL): ColorCard[] => {
  const offsets = [0, 150, 165, 195, 210];
  return offsets.map((offset, i) => {
    const h = (baseHsl.h + offset) % 360;
    const hsl = { h, s: baseHsl.s, l: baseHsl.l };
    return {
      id: `split-${i}`,
      hex: hslToHex(hsl.h, hsl.s, hsl.l),
      hsl,
      label: `S${i + 1}`,
    };
  });
};

export const generateTriadic = (baseHsl: ColorHSL): ColorCard[] => {
  const offsets = [0, 120, 240];
  const colors: ColorCard[] = [];
  offsets.forEach((offset, i) => {
    const h = (baseHsl.h + offset) % 360;
    const hsl = { h, s: baseHsl.s, l: baseHsl.l };
    colors.push({
      id: `triad-${i * 2}`,
      hex: hslToHex(hsl.h, hsl.s, hsl.l - 10),
      hsl: { ...hsl, l: hsl.l - 10 },
      label: `T${i * 2 + 1}`,
    });
    colors.push({
      id: `triad-${i * 2 + 1}`,
      hex: hslToHex(hsl.h, hsl.s, hsl.l),
      hsl,
      label: `T${i * 2 + 2}`,
    });
  });
  return colors.slice(0, 5);
};

export const getTextColor = (hex: ColorHEX): ColorHEX => {
  const hsl = hexToHsl(hex);
  return hsl.l > 60 ? '#1A1A2E' : '#E8E8F0';
};

export const HUE_MARKS = [
  { name: '红', hex: '#FF0000', h: 0 },
  { name: '橙', hex: '#FF7F00', h: 30 },
  { name: '黄橙', hex: '#FFBF00', h: 45 },
  { name: '黄', hex: '#FFFF00', h: 60 },
  { name: '黄绿', hex: '#7FFF00', h: 90 },
  { name: '绿', hex: '#00FF00', h: 120 },
  { name: '青绿', hex: '#00FF7F', h: 150 },
  { name: '青', hex: '#00FFFF', h: 180 },
  { name: '青蓝', hex: '#007FFF', h: 210 },
  { name: '蓝', hex: '#0000FF', h: 240 },
  { name: '蓝紫', hex: '#7F00FF', h: 270 },
  { name: '紫', hex: '#FF00FF', h: 300 },
];
