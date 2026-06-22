import * as THREE from 'three';
import { MaterialType } from './types';

export function hexToThreeColor(hex: string): THREE.Color {
  return new THREE.Color(hex);
}

export function lerpColor(a: THREE.Color, b: THREE.Color, t: number): THREE.Color {
  return new THREE.Color().lerpColors(a, b, t);
}

export function getMaterialPreset(type: MaterialType): THREE.MeshPhysicalMaterialParameters {
  const base: THREE.MeshPhysicalMaterialParameters = {
    color: 0xffffff,
  };

  switch (type) {
    case 'matte':
      return {
        ...base,
        roughness: 0.95,
        metalness: 0.0,
        clearcoat: 0,
      };
    case 'glossy':
      return {
        ...base,
        roughness: 0.04,
        metalness: 0.6,
        clearcoat: 1.0,
        clearcoatRoughness: 0.03,
        reflectivity: 0.9,
        iridescence: 0.15,
        iridescenceIOR: 1.5,
      };
    case 'suede':
      return {
        ...base,
        roughness: 1.0,
        metalness: 0.0,
        clearcoat: 0,
        sheen: 1.0,
        sheenRoughness: 0.85,
        sheenColor: new THREE.Color(0xbbbbbb),
        anisotropy: 0.6,
        anisotropyRotation: 0.3,
      };
    case 'mesh':
      return {
        ...base,
        roughness: 0.6,
        metalness: 0.05,
        clearcoat: 0.15,
        transmission: 0.08,
        side: THREE.DoubleSide,
        transparent: true,
      };
  }
}

function fract(v: number): number {
  return v - Math.floor(v);
}

function hash2(x: number, y: number): number {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return fract(n);
}

function valueNoise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);

  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);

  const ab = a + u * (b - a);
  const cd = c + u * (d - c);
  return ab + v * (cd - ab);
}

function fbm(x: number, y: number, octaves: number = 4): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * valueNoise(x * frequency, y * frequency);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

export function generateSuedeBumpMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const imgData = ctx.createImageData(size, size);
  const data = imgData.data;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      const nx = x / size;
      const ny = y / size;

      const base = fbm(nx * 8, ny * 8, 5);

      const fiberAngle = fbm(nx * 3, ny * 3, 2) * Math.PI;
      const fiberX = nx * 120 + Math.cos(fiberAngle) * 5;
      const fiberY = ny * 120 + Math.sin(fiberAngle) * 5;
      const fibers = Math.abs(Math.sin(fiberX) * Math.sin(fiberY)) * 0.35;

      const microFiber = fbm(nx * 60, ny * 60, 2) * 0.3;

      const v = 0.5 + (base - 0.5) * 0.7 + fibers + (microFiber - 0.15);
      const clamped = Math.max(0, Math.min(1, v));
      const gray = Math.floor(clamped * 255);

      data[idx] = gray;
      data[idx + 1] = gray;
      data[idx + 2] = gray;
      data[idx + 3] = 255;
    }
  }
  ctx.putImageData(imgData, 0, 0);

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  texture.anisotropy = 8;
  return texture;
}

export function generateSuedeNormalMap(): THREE.CanvasTexture {
  const bump = generateSuedeBumpMap();
  const srcCanvas = bump.image as HTMLCanvasElement;
  const size = srcCanvas.width;
  const srcCtx = srcCanvas.getContext('2d')!;
  const srcData = srcCtx.getImageData(0, 0, size, size).data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = size;
  outCanvas.height = size;
  const outCtx = outCanvas.getContext('2d')!;
  const outImg = outCtx.createImageData(size, size);
  const outData = outImg.data;

  const strength = 8.0;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const xl = (x - 1 + size) % size;
      const xr = (x + 1) % size;
      const yt = (y - 1 + size) % size;
      const yb = (y + 1) % size;

      const l = srcData[(y * size + xl) * 4] / 255;
      const r = srcData[(y * size + xr) * 4] / 255;
      const t = srcData[(yt * size + x) * 4] / 255;
      const b = srcData[(yb * size + x) * 4] / 255;

      let dx = (l - r) * strength;
      let dy = (t - b) * strength;
      const dz = 1.0;
      const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
      dx /= len;
      dy /= len;
      const dzN = dz / len;

      const idx = (y * size + x) * 4;
      outData[idx] = Math.floor((dx * 0.5 + 0.5) * 255);
      outData[idx + 1] = Math.floor((dy * 0.5 + 0.5) * 255);
      outData[idx + 2] = Math.floor((dzN * 0.5 + 0.5) * 255);
      outData[idx + 3] = 255;
    }
  }
  outCtx.putImageData(outImg, 0, 0);

  const texture = new THREE.CanvasTexture(outCanvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.needsUpdate = true;
  texture.anisotropy = 8;
  texture.colorSpace = THREE.LinearSRGBColorSpace;
  return texture;
}

export function generateMeshAlphaMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const threadW = 5;
  const spacing = 9;
  for (let y = 0; y < size; y += spacing) {
    for (let x = 0; x < size; x += spacing) {
      const offset = ((y / spacing) % 2 === 0) ? 0 : spacing / 2;

      ctx.fillStyle = '#000000';
      ctx.beginPath();
      ctx.ellipse(x + offset + threadW / 2, y + threadW / 2, threadW / 2 * 0.9, threadW / 2 * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  ctx.globalAlpha = 0.35;
  for (let y = 0; y < size; y += 3) {
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y);
    ctx.stroke();
  }
  for (let x = 0; x < size; x += 3) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, size);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.needsUpdate = true;
  texture.anisotropy = 8;
  return texture;
}

export function generateMeshColorMap(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, size, size);

  const threadW = 5;
  const spacing = 9;
  ctx.globalAlpha = 0.18;
  for (let y = 0; y < size; y += spacing) {
    for (let x = 0; x < size; x += spacing) {
      const offset = ((y / spacing) % 2 === 0) ? 0 : spacing / 2;
      const shade = (Math.sin(x * 0.05 + y * 0.05) + 1) * 0.25 + 0.4;
      ctx.fillStyle = `rgba(0,0,0,${shade * 0.35})`;
      ctx.beginPath();
      ctx.ellipse(x + offset + threadW / 2, y + threadW / 2, threadW / 2 * 0.9, threadW / 2 * 0.7, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.needsUpdate = true;
  texture.anisotropy = 8;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createDecalTexture(image: HTMLImageElement): THREE.Texture {
  const texture = new THREE.Texture(image);
  texture.needsUpdate = true;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

export function relativeLuminance(hex: string): number {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}
