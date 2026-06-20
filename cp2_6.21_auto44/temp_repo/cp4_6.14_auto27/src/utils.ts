export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

export interface DerivedColor {
  name: string;
  value: string;
  rgb: string;
}

const clamp = (value: number, min: number, max: number): number => {
  return Math.min(Math.max(value, min), max);
};

export const hexToRgb = (hex: string): RGB => {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(h);
  if (!result) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  };
};

export const rgbToHex = (rgb: RGB): string => {
  const toHex = (n: number) => {
    const hex = clamp(Math.round(n), 0, 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return '#' + toHex(rgb.r) + toHex(rgb.g) + toHex(rgb.b);
};

export const rgbToHsl = (rgb: RGB): HSL => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

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
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      case b:
        h = ((r - g) / d + 4) / 6;
        break;
    }
  }

  return {
    h: h * 360,
    s: s * 100,
    l: l * 100,
  };
};

export const hslToRgb = (hsl: HSL): RGB => {
  const h = hsl.h / 360;
  const s = hsl.s / 100;
  const l = hsl.l / 100;

  if (s === 0) {
    const v = l * 255;
    return { r: v, g: v, b: v };
  }

  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return {
    r: hue2rgb(p, q, h + 1 / 3) * 255,
    g: hue2rgb(p, q, h) * 255,
    b: hue2rgb(p, q, h - 1 / 3) * 255,
  };
};

export const hexToHsl = (hex: string): HSL => {
  return rgbToHsl(hexToRgb(hex));
};

export const hslToHex = (hsl: HSL): string => {
  return rgbToHex(hslToRgb(hsl));
};

export const rgbToString = (rgb: RGB): string => {
  return `rgb(${Math.round(rgb.r)}, ${Math.round(rgb.g)}, ${Math.round(rgb.b)})`;
};

export const hexToRgbString = (hex: string): string => {
  return rgbToString(hexToRgb(hex));
};

const adjustColor = (
  hex: string,
  hDelta: number,
  sDelta: number,
  lDelta: number
): string => {
  const hsl = hexToHsl(hex);
  const newHsl: HSL = {
    h: ((hsl.h + hDelta) % 360 + 360) % 360,
    s: clamp(hsl.s + sDelta, 0, 100),
    l: clamp(hsl.l + lDelta, 0, 100),
  };
  return hslToHex(newHsl);
};

export const generateDerivedColors = (
  colors: ThemeColors
): DerivedColor[] => {
  const derived: DerivedColor[] = [];

  const primaryHover = adjustColor(colors.primary, 0, 0, 15);
  derived.push({
    name: 'primary-hover',
    value: primaryHover,
    rgb: hexToRgbString(primaryHover),
  });

  const primaryActive = adjustColor(colors.primary, 0, 0, -15);
  derived.push({
    name: 'primary-active',
    value: primaryActive,
    rgb: hexToRgbString(primaryActive),
  });

  const borderColor = adjustColor(colors.secondary, 0, -15, 10);
  derived.push({
    name: 'border',
    value: borderColor,
    rgb: hexToRgbString(borderColor),
  });

  const selectedColor = adjustColor(colors.primary, 10, 15, 5);
  derived.push({
    name: 'selected',
    value: selectedColor,
    rgb: hexToRgbString(selectedColor),
  });

  const disabledColor = adjustColor(colors.secondary, 0, -15, -5);
  derived.push({
    name: 'disabled',
    value: disabledColor,
    rgb: hexToRgbString(disabledColor),
  });

  const shadowColor = adjustColor(colors.background, -10, 5, -10);
  derived.push({
    name: 'shadow',
    value: shadowColor,
    rgb: hexToRgbString(shadowColor),
  });

  const accentColor = adjustColor(colors.secondary, -10, 15, 10);
  derived.push({
    name: 'accent',
    value: accentColor,
    rgb: hexToRgbString(accentColor),
  });

  const textSecondary = adjustColor(colors.text, 0, -20, 20);
  derived.push({
    name: 'text-secondary',
    value: textSecondary,
    rgb: hexToRgbString(textSecondary),
  });

  const backgroundLight = adjustColor(colors.background, 0, 5, 12);
  derived.push({
    name: 'background-light',
    value: backgroundLight,
    rgb: hexToRgbString(backgroundLight),
  });

  return derived;
};

export const generateCssVariables = (
  colors: ThemeColors,
  derivedColors: DerivedColor[]
): string => {
  let css = ':root {\n';
  css += `  --primary: ${colors.primary};\n`;
  css += `  --secondary: ${colors.secondary};\n`;
  css += `  --background: ${colors.background};\n`;
  css += `  --text: ${colors.text};\n`;

  for (const d of derivedColors) {
    css += `  --${d.name}: ${d.value};\n`;
  }

  css += '}\n\n';

  css += '/* 组件样式示例 */\n';
  css += '.btn-primary {\n';
  css += '  background-color: var(--primary);\n';
  css += '  color: var(--text);\n';
  css += '  padding: 8px 16px;\n';
  css += '  border: none;\n';
  css += '  border-radius: 6px;\n';
  css += '  cursor: pointer;\n';
  css += '  transition: background-color 0.2s ease;\n';
  css += '}\n\n';
  css += '.btn-primary:hover {\n';
  css += '  background-color: var(--primary-hover);\n';
  css += '}\n\n';
  css += '.btn-primary:active {\n';
  css += '  background-color: var(--primary-active);\n';
  css += '}\n\n';
  css += '.card {\n';
  css += '  background-color: var(--background);\n';
  css += '  border: 1px solid var(--border);\n';
  css += '  border-radius: 8px;\n';
  css += '  padding: 16px;\n';
  css += '  box-shadow: 0 2px 8px var(--shadow);\n';
  css += '}\n\n';
  css += '.input-field {\n';
  css += '  background-color: var(--background-light);\n';
  css += '  border: 1px solid var(--border);\n';
  css += '  color: var(--text);\n';
  css += '  padding: 8px 12px;\n';
  css += '  border-radius: 6px;\n';
  css += '}\n';

  return css;
};
