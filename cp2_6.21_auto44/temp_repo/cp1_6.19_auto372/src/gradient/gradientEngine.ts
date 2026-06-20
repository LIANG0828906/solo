import type { GradientNode, GradientDirection } from '@/types';

export interface RGB { r: number; g: number; b: number; }
export interface HSL { h: number; s: number; l: number; }

export function hexToRgb(hex: string): RGB {
  const clean = hex.replace('#', '');
  const full = clean.length === 3
    ? clean.split('').map(c => c + c).join('')
    : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

export function rgbToHex({ r, g, b }: RGB): string {
  const toHex = (v: number) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function rgbToHsl({ r, g, b }: RGB): HSL {
  const rn = r / 255, gn = g / 255, bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case rn: h = (gn - bn) / d + (gn < bn ? 6 : 0); break;
      case gn: h = (bn - rn) / d + 2; break;
      case bn: h = (rn - gn) / d + 4; break;
    }
    h *= 60;
  }
  return { h, s, l };
}

export function hslToRgb({ h, s, l }: HSL): RGB {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const hp = h / 60;
  const x = c * (1 - Math.abs((hp % 2) - 1));
  let r1 = 0, g1 = 0, b1 = 0;
  if (hp >= 0 && hp < 1) { r1 = c; g1 = x; }
  else if (hp < 2) { r1 = x; g1 = c; }
  else if (hp < 3) { g1 = c; b1 = x; }
  else if (hp < 4) { g1 = x; b1 = c; }
  else if (hp < 5) { r1 = x; b1 = c; }
  else { r1 = c; b1 = x; }
  const m = l - c / 2;
  return { r: (r1 + m) * 255, g: (g1 + m) * 255, b: (b1 + m) * 255 };
}

export function randomHslColor(): string {
  return rgbToHex(hslToRgb({
    h: Math.random() * 360,
    s: 0.5 + Math.random() * 0.5,
    l: 0.4 + Math.random() * 0.3,
  }));
}

export function interpolateColor(c1: string, c2: string, t: number): string {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  const ease = t * t * (3 - 2 * t);
  return rgbToHex({
    r: a.r + (b.r - a.r) * ease,
    g: a.g + (b.g - a.g) * ease,
    b: a.b + (b.b - a.b) * ease,
  });
}

export function interpolateNode(
  nodeA: GradientNode,
  nodeB: GradientNode,
  localT: number,
): { startColor: string; endColor: string } {
  return {
    startColor: interpolateColor(nodeA.startColor, nodeB.startColor, localT),
    endColor: interpolateColor(nodeA.endColor, nodeB.endColor, localT),
  };
}

export function generateGradientCSS(
  startColor: string,
  endColor: string,
  direction: GradientDirection,
): string {
  switch (direction.type) {
    case 'linear':
      return `linear-gradient(${direction.angle}deg, ${startColor}, ${endColor})`;
    case 'radial':
      return `radial-gradient(${direction.position}, ${startColor}, ${endColor})`;
    case 'conic':
      return `conic-gradient(from 0deg, ${startColor}, ${endColor}, ${startColor})`;
  }
}

export function interpolateColorsArray(colors: string[], steps: number): string[] {
  if (colors.length < 2) return colors;
  const result: string[] = [];
  const segments = colors.length - 1;
  const perSeg = Math.floor(steps / segments);
  for (let i = 0; i < segments; i++) {
    const count = i === segments - 1 ? steps - result.length : perSeg;
    for (let j = 0; j < count; j++) {
      result.push(interpolateColor(colors[i], colors[i + 1], j / count));
    }
  }
  return result;
}

export function computeBlendedColors(node: GradientNode): { startColor: string; endColor: string } {
  const t = node.blendRatio / 100;
  const mid = interpolateColor(node.startColor, node.endColor, 0.5);
  return {
    startColor: interpolateColor(node.startColor, mid, t * 0.5),
    endColor: interpolateColor(mid, node.endColor, 0.5 + t * 0.5),
  };
}
