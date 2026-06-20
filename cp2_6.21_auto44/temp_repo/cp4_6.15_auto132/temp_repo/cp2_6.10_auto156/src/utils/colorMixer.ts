interface ColorMixInput {
  color: string;
  ratio: number;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      }
    : { r: 0, g: 0, b: 0 };
}

function rgbToHex(r: number, g: number, b: number): string {
  return (
    '#' +
    [r, g, b]
      .map(x => {
        const hex = Math.round(Math.max(0, Math.min(255, x))).toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      })
      .join('')
  );
}

function rgbToCmy(r: number, g: number, b: number): { c: number; m: number; y: number } {
  const c = 1 - r / 255;
  const m = 1 - g / 255;
  const y = 1 - b / 255;
  return { c, m, y };
}

function cmyToRgb(c: number, m: number, y: number): { r: number; g: number; b: number } {
  return {
    r: Math.round((1 - c) * 255),
    g: Math.round((1 - m) * 255),
    b: Math.round((1 - y) * 255)
  };
}

export function mixColors(colors: ColorMixInput[]): string {
  if (colors.length === 0) return '#F5DEB3';
  if (colors.length === 1) return colors[0].color;

  const totalRatio = colors.reduce((sum, c) => sum + c.ratio, 0);
  if (totalRatio === 0) return '#F5DEB3';

  let totalC = 0;
  let totalM = 0;
  let totalY = 0;

  for (const { color, ratio } of colors) {
    const { r, g, b } = hexToRgb(color);
    const { c, m, y } = rgbToCmy(r, g, b);
    const normalizedRatio = ratio / totalRatio;
    totalC += c * normalizedRatio;
    totalM += m * normalizedRatio;
    totalY += y * normalizedRatio;
  }

  const { r, g, b } = cmyToRgb(totalC, totalM, totalY);
  return rgbToHex(r, g, b);
}

export function blendColors(color1: string, color2: string, ratio: number): string {
  return mixColors([
    { color: color1, ratio: 1 - ratio },
    { color: color2, ratio: ratio }
  ]);
}
