import { eventBus } from './eventBus';
import { levelData, isWallPixel, CELL_SIZE, COLS, ROWS, CANVAS_W, CANVAS_H } from './levelData';

export interface WaveState {
  x: number;
  y: number;
  dx: number;
  dy: number;
  frequency: number;
  alive: boolean;
  reflectedCount: number;
  trail: { x: number; y: number }[];
  reflectionAnims: { x: number; y: number; startTime: number }[];
  startX: number;
  startY: number;
}

const WAVE_SPEED = 4;
const MAX_REFLECTIONS = 5;
const TRAIL_LENGTH = 5;
const REFLECTION_ANIM_DURATION = 100;

let activeWave: WaveState | null = null;

function createWave(x: number, y: number, dx: number, dy: number, frequency: number): WaveState {
  return {
    x,
    y,
    dx,
    dy,
    frequency,
    alive: true,
    reflectedCount: 0,
    trail: [],
    reflectionAnims: [],
    startX: x,
    startY: y,
  };
}

function normalize(dx: number, dy: number): { dx: number; dy: number } {
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { dx: 0, dy: 0 };
  return { dx: dx / len, dy: dy / len };
}

function findWallCollision(
  x: number,
  y: number,
  dx: number,
  dy: number,
  maxDist: number
): { hitX: number; hitY: number; normalX: number; normalY: number; dist: number } | null {
  const step = 1;
  let px = x;
  let py = y;
  let prevInWall = isWallPixel(px, py);

  for (let d = 0; d < maxDist; d += step) {
    const nx = x + dx * d;
    const ny = y + dy * d;
    const inWall = isWallPixel(nx, ny);

    if (inWall && !prevInWall) {
      let normalX = 0;
      let normalY = 0;
      const gx = Math.floor(nx / CELL_SIZE);
      const gy = Math.floor(ny / CELL_SIZE);
      const cellCX = (gx + 0.5) * CELL_SIZE;
      const cellCY = (gy + 0.5) * CELL_SIZE;
      const diffX = nx - cellCX;
      const diffY = ny - cellCY;

      if (Math.abs(diffX) > Math.abs(diffY)) {
        normalX = diffX > 0 ? 1 : -1;
      } else {
        normalY = diffY > 0 ? 1 : -1;
      }

      return {
        hitX: px,
        hitY: py,
        normalX,
        normalY,
        dist: d,
      };
    }

    px = nx;
    py = ny;
    prevInWall = inWall;
  }

  return null;
}

function reflect(dx: number, dy: number, normalX: number, normalY: number): { dx: number; dy: number } {
  const dot = dx * normalX + dy * normalY;
  return {
    dx: dx - 2 * dot * normalX,
    dy: dy - 2 * dot * normalY,
  };
}

export function fireWave(x: number, y: number, targetX: number, targetY: number, frequency: number): void {
  if (activeWave && activeWave.alive) return;

  const rawDx = targetX - x;
  const rawDy = targetY - y;
  const { dx, dy } = normalize(rawDx, rawDy);

  activeWave = createWave(x, y, dx, dy, frequency);
  eventBus.emit('wave:fire', { x, y, dx, dy, frequency });
}

export function tick(now: number): void {
  if (!activeWave || !activeWave.alive) return;

  activeWave.trail.push({ x: activeWave.x, y: activeWave.y });
  if (activeWave.trail.length > TRAIL_LENGTH) {
    activeWave.trail.shift();
  }

  const nextX = activeWave.x + activeWave.dx * WAVE_SPEED;
  const nextY = activeWave.y + activeWave.dy * WAVE_SPEED;

  if (nextX <= 0 || nextX >= CANVAS_W || nextY <= 0 || nextY >= CANVAS_H) {
    let normalX = 0;
    let normalY = 0;
    if (nextX <= 0) normalX = 1;
    if (nextX >= CANVAS_W) normalX = -1;
    if (nextY <= 0) normalY = 1;
    if (nextY >= CANVAS_H) normalY = -1;

    activeWave.reflectedCount++;
    if (activeWave.reflectedCount > MAX_REFLECTIONS) {
      activeWave.alive = false;
      eventBus.emit('wave:complete', { reflectedCount: activeWave.reflectedCount });
      return;
    }

    const ref = reflect(activeWave.dx, activeWave.dy, normalX, normalY);
    activeWave.dx = ref.dx;
    activeWave.dy = ref.dy;
    activeWave.x = Math.max(1, Math.min(CANVAS_W - 1, nextX));
    activeWave.y = Math.max(1, Math.min(CANVAS_H - 1, nextY));
    activeWave.reflectionAnims.push({ x: activeWave.x, y: activeWave.y, startTime: now });
    eventBus.emit('wave:hit', { x: activeWave.x, y: activeWave.y, dx: activeWave.dx, dy: activeWave.dy, frequency: activeWave.frequency });
    return;
  }

  if (isWallPixel(nextX, nextY)) {
    const hit = findWallCollision(activeWave.x, activeWave.y, activeWave.dx, activeWave.dy, WAVE_SPEED * 2);

    if (hit) {
      activeWave.reflectedCount++;
      if (activeWave.reflectedCount > MAX_REFLECTIONS) {
        activeWave.alive = false;
        eventBus.emit('wave:complete', { reflectedCount: activeWave.reflectedCount });
        return;
      }

      const ref = reflect(activeWave.dx, activeWave.dy, hit.normalX, hit.normalY);
      activeWave.dx = ref.dx;
      activeWave.dy = ref.dy;
      activeWave.x = hit.hitX;
      activeWave.y = hit.hitY;
      activeWave.reflectionAnims.push({ x: hit.hitX, y: hit.hitY, startTime: now });
      eventBus.emit('wave:hit', { x: hit.hitX, y: hit.hitY, dx: activeWave.dx, dy: activeWave.dy, frequency: activeWave.frequency });
    } else {
      activeWave.x = nextX;
      activeWave.y = nextY;
    }
  } else {
    activeWave.x = nextX;
    activeWave.y = nextY;
    eventBus.emit('wave:hit', { x: activeWave.x, y: activeWave.y, dx: activeWave.dx, dy: activeWave.dy, frequency: activeWave.frequency });
  }

  activeWave.reflectionAnims = activeWave.reflectionAnims.filter(
    a => now - a.startTime < REFLECTION_ANIM_DURATION
  );
}

export function getActiveWave(): WaveState | null {
  return activeWave;
}

export function resetWave(): void {
  activeWave = null;
}

export function isWaveActive(): boolean {
  return activeWave !== null && activeWave.alive;
}

export function getWaveColor(frequency: number): string {
  const t = (frequency - 1) / 2;
  const r = Math.round(255 - t * 155);
  const g = Math.round(255 - t * 55);
  const b = Math.round(100 + t * 155);
  return `rgb(${r},${g},${b})`;
}
