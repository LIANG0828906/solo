export interface HSL {
  h: number;
  s: number;
  l: number;
}

export interface RGB {
  r: number;
  g: number;
  b: number;
}

export function hslToRgb(h: number, s: number, l: number): RGB {
  s /= 100;
  l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return {
    r: Math.round(f(0) * 255),
    g: Math.round(f(8) * 255),
    b: Math.round(f(4) * 255),
  };
}

export function hslToString(h: number, s: number, l: number): string {
  return `hsl(${h}, ${s}%, ${l}%)`;
}

export function hslToHex(h: number, s: number, l: number): string {
  const { r, g, b } = hslToRgb(h, s, l);
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function generateGradientColors(baseHue: number, count: number = 3): string[] {
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    const hue = (baseHue + i * 30) % 360;
    const saturation = 70 + Math.random() * 20;
    const lightness = 50 + Math.random() * 15;
    colors.push(hslToString(hue, saturation, lightness));
  }
  return colors;
}

export function generateAuroraGradient(hue: number): string {
  const colors = [
    hslToString((hue - 30 + 360) % 360, 80, 55),
    hslToString(hue, 85, 60),
    hslToString((hue + 30) % 360, 80, 55),
    hslToString((hue + 60) % 360, 75, 50),
    hslToString((hue - 30 + 360) % 360, 80, 55),
  ];
  return `linear-gradient(90deg, ${colors.join(', ')})`;
}

export function generateFlowGradient(hue: number): string {
  const hue1 = hue;
  const hue2 = (hue + 25) % 360;
  const hue3 = (hue + 50) % 360;
  const hue4 = (hue + 75) % 360;
  
  return `linear-gradient(90deg, 
    hsl(${hue1}, 85%, 55%) 0%, 
    hsl(${hue2}, 80%, 60%) 25%, 
    hsl(${hue3}, 75%, 50%) 50%, 
    hsl(${hue4}, 80%, 60%) 75%, 
    hsl(${hue1}, 85%, 55%) 100%)`;
}

export function generateRandomHSL(): HSL {
  return {
    h: Math.floor(Math.random() * 360),
    s: 65 + Math.floor(Math.random() * 25),
    l: 45 + Math.floor(Math.random() * 20),
  };
}

export function generateParticleColor(baseHue: number): string {
  const hue = (baseHue + (Math.random() - 0.5) * 120 + 360) % 360;
  const saturation = 75 + Math.random() * 20;
  const lightness = 55 + Math.random() * 25;
  return hslToString(hue, saturation, lightness);
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t;
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

export function easeInOutQuad(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

export function bezierCurve(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}
