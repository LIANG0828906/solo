import { PathPoint } from './SampleApi';

const MIN_DISTANCE = 8;
const MAX_IMAGE_SIZE = 1200;
const BLACK_THRESHOLD = 128;

interface ParseResult {
  paths: PathPoint[][];
  originalImage: HTMLCanvasElement;
}

export async function parseSketch(file: File): Promise<ParseResult> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('文件大小不能超过5MB');
  }

  const img = await loadImage(file);
  const { canvas, ctx } = createScaledCanvas(img);
  
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const paths = extractPaths(imageData, canvas.width, canvas.height);
  
  return {
    paths,
    originalImage: canvas
  };
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

function createScaledCanvas(img: HTMLImageElement): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  let width = img.width;
  let height = img.height;
  
  if (width > MAX_IMAGE_SIZE || height > MAX_IMAGE_SIZE) {
    const ratio = Math.min(MAX_IMAGE_SIZE / width, MAX_IMAGE_SIZE / height);
    width = Math.floor(width * ratio);
    height = Math.floor(height * ratio);
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  
  return { canvas, ctx };
}

function extractPaths(imageData: ImageData, width: number, height: number): PathPoint[][] {
  const data = imageData.data;
  const visited = new Set<number>();
  const paths: PathPoint[][] = [];
  
  function getIndex(x: number, y: number): number {
    return y * width + x;
  }
  
  function isBlack(x: number, y: number): boolean {
    if (x < 0 || x >= width || y < 0 || y >= height) return false;
    const idx = getIndex(x, y) * 4;
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const brightness = (r + g + b) / 3;
    return brightness < BLACK_THRESHOLD;
  }
  
  function getNeighbors(x: number, y: number): { x: number; y: number }[] {
    const neighbors: { x: number; y: number }[] = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx;
        const ny = y + dy;
        if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
          neighbors.push({ x: nx, y: ny });
        }
      }
    }
    return neighbors;
  }
  
  function tracePath(startX: number, startY: number): PathPoint[] {
    const path: PathPoint[] = [];
    let x = startX;
    let y = startY;
    let lastPoint: PathPoint | null = null;
    
    while (true) {
      const idx = getIndex(x, y);
      if (visited.has(idx)) break;
      visited.add(idx);
      
      const currentPoint = { x, y };
      if (!lastPoint || Math.hypot(lastPoint.x - x, lastPoint.y - y) >= MIN_DISTANCE) {
        path.push(currentPoint);
        lastPoint = currentPoint;
      }
      
      const neighbors = getNeighbors(x, y);
      let nextPixel: { x: number; y: number } | null = null;
      
      for (const n of neighbors) {
        const nIdx = getIndex(n.x, n.y);
        if (!visited.has(nIdx) && isBlack(n.x, n.y)) {
          nextPixel = n;
          break;
        }
      }
      
      if (!nextPixel) break;
      
      x = nextPixel.x;
      y = nextPixel.y;
    }
    
    return path;
  }
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = getIndex(x, y);
      if (!visited.has(idx) && isBlack(x, y)) {
        const path = tracePath(x, y);
        if (path.length >= 5) {
          paths.push(path);
        }
      }
    }
  }
  
  return paths;
}

export function extractPathSegment(
  originalCanvas: HTMLCanvasElement,
  path: PathPoint[],
  padding: number = 10
): HTMLCanvasElement {
  if (path.length === 0) {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 50;
    return canvas;
  }
  
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  
  for (const p of path) {
    minX = Math.min(minX, p.x);
    maxX = Math.max(maxX, p.x);
    minY = Math.min(minY, p.y);
    maxY = Math.max(maxY, p.y);
  }
  
  minX = Math.max(0, minX - padding);
  maxX = Math.min(originalCanvas.width, maxX + padding);
  minY = Math.max(0, minY - padding);
  maxY = Math.min(originalCanvas.height, maxY + padding);
  
  const segWidth = Math.max(1, maxX - minX);
  const segHeight = Math.max(1, maxY - minY);
  
  const canvas = document.createElement('canvas');
  canvas.width = segWidth;
  canvas.height = segHeight;
  const ctx = canvas.getContext('2d')!;
  
  ctx.fillStyle = '#0A0A14';
  ctx.fillRect(0, 0, segWidth, segHeight);
  
  ctx.drawImage(
    originalCanvas,
    minX, minY, segWidth, segHeight,
    0, 0, segWidth, segHeight
  );
  
  ctx.strokeStyle = '#4D96FF';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let i = 0; i < path.length; i++) {
    const p = path[i];
    const sx = p.x - minX;
    const sy = p.y - minY;
    if (i === 0) {
      ctx.moveTo(sx, sy);
    } else {
      ctx.lineTo(sx, sy);
    }
  }
  ctx.stroke();
  
  return canvas;
}

export function calculatePathLength(path: PathPoint[]): number {
  let length = 0;
  for (let i = 1; i < path.length; i++) {
    length += Math.hypot(
      path[i].x - path[i - 1].x,
      path[i].y - path[i - 1].y
    );
  }
  return length;
}
