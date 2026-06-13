import type { MazeState, WallSide } from './mazeGenerator';

export interface Ripple {
  x: number;
  y: number;
  startTime: number;
  duration: number;
  maxRadius: number;
  color: string;
}

export interface WallAnimKey {
  cellX: number;
  cellY: number;
  side: WallSide;
}

export interface WallAnimState {
  key: string;
  startTime: number;
  duration: number;
  from: number;
  to: number;
}

export const WALL_ANIM_DURATION = 200;
export const RIPPLE_DURATION = 500;

export function wallKey(cellX: number, cellY: number, side: WallSide): string {
  return `${cellX},${cellY},${side}`;
}

export interface RenderContext {
  canvasWidth: number;
  canvasHeight: number;
  cellSize: number;
  offsetX: number;
  offsetY: number;
  maze: MazeState;
  path: Array<{ x: number; y: number }>;
  explored: Array<{ x: number; y: number }>;
  ripples: Ripple[];
  wallAnims: Map<string, WallAnimState>;
  hoveredWall: { cellX: number; cellY: number; side: WallSide } | null;
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3);
}

function getWallAnimOpacity(
  anims: Map<string, WallAnimState>,
  key: string,
  now: number,
  base: number
): number {
  const anim = anims.get(key);
  if (!anim) return base;
  const t = Math.min(1, (now - anim.startTime) / anim.duration);
  const eased = easeOutCubic(t);
  return anim.from + (anim.to - anim.from) * eased;
}

export function computeLayout(
  canvasWidth: number,
  canvasHeight: number,
  maze: MazeState,
  padding: number = 32
): { cellSize: number; offsetX: number; offsetY: number } {
  const availW = canvasWidth - padding * 2;
  const availH = canvasHeight - padding * 2;
  const cellSize = Math.max(
    12,
    Math.floor(Math.min(availW / maze.width, availH / maze.height))
  );
  const mazeW = cellSize * maze.width;
  const mazeH = cellSize * maze.height;
  const offsetX = Math.floor((canvasWidth - mazeW) / 2);
  const offsetY = Math.floor((canvasHeight - mazeH) / 2);
  return { cellSize, offsetX, offsetY };
}

export function drawBackground(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number
): void {
  const cx = w / 2 + Math.sin(t * 0.00008) * 40;
  const cy = h / 2 + Math.cos(t * 0.0001) * 30;
  const r = Math.max(w, h) * 0.8;

  const hueShift = Math.sin(t * 0.00005) * 6;
  const color1 = `rgb(${10 + hueShift}, ${14 + hueShift * 0.8}, ${39 + hueShift * 0.5})`;
  const color2 = `rgb(${16 - hueShift * 0.5}, ${8 + hueShift * 0.3}, ${36 - hueShift * 0.4})`;
  const color3 = '#05030e';

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, color1);
  grad.addColorStop(0.6, color2);
  grad.addColorStop(1, color3);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.04;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 60; i++) {
    const seed = i * 97.37;
    const px = ((Math.sin(seed) * 0.5 + 0.5) * w + t * 0.002 * ((i % 3) + 1)) % w;
    const py = ((Math.cos(seed * 1.7) * 0.5 + 0.5) * h + t * 0.0015 * ((i % 4) + 1)) % h;
    const size = 1 + (i % 3);
    ctx.fillRect(px, py, size, size);
  }
  ctx.restore();
}

function cellCenter(
  x: number,
  y: number,
  cellSize: number,
  offsetX: number,
  offsetY: number
): { cx: number; cy: number } {
  return {
    cx: offsetX + x * cellSize + cellSize / 2,
    cy: offsetY + y * cellSize + cellSize / 2
  };
}

export function drawStartEndMarkers(
  ctx: CanvasRenderingContext2D,
  maze: MazeState,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  t: number
): void {
  const { cx: sx, cy: sy } = cellCenter(maze.start.x, maze.start.y, cellSize, offsetX, offsetY);
  const { cx: ex, cy: ey } = cellCenter(maze.end.x, maze.end.y, cellSize, offsetX, offsetY);

  const pulse = 0.5 + Math.sin(t * 0.004) * 0.5;
  const r = Math.max(4, cellSize * 0.22);

  ctx.save();
  ctx.shadowBlur = 18 + pulse * 10;
  ctx.shadowColor = 'rgba(0, 255, 180, 0.85)';
  ctx.fillStyle = `rgba(0, 255, 180, ${0.65 + pulse * 0.25})`;
  ctx.beginPath();
  ctx.arc(sx, sy, r + pulse * 2, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 18 + pulse * 10;
  ctx.shadowColor = 'rgba(255, 90, 160, 0.85)';
  ctx.fillStyle = `rgba(255, 90, 160, ${0.65 + pulse * 0.25})`;
  ctx.beginPath();
  ctx.arc(ex, ey, r + pulse * 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.font = `bold ${Math.max(10, Math.floor(cellSize * 0.35))}px Orbitron, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.fillText('S', sx, sy);
  ctx.fillText('E', ex, ey);
  ctx.restore();
}

export function drawWalls(
  ctx: CanvasRenderingContext2D,
  maze: MazeState,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  wallAnims: Map<string, WallAnimState>,
  hoveredWall: { cellX: number; cellY: number; side: WallSide } | null,
  t: number
): void {
  const drawnWalls = new Set<string>();
  const thickness = Math.max(2, Math.min(4, Math.floor(cellSize / 8)));

  const glowPulse = 0.7 + Math.sin(t * 0.002) * 0.3;

  for (let y = 0; y < maze.height; y++) {
    for (let x = 0; x < maze.width; x++) {
      const cell = maze.grid[y][x];
      const sides: WallSide[] = ['top', 'right', 'bottom', 'left'];
      for (const side of sides) {
        const k = wallKey(x, y, side);
        if (drawnWalls.has(k)) continue;

        const hasWall = cell.walls[side];
        const opacity = getWallAnimOpacity(wallAnims, k, t, hasWall ? 1 : 0);
        if (opacity <= 0.01) continue;

        let x1 = 0, y1 = 0, x2 = 0, y2 = 0;
        const off = cell.wallOffsets[side];

        switch (side) {
          case 'top':
            x1 = offsetX + x * cellSize;
            y1 = offsetY + y * cellSize + off;
            x2 = offsetX + (x + 1) * cellSize;
            y2 = y1;
            break;
          case 'bottom':
            x1 = offsetX + x * cellSize;
            y1 = offsetY + (y + 1) * cellSize + off;
            x2 = offsetX + (x + 1) * cellSize;
            y2 = y1;
            break;
          case 'left':
            x1 = offsetX + x * cellSize + off;
            y1 = offsetY + y * cellSize;
            x2 = x1;
            y2 = offsetY + (y + 1) * cellSize;
            break;
          case 'right':
            x1 = offsetX + (x + 1) * cellSize + off;
            y1 = offsetY + y * cellSize;
            x2 = x1;
            y2 = offsetY + (y + 1) * cellSize;
            break;
        }

        drawnWalls.add(k);
        const opposites: Record<WallSide, WallSide> = {
          top: 'bottom', bottom: 'top', left: 'right', right: 'left'
        };
        const deltas: Record<WallSide, { dx: number; dy: number }> = {
          top: { dx: 0, dy: -1 }, right: { dx: 1, dy: 0 },
          bottom: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }
        };
        const d = deltas[side];
        drawnWalls.add(wallKey(x + d.dx, y + d.dy, opposites[side]));

        const isHovered =
          hoveredWall !== null &&
          hoveredWall.cellX === x &&
          hoveredWall.cellY === y &&
          hoveredWall.side === side;

        ctx.save();
        ctx.globalAlpha = opacity;
        ctx.lineCap = 'round';
        ctx.lineWidth = thickness;

        ctx.shadowBlur = (10 + thickness * 2) * glowPulse;
        ctx.shadowColor = isHovered
          ? 'rgba(180, 220, 255, 0.95)'
          : 'rgba(220, 230, 255, 0.55)';

        const baseColor1 = isHovered ? '#e8f0ff' : '#c8cfdf';
        const baseColor2 = isHovered ? '#a8c0ff' : '#8a93a8';
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, baseColor1);
        grad.addColorStop(0.5, '#d8dfee');
        grad.addColorStop(1, baseColor2);
        ctx.strokeStyle = grad;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = opacity * 0.6;
        ctx.lineWidth = Math.max(1, thickness * 0.35);
        ctx.strokeStyle = 'rgba(255,255,255,0.8)';
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
      }
    }
  }
}

export function drawExplored(
  ctx: CanvasRenderingContext2D,
  explored: Array<{ x: number; y: number }>,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  t: number
): void {
  if (explored.length === 0) return;

  const total = explored.length;
  const flicker = 0.55 + Math.sin(t * 0.004 * Math.PI * 2) * 0.35;
  const phase = (t * 0.0008) % 1;

  for (let i = 0; i < total; i++) {
    const p = explored[i];
    const orderRatio = i / total;
    const wavePhase = (orderRatio + phase) % 1;
    const waveAlpha = 0.15 + Math.sin(wavePhase * Math.PI * 2) * 0.1 + 0.1;
    const alpha = (0.12 + waveAlpha * 0.9) * flicker;

    const px = offsetX + p.x * cellSize + cellSize * 0.12;
    const py = offsetY + p.y * cellSize + cellSize * 0.12;
    const pw = cellSize * 0.76;
    const ph = cellSize * 0.76;
    const r = Math.min(pw, ph) * 0.22;

    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(
      px + pw / 2, py + ph / 2, 0,
      px + pw / 2, py + ph / 2, Math.max(pw, ph) / 2
    );
    grad.addColorStop(0, 'rgba(110, 190, 255, 0.95)');
    grad.addColorStop(0.6, 'rgba(70, 150, 255, 0.55)');
    grad.addColorStop(1, 'rgba(40, 110, 220, 0)');
    ctx.fillStyle = grad;

    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.lineTo(px + pw - r, py);
    ctx.quadraticCurveTo(px + pw, py, px + pw, py + r);
    ctx.lineTo(px + pw, py + ph - r);
    ctx.quadraticCurveTo(px + pw, py + ph, px + pw - r, py + ph);
    ctx.lineTo(px + r, py + ph);
    ctx.quadraticCurveTo(px, py + ph, px, py + ph - r);
    ctx.lineTo(px, py + r);
    ctx.quadraticCurveTo(px, py, px + r, py);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}

export function drawPath(
  ctx: CanvasRenderingContext2D,
  path: Array<{ x: number; y: number }>,
  cellSize: number,
  offsetX: number,
  offsetY: number,
  t: number
): void {
  if (path.length < 2) return;

  const pts = path.map((p) => ({
    x: offsetX + p.x * cellSize + cellSize / 2,
    y: offsetY + p.y * cellSize + cellSize / 2
  }));

  const lineWidth = Math.max(3, Math.floor(cellSize * 0.22));

  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.shadowBlur = lineWidth * 3.5;
  ctx.shadowColor = 'rgba(255, 180, 40, 0.75)';
  ctx.lineWidth = lineWidth;

  for (let layer = 0; layer < 2; layer++) {
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }

    let totalLen = 0;
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i].x - pts[i - 1].x;
      const dy = pts[i].y - pts[i - 1].y;
      totalLen += Math.sqrt(dx * dx + dy * dy);
    }

    const flowOffset = (t * 0.0004) % 1;
    const grad = ctx.createLinearGradient(
      pts[0].x, pts[0].y,
      pts[pts.length - 1].x, pts[pts.length - 1].y
    );

    const hueShift = Math.sin(t * 0.0015) * 20;
    const stops = 6;
    for (let i = 0; i <= stops; i++) {
      let pos = (i / stops + flowOffset) % 1;
      if (i === stops) pos = 1;
      const hue = 40 + Math.sin(pos * Math.PI * 4 + t * 0.002) * 18 + hueShift * 0.2;
      const light = 52 + Math.sin(pos * Math.PI * 2 + t * 0.003) * 14;
      const alpha = layer === 0 ? 0.95 : 0.35;
      grad.addColorStop(pos, `hsla(${hue}, 100%, ${light}%, ${alpha})`);
    }
    ctx.strokeStyle = grad;
    ctx.globalAlpha = layer