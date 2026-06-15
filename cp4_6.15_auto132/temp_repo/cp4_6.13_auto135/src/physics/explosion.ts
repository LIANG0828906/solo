import type { BombType, Position, Obstacle, Bomb, Shockwave, Debris } from '../../shared/types';
import { v4 as uuidv4 } from 'uuid';

export const GRID_SIZE = 30;
export const SHOCKWAVE_DURATION = 600;
export const DEBRIS_LIFETIME = 1500;
export const GRAVITY = 0.3;
export const MAX_DEBRIS = 200;
export const DELAYED_BOMB_TIME = 5000;
export const DIRECTIONAL_ANGLE = Math.PI / 3;

export function calculateExplosionRadius(bombType: BombType): number {
  const radiusMap: Record<BombType, number> = {
    basic: 3,
    delayed: 5,
    directional: 4,
  };
  return radiusMap[bombType] * GRID_SIZE;
}

export function getBombColor(type: BombType): string {
  const colorMap: Record<BombType, string> = {
    basic: '#ff6b35',
    delayed: '#ffd93d',
    directional: '#00d4ff',
  };
  return colorMap[type];
}

export function getBombName(type: BombType): string {
  const nameMap: Record<BombType, string> = {
    basic: '基础炸弹',
    delayed: '延时炸弹',
    directional: '定向炸弹',
  };
  return nameMap[type];
}

export function getBombDescription(type: BombType): string {
  const descMap: Record<BombType, string> = {
    basic: '爆炸半径3格，威力中等，可引爆相邻炸弹',
    delayed: '5秒后爆炸，半径5格，威力大，可被提前引爆',
    directional: '扇形60°扩散，半径4格，可穿透1个障碍物',
  };
  return descMap[type];
}

export function isPointInExplosion(
  point: Position,
  explosionPos: Position,
  bombType: BombType,
  direction?: number,
  currentRadius?: number
): boolean {
  const maxRadius = currentRadius ?? calculateExplosionRadius(bombType);
  const dx = point.x - explosionPos.x;
  const dy = point.y - explosionPos.y;
  const distance = Math.sqrt(dx * dx + dy * dy);

  if (distance > maxRadius) {
    return false;
  }

  if (bombType === 'directional' && direction !== undefined) {
    const pointAngle = Math.atan2(dy, dx);
    let angleDiff = pointAngle - direction;
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
    return Math.abs(angleDiff) <= DIRECTIONAL_ANGLE / 2;
  }

  return true;
}

function pointInRect(px: number, py: number, rx: number, ry: number, rw: number, rh: number): boolean {
  return px >= rx && px <= rx + rw && py >= ry && py <= ry + rh;
}

function lineIntersectsRect(
  x1: number, y1: number, x2: number, y2: number,
  rx: number, ry: number, rw: number, rh: number
): boolean {
  if (pointInRect(x1, y1, rx, ry, rw, rh) || pointInRect(x2, y2, rx, ry, rw, rh)) {
    return true;
  }
  const edges = [
    [rx, ry, rx + rw, ry],
    [rx + rw, ry, rx + rw, ry + rh],
    [rx + rw, ry + rh, rx, ry + rh],
    [rx, ry + rh, rx, ry],
  ];
  for (const [ex1, ey1, ex2, ey2] of edges) {
    const denom = (y2 - y1) * (ex2 - ex1) - (x2 - x1) * (ey2 - ey1);
    if (denom === 0) continue;
    const ua = ((x2 - x1) * (ey1 - y1) - (y2 - y1) * (ex1 - x1)) / denom;
    const ub = ((ex2 - ex1) * (ey1 - y1) - (ey2 - ey1) * (ex1 - x1)) / denom;
    if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
      return true;
    }
  }
  return false;
}

export function checkLineOfSight(
  from: Position,
  to: Position,
  obstacles: Obstacle[],
  maxPenetration: number
): { blocked: boolean; penetrated: number } {
  let penetrated = 0;
  for (const obs of obstacles) {
    if (lineIntersectsRect(from.x, from.y, to.x, to.y, obs.position.x, obs.position.y, obs.width, obs.height)) {
      penetrated++;
      if (penetrated > maxPenetration) {
        return { blocked: true, penetrated };
      }
    }
  }
  return { blocked: false, penetrated };
}

function circleIntersectsRect(cx: number, cy: number, cr: number, rx: number, ry: number, rw: number, rh: number): boolean {
  const closestX = Math.max(rx, Math.min(cx, rx + rw));
  const closestY = Math.max(ry, Math.min(cy, ry + rh));
  const dx = cx - closestX;
  const dy = cy - closestY;
  return dx * dx + dy * dy <= cr * cr;
}

export function calculateChainReaction(
  initialBombId: string,
  bombs: Bomb[],
  obstacles: Obstacle[]
): { triggeredBombs: Bomb[]; hitObstacles: string[] } {
  const triggeredBombs: Bomb[] = [];
  const hitObstaclesSet = new Set<string>();
  const triggeredIds = new Set<string>();
  const queue: Bomb[] = [];

  const initialBomb = bombs.find(b => b.id === initialBombId);
  if (!initialBomb) return { triggeredBombs: [], hitObstacles: [] };

  queue.push(initialBomb);
  triggeredIds.add(initialBombId);

  while (queue.length > 0) {
    const currentBomb = queue.shift()!;
    triggeredBombs.push(currentBomb);

    const maxRadius = calculateExplosionRadius(currentBomb.type);
    const maxPenetration = currentBomb.type === 'directional' ? 1 : 0;

    for (const obs of obstacles) {
      if (circleIntersectsRect(currentBomb.position.x, currentBomb.position.y, maxRadius, obs.position.x, obs.position.y, obs.width, obs.height)) {
        if (currentBomb.type === 'directional') {
          if (isPointInExplosion(
            { x: obs.position.x + obs.width / 2, y: obs.position.y + obs.height / 2 },
            currentBomb.position,
            currentBomb.type,
            currentBomb.direction,
            maxRadius
          )) {
            hitObstaclesSet.add(obs.id);
          }
        } else {
          hitObstaclesSet.add(obs.id);
        }
      }
    }

    for (const otherBomb of bombs) {
      if (triggeredIds.has(otherBomb.id)) continue;

      const dist = Math.sqrt(
        Math.pow(otherBomb.position.x - currentBomb.position.x, 2) +
        Math.pow(otherBomb.position.y - currentBomb.position.y, 2)
      );

      if (dist <= maxRadius) {
        if (!isPointInExplosion(
          otherBomb.position,
          currentBomb.position,
          currentBomb.type,
          currentBomb.direction,
          maxRadius
        )) {
          continue;
        }

        const { blocked } = checkLineOfSight(
          currentBomb.position,
          otherBomb.position,
          obstacles,
          maxPenetration
        );

        if (!blocked) {
          triggeredIds.add(otherBomb.id);
          queue.push(otherBomb);
        }
      }
    }
  }

  return {
    triggeredBombs,
    hitObstacles: Array.from(hitObstaclesSet),
  };
}

export function createShockwave(bomb: Bomb): Shockwave {
  return {
    id: uuidv4(),
    position: { ...bomb.position },
    radius: 0,
    maxRadius: calculateExplosionRadius(bomb.type),
    startTime: Date.now(),
    duration: SHOCKWAVE_DURATION,
    bombType: bomb.type,
    direction: bomb.direction,
    penetrated: 0,
  };
}

function lerpColor(color1: string, color2: string, t: number): string {
  const c1 = hexToRgb(color1);
  const c2 = hexToRgb(color2);
  const r = Math.round(c1.r + (c2.r - c1.r) * t);
  const g = Math.round(c1.g + (c2.g - c1.g) * t);
  const b = Math.round(c1.b + (c2.b - c1.b) * t);
  return `rgb(${r},${g},${b})`;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 200, b: 0 };
}

export function createDebris(position: Position, count: number): Debris[] {
  const debris: Debris[] = [];
  const actualCount = Math.min(count, MAX_DEBRIS);
  const numDebris = 30 + Math.floor(Math.random() * 21);

  for (let i = 0; i < Math.min(numDebris, actualCount); i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;
    const colorT = Math.random();
    debris.push({
      id: uuidv4(),
      position: { ...position },
      velocity: {
        x: Math.cos(angle) * speed,
        y: Math.sin(angle) * speed,
      },
      size: 2 + Math.random() * 4,
      color: lerpColor('#ffd93d', '#ff6b35', colorT),
      createdAt: Date.now(),
      lifetime: DEBRIS_LIFETIME,
    });
  }

  return debris;
}

export function updateDebris(debrisList: Debris[], deltaTime: number): Debris[] {
  const now = Date.now();
  return debrisList
    .map(d => {
      const dt = deltaTime / 16.67;
      return {
        ...d,
        position: {
          x: d.position.x + d.velocity.x * dt,
          y: d.position.y + d.velocity.y * dt,
        },
        velocity: {
          x: d.velocity.x * 0.99,
          y: d.velocity.y + GRAVITY * dt,
        },
      };
    })
    .filter(d => now - d.createdAt < d.lifetime);
}

export function updateShockwave(shockwave: Shockwave, currentTime: number): boolean {
  const elapsed = currentTime - shockwave.startTime;
  const progress = Math.min(elapsed / shockwave.duration, 1);
  shockwave.radius = shockwave.maxRadius * progress;
  return progress >= 1;
}

export function isPositionValid(position: Position, obstacles: Obstacle[], _gridSize: number): boolean {
  for (const obs of obstacles) {
    if (pointInRect(position.x, position.y, obs.position.x, obs.position.y, obs.width, obs.height)) {
      return false;
    }
  }
  return true;
}

export function calculateScore(triggeredBombs: Bomb[], hitObstacles: string[]): number {
  return triggeredBombs.length * 10 + hitObstacles.length * 2;
}

export function generateObstacles(canvasWidth: number, canvasHeight: number, count: number): Obstacle[] {
  const obstacles: Obstacle[] = [];
  const margin = 60;

  for (let i = 0; i < count; i++) {
    let attempts = 0;
    while (attempts < 50) {
      const width = (2 + Math.floor(Math.random() * 3)) * GRID_SIZE;
      const height = GRID_SIZE;
      const x = margin + Math.random() * (canvasWidth - margin * 2 - width);
      const y = margin + Math.random() * (canvasHeight - margin * 2 - height);

      const newObs: Obstacle = {
        id: uuidv4(),
        position: { x, y },
        width,
        height,
        hitByExplosion: false,
      };

      let overlaps = false;
      for (const existing of obstacles) {
        if (
          x < existing.position.x + existing.width + GRID_SIZE &&
          x + width + GRID_SIZE > existing.position.x &&
          y < existing.position.y + existing.height + GRID_SIZE &&
          y + height + GRID_SIZE > existing.position.y
        ) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        obstacles.push(newObs);
        break;
      }
      attempts++;
    }
  }

  return obstacles;
}
