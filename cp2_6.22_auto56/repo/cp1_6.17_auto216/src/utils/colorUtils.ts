export interface RGB {
  r: number;
  g: number;
  b: number;
}

export interface HSV {
  h: number;
  s: number;
  v: number;
}

export interface HSL {
  h: number;
  s: number;
  l: number;
}

export const hexToRgb = (hex: string): RGB => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
};

export const rgbToHex = (rgb: RGB): string => {
  const toHex = (n: number) => {
    const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`.toUpperCase();
};

export const rgbToHsv = (rgb: RGB): HSV => {
  const r = rgb.r / 255;
  const g = rgb.g / 255;
  const b = rgb.b / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s, v };
};

export const hsvToRgb = (hsv: HSV): RGB => {
  const h = hsv.h / 360;
  const s = hsv.s;
  const v = hsv.v;

  let r = 0,
    g = 0,
    b = 0;

  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      r = v;
      g = t;
      b = p;
      break;
    case 1:
      r = q;
      g = v;
      b = p;
      break;
    case 2:
      r = p;
      g = v;
      b = t;
      break;
    case 3:
      r = p;
      g = q;
      b = v;
      break;
    case 4:
      r = t;
      g = p;
      b = v;
      break;
    case 5:
      r = v;
      g = p;
      b = q;
      break;
  }

  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
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

  return { h: h * 360, s, l };
};

export const getContrastRatio = (hex1: string, hex2: string): number => {
  const rgb1 = hexToRgb(hex1);
  const rgb2 = hexToRgb(hex2);

  const getLuminance = (rgb: RGB) => {
    const [r, g, b] = [rgb.r, rgb.g, rgb.b].map((c) => {
      const s = c / 255;
      return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };

  const l1 = getLuminance(rgb1);
  const l2 = getLuminance(rgb2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
};

export const getComplementaryColor = (hex: string): string => {
  const hsv = rgbToHsv(hexToRgb(hex));
  hsv.h = (hsv.h + 180) % 360;
  return rgbToHex(hsvToRgb(hsv));
};

export const getWarmCoolIndex = (hex: string): number => {
  const hsl = rgbToHsl(hexToRgb(hex));
  const h = hsl.h;
  
  if (h >= 0 && h < 60) return 1 - h / 120;
  if (h >= 60 && h < 180) return 0.5 - (h - 60) / 240;
  if (h >= 180 && h < 300) return -(h - 180) / 240;
  return -1 + (h - 300) / 120;
};

export const getTemperatureLabel = (index: number): string => {
  if (index > 0.3) return '暖色调';
  if (index < -0.3) return '冷色调';
  return '中性调';
};

export const getVitalityIndex = (hex: string): number => {
  const hsl = rgbToHsl(hexToRgb(hex));
  return hsl.s * (1 - Math.abs(hsl.l - 0.5) * 2);
};

export const analyzeColorPalette = (
  colors: string[]
): {
  primary: string;
  secondary: string;
  hueAngle: number;
  warmCoolIndex: number;
  emotionTag: string;
} => {
  if (colors.length === 0) {
    return {
      primary: '#6366F1',
      secondary: '#EC4899',
      hueAngle: 0,
      warmCoolIndex: 0,
      emotionTag: '请添加颜色',
    };
  }

  const primary = colors[0];
  const secondary = colors.length > 1 ? colors[1] : getComplementaryColor(primary);

  const primaryHsv = rgbToHsv(hexToRgb(primary));
  const secondaryHsv = rgbToHsv(hexToRgb(secondary));
  const hueAngle = Math.abs(primaryHsv.h - secondaryHsv.h);

  const avgWarmCool =
    colors.reduce((sum, c) => sum + getWarmCoolIndex(c), 0) / colors.length;
  const avgVitality =
    colors.reduce((sum, c) => sum + getVitalityIndex(c), 0) / colors.length;

  let emotionTag = '';
  if (avgWarmCool > 0.2 && avgVitality > 0.5) {
    emotionTag = '活力热情风';
  } else if (avgWarmCool > 0.2 && avgVitality <= 0.5) {
    emotionTag = '温暖舒适感';
  } else if (avgWarmCool < -0.2 && avgVitality > 0.5) {
    emotionTag = '活力科技感';
  } else if (avgWarmCool < -0.2 && avgVitality <= 0.5) {
    emotionTag = '沉稳自然风';
  } else if (avgVitality > 0.6) {
    emotionTag = '清新活力感';
  } else if (hueAngle < 30 || hueAngle > 330) {
    emotionTag = '和谐统一感';
  } else if (hueAngle > 150 && hueAngle < 210) {
    emotionTag = '对比强烈感';
  } else {
    emotionTag = '平衡优雅风';
  }

  return {
    primary,
    secondary,
    hueAngle: Math.round(hueAngle),
    warmCoolIndex: Math.round(avgWarmCool * 100) / 100,
    emotionTag,
  };
};
