// ============================================================
// CanvasRenderer.ts - Canvas 绘制引擎模块
// 调用关系:
//   App.tsx (useEffect) → render(canvas, layers, palette, selectedId)
//   LayerPanel.tsx → renderThumbnail(layer, palette, 30)
//   App.tsx (命中检测) → getLayerPath2D(type) + isPointInPath
//   svgExporter.ts → SHAPE_PATHS, getLayerBounds(layer)
// ============================================================
import type { Layer, ShapeType, BlendMode } from '@/shared/store';

export const SHAPE_PATHS: Record<ShapeType, string> = {
  moon: 'M70,10 A40,40 0 1,0 70,90 A30,30 0 1,1 70,10 Z',
  cloud: 'M25,65 Q10,65 10,50 Q10,35 28,38 Q30,20 50,20 Q70,18 72,38 Q88,35 88,52 Q88,68 70,68 L28,68 Q25,68 25,65 Z',
  mountain: 'M10,85 L35,35 L50,55 L65,20 L85,55 L95,85 Z',
  tree: 'M50,10 L20,55 L35,55 L35,90 L65,90 L65,55 L80,55 Z',
  bird: 'M10,55 Q25,30 40,50 Q50,35 60,50 Q70,35 85,55 Q70,50 60,55 Q50,50 40,55 Q25,50 10,55 Z',
  star: 'M50,8 L61,38 L93,38 L67,57 L77,88 L50,69 L23,88 L33,57 L7,38 L39,38 Z'
};

const BLEND_MAP: Record<BlendMode, GlobalCompositeOperation> = {
  normal: 'source-over',
  multiply: 'multiply',
  screen: 'screen',
  overlay: 'overlay'
};

const BASE_SIZE = 100;
const GRID_SIZE = 20;

let dirtyRegion: { x: number; y: number; w: number; h: number } | null = null;
let pendingRender: {
  canvas: HTMLCanvasElement;
  layers: Layer[];
  palette: string[];
  selectedId: string | null;
} | null = null;
let rafId: number | null = null;

export function markDirty(region: { x: number; y: number; w: number; h: number }): void {
  if (!dirtyRegion) {
    dirtyRegion = { ...region };
  } else {
    const x1 = Math.min(dirtyRegion.x, region.x);
    const y1 = Math.min(dirtyRegion.y, region.y);
    const x2 = Math.max(dirtyRegion.x + dirtyRegion.w, region.x + region.w);
    const y2 = Math.max(dirtyRegion.y + dirtyRegion.h, region.y + region.h);
    dirtyRegion = { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  }
}

function renderFull(ctx: CanvasRenderingContext2D, width: number, height: number): void {
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = '#333333';
  for (let y = 0; y < height; y += GRID_SIZE) {
    for (let x = 0; x < width; x += GRID_SIZE) {
      if (((x / GRID_SIZE) + (y / GRID_SIZE)) % 2 === 0) {
        ctx.fillRect(x, y, GRID_SIZE, GRID_SIZE);
      }
    }
  }
}

function renderDirty(ctx: CanvasRenderingContext2D, region: { x: number; y: number; w: number; h: number }): void {
  const x = Math.max(0, Math.floor(region.x - 2));
  const y = Math.max(0, Math.floor(region.y - 2));
  const w = Math.min(ctx.canvas.width - x, Math.ceil(region.w + 4));
  const h = Math.min(ctx.canvas.height - y, Math.ceil(region.h + 4));
  if (w <= 0 || h <= 0) return;
  ctx.clearRect(x, y, w, h);
  ctx.fillStyle = '#2a2a2a';
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = '#333333';
  const startGX = Math.floor(x / GRID_SIZE) * GRID_SIZE;
  const startGY = Math.floor(y / GRID_SIZE) * GRID_SIZE;
  const endX = x + w;
  const endY = y + h;
  for (let gy = startGY; gy < endY; gy += GRID_SIZE) {
    for (let gx = startGX; gx < endX; gx += GRID_SIZE) {
      if (((gx / GRID_SIZE) + (gy / GRID_SIZE)) % 2 === 0) {
        ctx.fillRect(gx, gy, GRID_SIZE, GRID_SIZE);
      }
    }
  }
}

function performRender(): void {
  if (!pendingRender) return;
  const { canvas, layers, palette, selectedId } = pendingRender;
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const perfStart = performance.now();

  if (dirtyRegion) {
    renderDirty(ctx, dirtyRegion);
    for (let i = 0; i < layers.length; i++) {
      const layer = layers[i];
      const b = getLayerBounds(layer);
      const dr = dirtyRegion;
      if (b.x + b.w >= dr.x && b.x <= dr.x + dr.w && b.y + b.h >= dr.y && b.y <= dr.y + dr.h) {
        drawShape(ctx, layer, palette, layer.id === selectedId);
      }
    }
  } else {
    renderFull(ctx, width, height);
    for (let i = 0; i < layers.length; i++) {
      drawShape(ctx, layers[i], palette, layers[i].id === selectedId);
    }
  }

  dirtyRegion = null;
  pendingRender = null;
  rafId = null;

  const elapsed = performance.now() - perfStart;
  if (elapsed > 60) {
    console.warn(`Canvas render exceeded 60ms: ${elapsed.toFixed(2)}ms`);
  }
}

export function render(canvas: HTMLCanvasElement, layers: Layer[], palette: string[], selectedId: string | null): void {
  pendingRender = { canvas, layers, palette, selectedId };
  if (rafId !== null) return;
  rafId = requestAnimationFrame(() => {
    performRender();
  });
}

export function renderImmediate(canvas: HTMLCanvasElement, layers: Layer[], palette: string[], selectedId: string | null): void {
  pendingRender = { canvas, layers, palette, selectedId };
  performRender();
}

export function drawShape(ctx: CanvasRenderingContext2D, layer: Layer, palette: string[], selected: boolean = false): void {
  ctx.save();
  ctx.globalCompositeOperation = BLEND_MAP[layer.blendMode];
  ctx.globalAlpha = layer.opacity / 100;
  const rad = (layer.rotation * Math.PI) / 180;
  const s = layer.scale / 100;
  const cos = Math.cos(rad) * s;
  const sin = Math.sin(rad) * s;
  const tx = layer.x;
  const ty = layer.y;
  ctx.setTransform(cos, sin, -sin, cos, tx, ty);
  ctx.translate(-BASE_SIZE / 2, -BASE_SIZE / 2);
  const fill = layer.colorIndex >= 0 ? palette[layer.colorIndex] || '#ffffff' : layer.customColor || '#ffffff';
  const path = getLayerPath2D(layer.type);
  ctx.fillStyle = fill;
  ctx.fill(path);
  if (selected) {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const b = getLayerBounds(layer);
    ctx.strokeStyle = 'rgba(100,150,255,0.9)';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 4]);
    ctx.strokeRect(b.x - 2, b.y - 2, b.w + 4, b.h + 4);
    ctx.setLineDash([]);
  }
  ctx.restore();
}

export function renderThumbnail(layer: Layer, palette: string[], size: number = 30): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.save();
  const s = (size / BASE_SIZE) * (layer.scale / 100);
  const rad = (layer.rotation * Math.PI) / 180;
  const cos = Math.cos(rad) * s;
  const sin = Math.sin(rad) * s;
  ctx.setTransform(cos, sin, -sin, cos, size / 2, size / 2);
  ctx.translate(-BASE_SIZE / 2, -BASE_SIZE / 2);
  const fill = layer.colorIndex >= 0 ? palette[layer.colorIndex] || '#ffffff' : layer.customColor || '#ffffff';
  ctx.fillStyle = fill;
  ctx.fill(getLayerPath2D(layer.type));
  ctx.restore();
  return canvas;
}

const PATH_CACHE: Partial<Record<ShapeType, Path2D>> = {};

export function getLayerPath2D(type: ShapeType): Path2D {
  if (!PATH_CACHE[type]) {
    PATH_CACHE[type] = new Path2D(SHAPE_PATHS[type]);
  }
  return PATH_CACHE[type]!;
}

export function getLayerBounds(layer: Layer): { x: number; y: number; w: number; h: number } {
  const s = layer.scale / 100;
  const w = BASE_SIZE * s;
  const h = BASE_SIZE * s;
  const rad = (layer.rotation * Math.PI) / 180;
  const cx = layer.x;
  const cy = layer.y;
  const hw = w / 2;
  const hh = h / 2;
  const corners = [
    { x: -hw, y: -hh },
    { x: hw, y: -hh },
    { x: hw, y: hh },
    { x: -hw, y: hh }
  ];
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  const cos = Math.cos(rad), sin = Math.sin(rad);
  for (let i = 0; i < 4; i++) {
    const rx = corners[i].x * cos - corners[i].y * sin + cx;
    const ry = corners[i].x * sin + corners[i].y * cos + cy;
    if (rx < minX) minX = rx;
    if (ry < minY) minY = ry;
    if (rx > maxX) maxX = rx;
    if (ry > maxY) maxY = ry;
  }
  return { x: minX, y: minY, w: maxX - minX, h: maxY - minY };
}


