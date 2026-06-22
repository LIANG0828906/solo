export interface GradientColors {
  start: string;
  end: string;
  gradient: string;
}

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
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

function adjustBrightness(rgb: { r: number; g: number; b: number }, factor: number): { r: number; g: number; b: number } {
  return {
    r: Math.min(255, Math.max(0, Math.round(rgb.r * factor))),
    g: Math.min(255, Math.max(0, Math.round(rgb.g * factor))),
    b: Math.min(255, Math.max(0, Math.round(rgb.b * factor))),
  };
}

export function generateGradientFromHash(hash: string): GradientColors {
  const cleanHash = hash.replace(/[^0-9a-f]/gi, '').padEnd(6, '0').slice(0, 6);

  const baseRgb = hexToRgb(`#${cleanHash}`);

  const startRgb = adjustBrightness(baseRgb, 1.2);
  const endRgb = adjustBrightness(baseRgb, 0.8);

  const start = rgbToHex(startRgb.r, startRgb.g, startRgb.b);
  const end = rgbToHex(endRgb.r, endRgb.g, endRgb.b);

  return {
    start,
    end,
    gradient: `linear-gradient(135deg, ${start} 0%, ${end} 100%)`,
  };
}

export function generateColorFromHash(hash: string): string {
  const cleanHash = hash.replace(/[^0-9a-f]/gi, '').padEnd(6, '0').slice(0, 6);
  return `#${cleanHash}`;
}
