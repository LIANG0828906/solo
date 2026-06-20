import * as THREE from 'three';
import { LEATHER_BOUNDS } from '@/types';

const NOISE_SIZE = 1024;

function hash(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

function smoothNoise(x: number, y: number): number {
  const ix = Math.floor(x);
  const iy = Math.floor(y);
  const fx = x - ix;
  const fy = y - iy;
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const n00 = hash(ix, iy);
  const n10 = hash(ix + 1, iy);
  const n01 = hash(ix, iy + 1);
  const n11 = hash(ix + 1, iy + 1);
  const nx0 = n00 * (1 - sx) + n10 * sx;
  const nx1 = n01 * (1 - sx) + n11 * sx;
  return nx0 * (1 - sy) + nx1 * sy;
}

function fbm(x: number, y: number, octaves: number): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * smoothNoise(x * frequency, y * frequency);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

export function generateLeatherTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = NOISE_SIZE;
  canvas.height = NOISE_SIZE;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(NOISE_SIZE, NOISE_SIZE);
  const data = imageData.data;

  for (let y = 0; y < NOISE_SIZE; y++) {
    for (let x = 0; x < NOISE_SIZE; x++) {
      const nx = x / NOISE_SIZE * 8;
      const ny = y / NOISE_SIZE * 8;
      const baseNoise = fbm(nx, ny, 6);
      const wrinkle = fbm(nx * 2.5, ny * 2.5, 3) * 0.15;
      const grain = Math.random() * 0.03;
      const t = Math.max(0, Math.min(1, baseNoise + wrinkle + grain));
      const idx = (y * NOISE_SIZE + x) * 4;
      data[idx] = Math.floor(139 * (0.7 + 0.3 * t));
      data[idx + 1] = Math.floor(94 * (0.7 + 0.3 * t));
      data[idx + 2] = Math.floor(60 * (0.7 + 0.3 * t));
      data[idx + 3] = 255;
    }
  }

  const poreCount = 3000;
  for (let i = 0; i < poreCount; i++) {
    const px = Math.floor(Math.random() * NOISE_SIZE);
    const py = Math.floor(Math.random() * NOISE_SIZE);
    const pr = Math.random() * 2 + 0.5;
    for (let dy = -Math.ceil(pr); dy <= Math.ceil(pr); dy++) {
      for (let dx = -Math.ceil(pr); dx <= Math.ceil(pr); dx++) {
        if (dx * dx + dy * dy <= pr * pr) {
          const idx = ((py + dy) * NOISE_SIZE + (px + dx)) * 4;
          if (idx >= 0 && idx < data.length - 3) {
            data[idx] = Math.max(0, data[idx] - 15);
            data[idx + 1] = Math.max(0, data[idx + 1] - 10);
            data[idx + 2] = Math.max(0, data[idx + 2] - 8);
          }
        }
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function generateLeatherNormalMap(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const imageData = ctx.createImageData(512, 512);
  const data = imageData.data;

  for (let y = 0; y < 512; y++) {
    for (let x = 0; x < 512; x++) {
      const nx = x / 512 * 10;
      const ny = y / 512 * 10;
      const n = fbm(nx, ny, 4);
      const idx = (y * 512 + x) * 4;
      data[idx] = Math.floor(128 + (n - 0.5) * 80);
      data[idx + 1] = Math.floor(128 + (n - 0.5) * 80);
      data[idx + 2] = 255;
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
}

export function generateDefectPositions(): Array<{ id: string; type: 'scar' | 'porosity' | 'wrinkle'; position: { x: number; y: number }; radius: number; severity: number }> {
  const defects: Array<{ id: string; type: 'scar' | 'porosity' | 'wrinkle'; position: { x: number; y: number }; radius: number; severity: number }> = [];
  const halfW = LEATHER_BOUNDS.width / 2;
  const halfH = LEATHER_BOUNDS.height / 2;

  for (let i = 0; i < 3; i++) {
    defects.push({
      id: `defect-${i}`,
      type: i === 0 ? 'scar' : i === 1 ? 'porosity' : 'wrinkle',
      position: {
        x: (Math.random() - 0.5) * (LEATHER_BOUNDS.width - 1),
        y: (Math.random() - 0.5) * (LEATHER_BOUNDS.height - 1),
      },
      radius: 0.15 + Math.random() * 0.15,
      severity: 0.5 + Math.random() * 0.5,
    });
  }

  return defects;
}

export function generateThumbnail(pieces: Array<{ shape: string; position: { x: number; y: number }; width: number; height: number }>): string {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 120;
  const ctx = canvas.getContext('2d')!;
  const halfW = LEATHER_BOUNDS.width / 2;
  const halfH = LEATHER_BOUNDS.height / 2;
  const scaleX = 200 / LEATHER_BOUNDS.width;
  const scaleY = 120 / LEATHER_BOUNDS.height;

  ctx.fillStyle = '#8b5e3c';
  ctx.fillRect(0, 0, 200, 120);

  pieces.forEach((p) => {
    const px = (p.position.x + halfW) * scaleX;
    const py = (p.position.y + halfH) * scaleY;
    const pw = p.width * scaleX;
    const ph = p.height * scaleY;
    ctx.fillStyle = 'rgba(0, 255, 136, 0.4)';
    ctx.fillRect(px - pw / 2, py - ph / 2, pw, ph);
  });

  return canvas.toDataURL('image/png', 0.6);
}
