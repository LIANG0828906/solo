import * as THREE from 'three';

export const HEIGHT_LEVELS = 5;
export const CLOUD_TEX_WIDTH = 1024;
export const CLOUD_TEX_HEIGHT = 512;

export interface CloudRenderResult {
  texture: THREE.CanvasTexture;
  opacity: number;
  level: number;
}

interface LayerCache {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  basePattern: ImageData;
  seed: number;
  density: number;
  scale: number;
}

function perlin2D(x: number, y: number, seed: number): number {
  const hash = (ix: number, iy: number) => {
    let h = seed + ix * 374761393 + iy * 668265263;
    h = (h ^ (h >>> 13)) * 1274126177;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
  };
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

  const v00 = hash(xi, yi);
  const v10 = hash(xi + 1, yi);
  const v01 = hash(xi, yi + 1);
  const v11 = hash(xi + 1, yi + 1);
  const u = fade(xf);
  const v = fade(yf);

  return lerp(lerp(v00, v10, u), lerp(v01, v11, u), v);
}

function fbm(x: number, y: number, seed: number, octaves: number = 5): number {
  let value = 0;
  let amplitude = 0.5;
  let frequency = 1;
  for (let i = 0; i < octaves; i++) {
    value += amplitude * perlin2D(x * frequency, y * frequency, seed + i * 131);
    amplitude *= 0.5;
    frequency *= 2;
  }
  return value;
}

export class CloudLayerManager {
  private layers: LayerCache[] = [];
  private currentLevel: number = 2;
  private targetLevel: number = 2;
  private transitionOpacity: number = 1;
  private blendFromLevel: number = 2;

  private compositeCanvas: HTMLCanvasElement;
  private compositeCtx: CanvasRenderingContext2D;
  private texture: THREE.CanvasTexture;

  private elapsed: number = 0;

  constructor() {
    this.initLayers();
    this.compositeCanvas = document.createElement('canvas');
    this.compositeCanvas.width = CLOUD_TEX_WIDTH;
    this.compositeCanvas.height = CLOUD_TEX_HEIGHT;
    this.compositeCtx = this.compositeCanvas.getContext('2d')!;

    this.texture = new THREE.CanvasTexture(this.compositeCanvas);
    this.texture.wrapS = THREE.RepeatWrapping;
    this.texture.wrapT = THREE.ClampToEdgeWrapping;
    this.texture.magFilter = THREE.LinearFilter;
    this.texture.minFilter = THREE.LinearFilter;
    this.texture.colorSpace = THREE.SRGBColorSpace;
    this.texture.needsUpdate = true;
  }

  private initLayers(): void {
    const seeds = [101, 202, 303, 404, 505];
    const densities = [0.55, 0.48, 0.42, 0.35, 0.28];
    const scales = [6, 7, 8, 9, 10];

    for (let i = 0; i < HEIGHT_LEVELS; i++) {
      const canvas = document.createElement('canvas');
      canvas.width = CLOUD_TEX_WIDTH;
      canvas.height = CLOUD_TEX_HEIGHT;
      const ctx = canvas.getContext('2d')!;

      const img = ctx.createImageData(CLOUD_TEX_WIDTH, CLOUD_TEX_HEIGHT);
      const data = img.data;

      for (let y = 0; y < CLOUD_TEX_HEIGHT; y++) {
        for (let x = 0; x < CLOUD_TEX_WIDTH; x++) {
          const nx = (x / CLOUD_TEX_WIDTH) * scales[i];
          const ny = (y / CLOUD_TEX_HEIGHT) * scales[i] * 0.5;
          const n1 = fbm(nx, ny, seeds[i], 6);
          const n2 = fbm(nx * 3 + 5.2, ny * 3 + 1.3, seeds[i] + 41, 4);
          let cloud = n1 * 0.7 + n2 * 0.3;

          const lat = (y / CLOUD_TEX_HEIGHT) * 2 - 1;
          const bandFactor = 1 - Math.pow(Math.abs(lat) * 0.7, 2);
          cloud *= 0.55 + bandFactor * 0.45;

          const threshold = 1 - densities[i];
          cloud = Math.max(0, (cloud - threshold) / (1 - threshold));
          cloud = Math.pow(cloud, 0.75);

          const alpha = Math.min(255, Math.floor(cloud * 255));
          const idx = (y * CLOUD_TEX_WIDTH + x) * 4;
          data[idx] = 255;
          data[idx + 1] = 255;
          data[idx + 2] = 255;
          data[idx + 3] = alpha;
        }
      }
      ctx.putImageData(img, 0, 0);

      this.layers.push({
        canvas,
        ctx,
        basePattern: ctx.getImageData(0, 0, CLOUD_TEX_WIDTH, CLOUD_TEX_HEIGHT),
        seed: seeds[i],
        density: densities[i],
        scale: scales[i]
      });
    }
  }

  public setHeightLevel(level: number): void {
    const clamped = Math.max(0, Math.min(HEIGHT_LEVELS - 1, level));
    if (clamped === this.targetLevel) return;

    this.blendFromLevel = this.currentLevel;
    this.targetLevel = clamped;
    this.transitionOpacity = 0;
  }

  public getCurrentLevel(): number {
    return this.currentLevel;
  }

  public getTargetLevel(): number {
    return this.targetLevel;
  }

  public update(dt: number, elapsedSec: number, currentHour: number): CloudRenderResult {
    this.elapsed = elapsedSec;

    const TRANSITION_DURATION = 0.5;
    if (this.transitionOpacity < 1) {
      this.transitionOpacity = Math.min(1, this.transitionOpacity + dt / TRANSITION_DURATION);
      if (this.transitionOpacity >= 1) {
        this.currentLevel = this.targetLevel;
        this.blendFromLevel = this.targetLevel;
      }
    }

    const speedFactor = 1 + (currentHour / 71) * 1.2;
    const baseSpeed = 22;
    const flowSpeed = baseSpeed * speedFactor;

    const offsetX = (elapsedSec * flowSpeed) % CLOUD_TEX_WIDTH;
    const offsetY = Math.sin(elapsedSec * 0.25) * 3;

    const ctx = this.compositeCtx;
    ctx.clearRect(0, 0, CLOUD_TEX_WIDTH, CLOUD_TEX_HEIGHT);

    const drawLayer = (levelIdx: number, alpha: number) => {
      if (alpha <= 0.01) return;
      const layer = this.layers[levelIdx];

      const animOffsetX = offsetX * (0.7 + levelIdx * 0.15);
      const animOffsetY = offsetY * (1 + levelIdx * 0.2);

      const ox = ((animOffsetX % CLOUD_TEX_WIDTH) + CLOUD_TEX_WIDTH) % CLOUD_TEX_WIDTH;
      const oy = animOffsetY;

      ctx.globalAlpha = alpha;
      ctx.clearRect(0, 0, CLOUD_TEX_WIDTH, CLOUD_TEX_HEIGHT);

      ctx.save();
      ctx.putImageData(layer.basePattern, -ox, oy);
      ctx.putImageData(layer.basePattern, CLOUD_TEX_WIDTH - ox, oy);
      ctx.putImageData(layer.basePattern, -ox, CLOUD_TEX_HEIGHT + oy);
      ctx.putImageData(layer.basePattern, CLOUD_TEX_WIDTH - ox, CLOUD_TEX_HEIGHT + oy);
      ctx.restore();

      const swirlPhase = elapsedSec * 0.15 + levelIdx * 0.8;
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = alpha * 0.18;

      for (let s = 0; s < 3; s++) {
        const sx = CLOUD_TEX_WIDTH * (0.2 + s * 0.3) + Math.sin(swirlPhase + s) * 60;
        const sy = CLOUD_TEX_HEIGHT * (0.3 + (s % 2) * 0.4) + Math.cos(swirlPhase * 0.8 + s) * 30;
        const sr = 90 + s * 30 + Math.sin(swirlPhase * 1.3 + s * 0.7) * 20;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr);
        grad.addColorStop(0, 'rgba(255,255,255,0.35)');
        grad.addColorStop(0.6, 'rgba(255,255,255,0.1)');
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, sr, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    };

    const fromAlpha = 1 - this.transitionOpacity;
    const toAlpha = this.transitionOpacity;

    drawLayer(this.blendFromLevel, fromAlpha);

    ctx.save();
    ctx.globalAlpha = toAlpha;
    drawLayer(this.targetLevel, 1);
    ctx.restore();

    this.texture.needsUpdate = true;

    const dispLevel = this.transitionOpacity > 0.5 ? this.targetLevel : this.blendFromLevel;

    return {
      texture: this.texture,
      opacity: 0.58 + Math.min(1, this.transitionOpacity) * 0.05,
      level: dispLevel
    };
  }

  public getTexture(): THREE.CanvasTexture {
    return this.texture;
  }

  public dispose(): void {
    this.texture.dispose();
    this.layers = [];
  }
}
