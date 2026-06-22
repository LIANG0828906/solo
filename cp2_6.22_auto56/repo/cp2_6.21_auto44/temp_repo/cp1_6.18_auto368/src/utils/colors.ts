export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

export function adjustBrightness(hex: string, percent: number): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;

  const r = Math.min(255, Math.max(0, Math.round(rgb.r + (255 * percent) / 100)));
  const g = Math.min(255, Math.max(0, Math.round(rgb.g + (255 * percent) / 100)));
  const b = Math.min(255, Math.max(0, Math.round(rgb.b + (255 * percent) / 100)));

  return `rgb(${r}, ${g}, ${b})`;
}

export function getGradientStyle(primary: string, secondary: string): string {
  return `linear-gradient(135deg, ${primary} 0%, ${secondary} 100%)`;
}

export function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return (
    '#' +
    [0, 8, 4]
      .map(n => {
        const v = Math.round(255 * f(n));
        return v.toString(16).padStart(2, '0');
      })
      .join('')
  );
}
