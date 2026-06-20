export type ColorMode = 'red-blue' | 'purple-green' | 'orange-cyan';

export interface ColorScheme {
  name: string;
  stops: string[];
}

export const COLOR_SCHEMES: Record<ColorMode, ColorScheme> = {
  'red-blue': {
    name: '红蓝渐变',
    stops: ['#0a0015', '#2a0040', '#660066', '#cc0055', '#ff4466', '#3366ff', '#00ccff'],
  },
  'purple-green': {
    name: '紫绿渐变',
    stops: ['#050010', '#1a0033', '#4d0099', '#8800cc', '#00aa55', '#33dd88', '#88ffbb'],
  },
  'orange-cyan': {
    name: '橙青渐变',
    stops: ['#100600', '#331500', '#662200', '#ff5500', '#ffcc00', '#00ddff', '#66ffff'],
  },
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

export function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map((x) => {
        const hex = Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

export function lerpColor(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: color1.r + (color2.r - color1.r) * t,
    g: color1.g + (color2.g - color1.g) * t,
    b: color1.b + (color2.b - color1.b) * t,
  };
}

export function createColorInterpolator(stops: string[]): (t: number) => string {
  const rgbStops = stops.map((s) => hexToRgb(s));

  return (t: number): string => {
    const clampedT = Math.max(0, Math.min(1, t));
    const scaled = clampedT * (rgbStops.length - 1);
    const index = Math.floor(scaled);
    const localT = scaled - index;

    if (index >= rgbStops.length - 1) {
      return rgbToHex(rgbStops[rgbStops.length - 1].r, rgbStops[rgbStops.length - 1].g, rgbStops[rgbStops.length - 1].b);
    }

    const color = lerpColor(rgbStops[index], rgbStops[index + 1], localT);
    return rgbToHex(color.r, color.g, color.b);
  };
}

export function createRgbColorInterpolator(stops: string[]): (t: number) => { r: number; g: number; b: number } {
  const rgbStops = stops.map((s) => hexToRgb(s));

  return (t: number): { r: number; g: number; b: number } => {
    const clampedT = Math.max(0, Math.min(1, t));
    const scaled = clampedT * (rgbStops.length - 1);
    const index = Math.floor(scaled);
    const localT = scaled - index;

    if (index >= rgbStops.length - 1) {
      return { ...rgbStops[rgbStops.length - 1] };
    }

    return lerpColor(rgbStops[index], rgbStops[index + 1], localT);
  };
}
