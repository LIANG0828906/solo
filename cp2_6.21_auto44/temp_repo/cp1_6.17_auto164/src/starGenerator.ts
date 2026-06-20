import * as THREE from 'three';
import type { StarParams } from './store';

export interface StarData {
  color: string;
  radius: number;
  spectralType: string;
  texture: THREE.CanvasTexture;
  temperature: number;
}

const hexToRgb = (hex: string): { r: number; g: number; b: number } => {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.substring(0, 2), 16),
    g: parseInt(h.substring(2, 4), 16),
    b: parseInt(h.substring(4, 6), 16)
  };
};

const rgbToHex = (r: number, g: number, b: number): string => {
  const toHex = (n: number) => n.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const lerpColor = (c1: string, c2: string, t: number): string => {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  return rgbToHex(
    Math.round(a.r + (b.r - a.r) * t),
    Math.round(a.g + (b.g - a.g) * t),
    Math.round(a.b + (b.b - a.b) * t)
  );
};

export const generateStarData = (params: StarParams): StarData => {
  const { mass, age, metallicity } = params;

  let temperature: number;
  let spectralType: string;
  let baseColor: string;

  const massRatio = (mass - 0.5) / (50 - 0.5);

  if (mass >= 16) {
    temperature = 30000 + Math.random() * 10000;
    spectralType = 'O';
    baseColor = '#9BB0FF';
  } else if (mass >= 2.1) {
    temperature = 10000 + Math.random() * 10000;
    spectralType = 'B';
    baseColor = '#A0BFFF';
  } else if (mass >= 1.4) {
    temperature = 7500 + Math.random() * 2500;
    spectralType = 'A';
    baseColor = '#CAD7FF';
  } else if (mass >= 1.04) {
    temperature = 6000 + Math.random() * 1500;
    spectralType = 'F';
    baseColor = '#FFF4E8';
  } else if (mass >= 0.8) {
    temperature = 5200 + Math.random() * 800;
    spectralType = 'G';
    baseColor = '#FFF4E8';
  } else if (mass >= 0.45) {
    temperature = 3700 + Math.random() * 1500;
    spectralType = 'K';
    baseColor = '#FFD2A1';
  } else {
    temperature = 2400 + Math.random() * 1300;
    spectralType = 'M';
    baseColor = '#FF6060';
  }

  const maxAge = 10000000000;
  const ageRatio = Math.min(age / maxAge, 1);
  if (ageRatio > 0.7) {
    const redT = (ageRatio - 0.7) / 0.3;
    baseColor = lerpColor(baseColor, '#FF8C42', redT * 0.6);
    temperature *= 1 - redT * 0.3;
  }

  const metalRatio = (metallicity - 0.01) / (0.3 - 0.01);
  baseColor = lerpColor(baseColor, '#FFFFFF', metalRatio * 0.15);

  const radius = 0.6 + Math.pow(mass, 0.7) * 0.8;

  const texture = generateStarTexture(baseColor, mass, metallicity);

  return {
    color: baseColor,
    radius,
    spectralType,
    texture,
    temperature: Math.round(temperature)
  };
};

const generateStarTexture = (color: string, mass: number, metallicity: number): THREE.CanvasTexture => {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const base = hexToRgb(color);

  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gradient.addColorStop(0, `rgb(${Math.min(255, base.r + 60)}, ${Math.min(255, base.g + 60)}, ${Math.min(255, base.b + 60)})`);
  gradient.addColorStop(0.5, color);
  gradient.addColorStop(1, `rgb(${Math.max(0, base.r - 80)}, ${Math.max(0, base.g - 80)}, ${Math.max(0, base.b - 80)})`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, size, size);

  const numGranules = Math.floor(80 + mass * 10);
  for (let i = 0; i < numGranules; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 5 + Math.random() * 20;
    const brightness = Math.random() * 40 - 20;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const br = Math.max(0, Math.min(255, base.r + brightness));
    const bg = Math.max(0, Math.min(255, base.g + brightness));
    const bb = Math.max(0, Math.min(255, base.b + brightness));
    g.addColorStop(0, `rgba(${br}, ${bg}, ${bb}, 0.4)`);
    g.addColorStop(1, `rgba(${br}, ${bg}, ${bb}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const numSpots = Math.floor(5 + mass * 3);
  for (let i = 0; i < numSpots; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    const r = 10 + Math.random() * 30;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    const br = Math.max(0, base.r - 60);
    const bg = Math.max(0, base.g - 60);
    const bb = Math.max(0, base.b - 60);
    g.addColorStop(0, `rgba(${br}, ${bg}, ${bb}, 0.5)`);
    g.addColorStop(1, `rgba(${br}, ${bg}, ${bb}, 0)`);
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
};
