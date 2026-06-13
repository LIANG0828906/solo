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
export const EXPLORED_BLINK_PERIOD_MS = 500;

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

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

function getWallAnimOpacity(
  anims: Map<string, WallAnimState>,
  key: string,
  now: number,
  base: number
): number {
  const anim = anims.get(key);
  if (!anim) return base;
  const t = clamp((now - anim.startTime) / anim.duration, 0, 1);
  const eased = easeOutCubic(t);
  return anim.from + (anim.to - anim.from) * eased;
}

export function computeLayout(
  canvasWidth: number,
  canvasHeight: number,
  maze: MazeState,
  padding: number = 32
): { cellSize: number; offsetX: number; offsetY: number } {
  const availW = Math.max(100, canvasWidth - padding * 2);
  const availH = Math.max(100, canvasHeight - padding * 2);
  const cellSize = Math.max(
    14,
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
  const r = Math.max(w, h) * 0.85;

  const hueShift = Math.sin(t * 0.00005) * 6;
  const color1 = `rgb(${10 + hueShift}, ${14 + hueShift * 0.8}, ${39 + hueShift * 0.5})`;
  const color2 = `rgb(${22 - hueShift * 0.3}, ${10 + hueShift * 0.4}, ${46 - hueShift * 0.4})`;
  const color3 = '#060313';

  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, color1);
  grad.addColorStop(0.58, color2);
  grad.addColorStop(1, color3);

  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.fillStyle = '#ffffff';
  for (let i = 0; i < 70; i++) {
    const seed = i * 97.37;
    const px = ((Math.sin(seed) * 0.5 + 0.5) * w + t * 0.002 * ((i % 3) + 1)) % w;
    const py = ((Math.cos(seed * 1.7) * 0.5 + 0.5) * h + t * 0.0015 * ((i % 4) + 1)) % h;
    const size = 1 + (i % 3);
    ctx.fillRect(px, py, size, size);
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.025;
  const vignette = ctx.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.3, w / 2, h / 2, Math.max(w, h) * 0.7);
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, 'rgba(0,0,0,1)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, w, h);
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
  const r = Math.max(5, cellSize * 0.24);

  ctx.save();

  ctx.shadowBlur = 22 + pulse * 12;
  ctx.shadowColor = 'rgba(0, 255, 180, 0.9)';
  ctx.fillStyle = `rgba(0, 255, 180, ${0.7 + pulse * 0.25})`;
  ctx.beginPath();
  ctx.arc(sx, sy, r + pulse * 2.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.shadowBlur = 22 + pulse * 12;
  ctx.shadowColor = 'rgba(255, 90, 160, 0.9)';
  ctx.fillStyle = `rgba(255, 90, 160, ${0.7 + pulse * 0.25})`;
  ctx.beginPath();
  ctx.arc(ex, ey, r + pulse * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.font = `bold ${Math.max(11, Math.floor(cellSize * 0.38))}px Orbitron, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = 'rgba(255,255,255,0.98)';
  ctx.shadowBlur = 6;
  ctx.shadowColor = 'rgba(0,0,0,0.6)';
  ctx.fillText('S', sx, sy + 1);
  ctx.fillText('E', ex, ey + 1);
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
  const thickness = Math.max(2, Math.min(5, Math.floor(cellSize / 7.5)));

  const glowPulse = 0.65 + Math.sin(t * 0.002) * 0.35;

  const opposites: Record<WallSide, WallSide> = {
    top: 'bottom', bottom: 'top', left: 'right', right: 'left'
  };
  const deltas: Record<WallSide, { dx: number; dy: number }> = {
    top: { dx: 0, dy: -1 }, right: { dx: 1, dy: 0 },
    bottom: { dx: 0, dy: 1 }, left: { dx: -1, dy: 0 }
  };

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

        ctx.shadowBlur = (10 + thickness * 2.2) * glowPulse;
        ctx.shadowColor = isHovered
          ? 'rgba(180, 220, 255, 0.95)'
          : 'rgba(210, 225, 255, 0.55)';

        const baseColor1 = isHovered ? '#eef4ff' : '#cdd5e6';
        const baseColor2 = isHovered ? '#b4ccff' : '#8f99b0';
        const grad = ctx.createLinearGradient(x1, y1, x2, y2);
        grad.addColorStop(0, baseColor1);
        grad.addColorStop(0.5, '#dde3f2');
        grad.addColorStop(1, baseColor2);
        ctx.strokeStyle = grad;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.globalAlpha = opacity * 0.55;
        ctx.lineWidth = Math.max(1, thickness * 0.32);
        ctx.strokeStyle = 'rgba(255,255,255,0.78)';
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
  const omega = (2 * Math.PI) / EXPLORED_BLINK_PERIOD_MS;
  const blinkBase = 0.55 + Math.sin(t * omega) * 0.45;
  const phase = (t * 0.0007) % 1;

  for (let i = 0; i < total; i++) {
    const p = explored[i];
    const orderRatio = i / total;
    const wavePhase = (orderRatio + phase) % 1;
    const waveA = 0.18 + Math.sin(wavePhase * Math.PI * 2) * 0.12 + 0.1;
    const alpha = (0.14 + waveA * 0.8) * blinkBase;

    const pad = cellSize * 0.14;
    const px = offsetX + p.x * cellSize + pad;
    const py = offsetY + p.y * cellSize + pad;
    const pw = cellSize - pad * 2;
    const ph = cellSize - pad * 2;
    const r = Math.min(pw, ph) * 0.28;

    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(
      px + pw / 2, py + ph / 2, 0,
      px + pw / 2, py + ph / 2, Math.max(pw, ph) / 2
    );
    grad.addColorStop(0, 'rgba(120, 200, 255, 0.95)');
    grad.addColorStop(0.55, 'rgba(75, 160, 255, 0.55)');
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

  let totalLen = 0;
  const segLens: number[] = [];
  for (let i = 1; i < pts.length; i++) {
    const dx = pts[i].x - pts[i - 1].x;
    const dy = pts[i].y - pts[i - 1].y;
    const l = Math.sqrt(dx * dx + dy * dy);
    segLens.push(l);
    totalLen += l;
  }
  if (totalLen < 1) return;

  const lineWidth = Math.max(3, Math.floor(cellSize * 0.22));

  function pointAt(dist: number): { x: number; y: number } {
    let d = Math.max(0, Math.min(totalLen, dist));
    for (let i = 0; i < segLens.length; i++) {
      if (d <= segLens[i]) {
        const ratio = segLens[i] === 0 ? 0 : d / segLens[i];
        return {
          x: pts[i].x + (pts[i + 1].x - pts[i].x) * ratio,
          y: pts[i].y + (pts[i + 1].y - pts[i].y) * ratio
        };
      }
      d -= segLens[i];
    }
    return pts[pts.length - 1];
  }

  const flowSpeed = totalLen * 0.00035;
  const flowOffset = (t * flowSpeed) % totalLen;
  const hueGlobalShift = Math.sin(t * 0.0013) * 18;

  for (let layer = 0; layer < 2; layer++) {
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = layer === 0 ? lineWidth : lineWidth * 0.5;

    const baseShadow = layer === 0 ? lineWidth * 4 : lineWidth * 1.5;
    ctx.shadowBlur = baseShadow + Math.sin(t * 0.003) * 2;
    ctx.shadowColor = layer === 0 ? 'rgba(255, 180, 40, 0.8)' : 'rgba(255, 220, 120, 0.6)';

    const grad = ctx.createLinearGradient(
      pts[0].x, pts[0].y,
      pts[pts.length - 1].x, pts[pts.length - 1].y
    );

    const stops = 8;
    for (let i = 0; i <= stops; i++) {
      const distRatio = i / stops;
      const dist = (distRatio * totalLen + flowOffset) % totalLen;
      const pp = pointAt(dist);
      const pathRatio = dist / totalLen;

      const wave = Math.sin(pathRatio * Math.PI * 6 + t * 0.0025) * 14;
      const hue = 42 + wave + hueGlobalShift * 0.2;
      const light = 54 + Math.sin(pathRatio * Math.PI * 3 + t * 0.004) * 13;
      const alpha = layer === 0 ? 0.95 : 0.42;

      const pos = i === stops ? 1 : ((distRatio + flowOffset / totalLen) % 1);
      grad.addColorStop(pos, `hsla(${clamp(hue, 25, 65)}, 100%, ${clamp(light, 38, 72)}%, ${alpha})`);
      void pp;
    }
    ctx.strokeStyle = grad;
    ctx.globalAlpha = layer === 0 ? 1 : 0.75;

    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) {
      ctx.lineTo(pts[i].x, pts[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  ctx.save();
  const dotDist = flowOffset;
  const dot = pointAt(dotDist);
  const glowR = lineWidth * 1.3 + Math.sin(t * 0.008) * 1.2;
  const dotGrad = ctx.createRadialGradient(dot.x, dot.y, 0, dot.x, dot.y, glowR * 2.5);
  dotGrad.addColorStop(0, 'rgba(255, 255, 220, 1)');
  dotGrad.addColorStop(0.35, 'rgba(255, 210, 80, 0.9)');
  dotGrad.addColorStop(1, 'rgba(255, 170, 30, 0)');
  ctx.fillStyle = dotGrad;
  ctx.beginPath();
  ctx.arc(dot.x, dot.y, glowR * 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

export function drawRipples(
  ctx: CanvasRenderingContext2D,
  ripples: Ripple[],
  t: number
): Ripple[] {
  const alive: Ripple[] = [];
  for (const r of ripples) {
    const age = t - r.startTime;
    if (age >= r.duration) continue;
    const progress = age / r.duration;
    const eased = easeOutCubic(progress);
    const radius = 4 + eased * r.maxRadius;
    const alpha = (1 - eased) * 0.75;

    ctx.save();
    ctx.strokeStyle = r.color;
    ctx.globalAlpha = alpha;
    ctx.lineWidth = Math.max(1.5, 3.5 * (1 - eased));
    ctx.shadowBlur = 14;
    ctx.shadowColor = r.color;
    ctx.beginPath();
    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.globalAlpha = alpha * 0.35;
    ctx.lineWidth = Math.max(1, 2 * (1 - eased));
    ctx.beginPath();
    ctx.arc(r.x, r.y, radius * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    alive.push(r);
  }
  return alive;
}

export function render(
  ctx: CanvasRenderingContext2D,
  rc: RenderContext,
  t: number
): Ripple[] {
  const { canvasWidth: w, canvasHeight: h } = rc;
  drawBackground(ctx, w, h, t);
  drawExplored(ctx, rc.explored, rc.cellSize, rc.offsetX, rc.offsetY, t);
  drawPath(ctx, rc.path, rc.cellSize, rc.offsetX, rc.offsetY, t);
  drawWalls(ctx, rc.maze, rc.cellSize, rc.offsetX, rc.offsetY, rc.wallAnims, rc.hoveredWall, t);
  drawStartEndMarkers(ctx, rc.maze, rc.cellSize, rc.offsetX, rc.offsetY, t);
  return drawRipples(ctx, rc.ripples, t);
}
