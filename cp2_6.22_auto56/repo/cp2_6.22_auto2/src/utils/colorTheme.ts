import * as THREE from 'three';

export interface ColorTheme {
  name: string;
  building: number;
  windows: number;
  ground: number;
  accent: number;
  label: string;
}

export const THEMES: Record<string, ColorTheme> = {
  sunsetGold: {
    name: 'sunsetGold',
    label: '日落金',
    building: 0x8b5a3c,
    windows: 0xffc857,
    ground: 0x2d1f3d,
    accent: 0xff9f43
  },
  cyberBlue: {
    name: 'cyberBlue',
    label: '赛博蓝',
    building: 0x1a2a4a,
    windows: 0x00e5ff,
    ground: 0x0d1530,
    accent: 0x2196f3
  },
  forestGreen: {
    name: 'forestGreen',
    label: '森林绿',
    building: 0x2d4a3e,
    windows: 0x8bc34a,
    ground: 0x1a2e22,
    accent: 0x4caf50
  },
  minimalGray: {
    name: 'minimalGray',
    label: '极简灰',
    building: 0x5a5a6a,
    windows: 0xe0e0e8,
    ground: 0x2a2a35,
    accent: 0x9e9e9e
  }
};

export const THEME_LIST: ColorTheme[] = Object.values(THEMES);

export function lerpColor(hexA: number, hexB: number, t: number): number {
  const a = new THREE.Color(hexA);
  const b = new THREE.Color(hexB);
  return a.lerp(b, Math.max(0, Math.min(1, t))).getHex();
}

export function hexToRgb(hex: number): { r: number; g: number; b: number } {
  return {
    r: (hex >> 16) & 255,
    g: (hex >> 8) & 255,
    b: hex & 255
  };
}

export function rgbToHex(r: number, g: number, b: number): number {
  return ((Math.round(r) & 0xff) << 16) | ((Math.round(g) & 0xff) << 8) | (Math.round(b) & 0xff);
}

export function hexToString(hex: number): string {
  return '#' + hex.toString(16).padStart(6, '0');
}

export function stringToHex(str: string): number {
  const clean = str.replace('#', '');
  return parseInt(clean, 16);
}

export function getSkyColors(hour: number): { top: number; bottom: number; ambient: number } {
  const keyframes = [
    { h: 0, top: 0x0a0a2e, bottom: 0x1a1a4e, ambient: 0x1a1a3a },
    { h: 5, top: 0x1a2a5a, bottom: 0x4a3a5a, ambient: 0x2a2a4a },
    { h: 7, top: 0x4a6abf, bottom: 0xff8a5a, ambient: 0x6a7aaf },
    { h: 10, top: 0x5a8adf, bottom: 0xbac8e8, ambient: 0xa0b8d0 },
    { h: 12, top: 0x4a9af0, bottom: 0xc8dcf0, ambient: 0xb8cce0 },
    { h: 16, top: 0x5a7ac0, bottom: 0xf0a060, ambient: 0x90a0c0 },
    { h: 18, top: 0x3a2a6a, bottom: 0xff6030, ambient: 0x605070 },
    { h: 20, top: 0x1a1a5a, bottom: 0x3a1a4a, ambient: 0x2a2a50 },
    { h: 24, top: 0x0a0a2e, bottom: 0x1a1a4e, ambient: 0x1a1a3a }
  ];

  let i = 0;
  while (i < keyframes.length - 1 && hour > keyframes[i + 1].h) {
    i++;
  }

  const k1 = keyframes[i];
  const k2 = keyframes[Math.min(i + 1, keyframes.length - 1)];
  const range = k2.h - k1.h || 1;
  const localT = (hour - k1.h) / range;

  return {
    top: lerpColor(k1.top, k2.top, localT),
    bottom: lerpColor(k1.bottom, k2.bottom, localT),
    ambient: lerpColor(k1.ambient, k2.ambient, localT)
  };
}

export function getSunIntensity(hour: number): number {
  if (hour < 5 || hour > 20) return 0.1;
  if (hour < 7) return 0.1 + (hour - 5) * 0.35;
  if (hour > 18) return 0.1 + (20 - hour) * 0.35;
  if (hour >= 10 && hour <= 16) return 1.2;
  return 0.9;
}

export function getSunColor(hour: number): number {
  if (hour < 6 || hour > 19) return 0x6666aa;
  if (hour < 8 || hour > 17) return 0xffaa66;
  return 0xffffee;
}

export function getWindowEmissiveIntensity(hour: number): number {
  if (hour >= 7 && hour <= 17) return 0.1;
  if (hour < 6 || hour > 19) return 1.2;
  const t = hour < 7 ? (7 - hour) : (hour - 17);
  return 0.1 + t * 0.55;
}
