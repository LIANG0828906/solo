import * as THREE from 'three';

export interface HeatmapColorStop {
  value: number;
  color: [number, number, number];
}

const DEFAULT_HEATMAP_COLORS: HeatmapColorStop[] = [
  { value: 0, color: [0x1a / 255, 0x23 / 255, 0x7e / 255] },
  { value: 0.2, color: [0x21 / 255, 0x96 / 255, 0xf3 / 255] },
  { value: 0.4, color: [0x66 / 255, 0xbb / 255, 0x6a / 255] },
  { value: 0.6, color: [0xff / 255, 0xeb / 255, 0x3b / 255] },
  { value: 0.8, color: [0xff / 255, 0x70 / 255, 0x43 / 255] },
  { value: 1, color: [0xd3 / 255, 0x2f / 255, 0x2f / 255] },
];

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

function getHeatColor(value: number, stops: HeatmapColorStop[]): [number, number, number] {
  const v = Math.max(0, Math.min(1, value));
  for (let i = 0; i < stops.length - 1; i++) {
    if (v >= stops[i].value && v <= stops[i + 1].value) {
      const localT = (v - stops[i].value) / (stops[i + 1].value - stops[i].value);
      return lerpColor(stops[i].color, stops[i + 1].color, localT);
    }
  }
  return stops[stops.length - 1].color;
}

export function createHeatmapTexture(
  temperatures: number[][],
  minTemp: number,
  maxTemp: number,
  showLabels: boolean = false
): THREE.CanvasTexture {
  const cols = temperatures.length;
  const rows = temperatures[0]?.length ?? 0;
  const cellSize = 60;
  const padding = 40;
  const width = cols * cellSize;
  const height = rows * cellSize;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);

  const range = Math.max(1e-3, maxTemp - minTemp);

  for (let xi = 0; xi < cols; xi++) {
    for (let zi = 0; zi < rows; zi++) {
      const t = temperatures[xi][zi];
      const norm = (t - minTemp) / range;
      const [r, g, b] = getHeatColor(norm, DEFAULT_HEATMAP_COLORS);
      ctx.fillStyle = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
      const px = xi * cellSize;
      const py = zi * cellSize;
      ctx.fillRect(px, py, cellSize + 1, cellSize + 1);

      if (showLabels && (xi % 2 === 0 || zi % 2 === 0)) {
        ctx.fillStyle = 'rgba(255,255,255,0.9)';
        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 3;
        const label = `${t.toFixed(1)}°C`;
        ctx.strokeText(label, px + cellSize / 2, py + cellSize / 2);
        ctx.fillText(label, px + cellSize / 2, py + cellSize / 2);
      }
    }
  }

  ctx.strokeStyle = 'rgba(255,255,255,0.08)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= cols; i++) {
    ctx.beginPath();
    ctx.moveTo(i * cellSize, 0);
    ctx.lineTo(i * cellSize, height);
    ctx.stroke();
  }
  for (let j = 0; j <= rows; j++) {
    ctx.beginPath();
    ctx.moveTo(0, j * cellSize);
    ctx.lineTo(width, j * cellSize);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createWindSliceTexture(
  sliceData: { x: number; z: number; speed: number }[][],
  minSpeed: number,
  maxSpeed: number
): THREE.CanvasTexture {
  const cols = sliceData.length;
  const rows = sliceData[0]?.length ?? 0;
  const cellSize = 60;
  const width = cols * cellSize;
  const height = rows * cellSize;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.clearRect(0, 0, width, height);

  const range = Math.max(1e-3, maxSpeed - minSpeed);

  for (let xi = 0; xi < cols; xi++) {
    for (let zi = 0; zi < rows; zi++) {
      const s = sliceData[xi][zi].speed;
      const norm = (s - minSpeed) / range;
      const [r, g, b] = getHeatColor(norm, DEFAULT_HEATMAP_COLORS);
      ctx.fillStyle = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
      const px = xi * cellSize;
      const py = zi * cellSize;
      ctx.fillRect(px, py, cellSize + 1, cellSize + 1);

      if ((xi + zi) % 3 === 0) {
        ctx.fillStyle = 'rgba(255,255,255,0.95)';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.strokeStyle = 'rgba(0,0,0,0.7)';
        ctx.lineWidth = 3;
        const label = `${s.toFixed(1)}m/s`;
        ctx.strokeText(label, px + cellSize / 2, py + cellSize / 2);
        ctx.fillText(label, px + cellSize / 2, py + cellSize / 2);
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.magFilter = THREE.LinearFilter;
  texture.minFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return texture;
}

export function createLegendTexture(
  minV: number,
  maxV: number,
  unit: string,
  steps: number = 10
): HTMLCanvasElement {
  const w = 200;
  const h = 300;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  const barW = 30;
  const barX = 10;
  const barH = h - 40;
  const barY = 20;

  const stepCount = 60;
  for (let i = 0; i < stepCount; i++) {
    const norm = i / (stepCount - 1);
    const [r, g, b] = getHeatColor(1 - norm, DEFAULT_HEATMAP_COLORS);
    ctx.fillStyle = `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
    const y = barY + (i / stepCount) * barH;
    ctx.fillRect(barX, y, barW, barH / stepCount + 1);
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.8)';
  ctx.lineWidth = 1;
  ctx.strokeRect(barX, barY, barW, barH);

  ctx.fillStyle = '#FFFFFF';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  const labelSteps = 5;
  for (let i = 0; i <= labelSteps; i++) {
    const t = i / labelSteps;
    const y = barY + t * barH;
    const v = maxV - t * (maxV - minV);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`${v.toFixed(1)}${unit}`, barX + barW + 8, y);
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.beginPath();
    ctx.moveTo(barX + barW, y);
    ctx.lineTo(barX + barW + 5, y);
    ctx.stroke();
  }
  return canvas;
}
