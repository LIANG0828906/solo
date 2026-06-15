import { ColorScheme } from '@/types/pattern';

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  return rgbToHex(lerp(c1.r, c2.r, t), lerp(c1.g, c2.g, t), lerp(c1.b, c2.b, t));
}

function rotateColor(hex: string, degrees: number): string {
  const { r, g, b } = hexToRgb(hex);
  const rNorm = r / 255;
  const gNorm = g / 255;
  const bNorm = b / 255;

  const max = Math.max(rNorm, gNorm, bNorm);
  const min = Math.min(rNorm, gNorm, bNorm);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rNorm:
        h = ((gNorm - bNorm) / d + (gNorm < bNorm ? 6 : 0)) / 6;
        break;
      case gNorm:
        h = ((bNorm - rNorm) / d + 2) / 6;
        break;
      case bNorm:
        h = ((rNorm - gNorm) / d + 4) / 6;
        break;
    }
  }

  h = (h + degrees / 360) % 1;
  if (h < 0) h += 1;

  let rNew: number, gNew: number, bNew: number;

  if (s === 0) {
    rNew = gNew = bNew = l;
  } else {
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
    rNew = hue2rgb(p, q, h + 1 / 3);
    gNew = hue2rgb(p, q, h);
    bNew = hue2rgb(p, q, h - 1 / 3);
  }

  return rgbToHex(rNew * 255, gNew * 255, bNew * 255);
}

function getComplementary(hex: string): string {
  return rotateColor(hex, 180);
}

function getAnalogous(hex: string, offset: number = 30): string[] {
  return [rotateColor(hex, -offset), hex, rotateColor(hex, offset)];
}

export function generateColorPalette(
  baseColors: string[],
  colorScheme: ColorScheme,
  count: number
): string[] {
  const palette: string[] = [];

  switch (colorScheme) {
    case 'gradient': {
      if (baseColors.length === 0) return new Array(count).fill('#ffffff');
      if (baseColors.length === 1) return new Array(count).fill(baseColors[0]);

      const segments = baseColors.length - 1;
      const stepsPerSegment = Math.ceil(count / segments);

      for (let i = 0; i < count; i++) {
        const segmentIndex = Math.min(Math.floor(i / stepsPerSegment), segments - 1);
        const localT = (i % stepsPerSegment) / stepsPerSegment;
        const color = lerpColor(
          baseColors[segmentIndex],
          baseColors[segmentIndex + 1],
          localT
        );
        palette.push(color);
      }
      break;
    }

    case 'complementary': {
      if (baseColors.length === 0) return new Array(count).fill('#ffffff');
      const base = baseColors[0];
      const complement = getComplementary(base);
      for (let i = 0; i < count; i++) {
        const t = i / Math.max(count - 1, 1);
        if (t < 0.5) {
          palette.push(lerpColor(base, complement, t * 2));
        } else {
          palette.push(lerpColor(complement, base, (t - 0.5) * 2));
        }
      }
      break;
    }

    case 'analogous': {
      if (baseColors.length === 0) return new Array(count).fill('#ffffff');
      const base = baseColors[0];
      const analogous = getAnalogous(base, 40);
      for (let i = 0; i < count; i++) {
        const t = i / Math.max(count - 1, 1);
        if (t < 0.5) {
          palette.push(lerpColor(analogous[0], analogous[1], t * 2));
        } else {
          palette.push(lerpColor(analogous[1], analogous[2], (t - 0.5) * 2));
        }
      }
      break;
    }

    default:
      return new Array(count).fill(baseColors[0] || '#ffffff');
  }

  return palette.slice(0, count);
}
