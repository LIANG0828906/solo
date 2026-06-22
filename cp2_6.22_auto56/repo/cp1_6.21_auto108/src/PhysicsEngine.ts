import type { Projectile, Position, Wind, GridCell, Player } from './types/game';
import {
  GRAVITY,
  PROJECTILE_SPEED,
  WIND_FACTOR,
  TRAIL_LENGTH,
  CELL_SIZE,
  MAP_WIDTH,
  MAP_HEIGHT,
  TRUCK_WIDTH,
  TRUCK_HEIGHT,
  BOUNCE_DAMPING,
  MIN_DAMAGE,
  MAX_DAMAGE,
} from './utils/constants';

export interface CollisionResult {
  type: 'truck' | 'dune' | 'ore' | 'boundary';
  targetId?: number;
  x: number;
  y: number;
  normal?: { x: number; y: number };
}

let projectileIdCounter = 0;

export function createProjectile(
  startX: number,
  startY: number,
  angle: number,
  ownerId: number,
  isPlayer1: boolean
): Projectile {
  const angleRad = (angle * Math.PI) / 180;
  const speed = PROJECTILE_SPEED;
  const vx = isPlayer1 ? Math.cos(angleRad) * speed : -Math.cos(angleRad) * speed;
  const vy = -Math.sin(angleRad) * speed;

  return {
    id: ++projectileIdCounter,
    x: startX,
    y: startY,
    vx,
    vy,
    ownerId,
    trail: [],
    active: true,
  };
}

export function updateProjectile(
  projectile: Projectile,
  wind: Wind,
  map: GridCell[][],
  players: Player[]
): { projectile: Projectile; collision: CollisionResult | null } {
  const windAngleRad = (wind.angle * Math.PI) / 180;
  const windX = Math.cos(windAngleRad) * wind.strength * WIND_FACTOR;

  const newVx = projectile.vx + windX;
  const newVy = projectile.vy + GRAVITY;

  const newX = projectile.x + newVx;
  const newY = projectile.y + newVy;

  const newTrail = [...projectile.trail, { x: newX, y: newY }];
  if (newTrail.length > TRAIL_LENGTH) {
    newTrail.shift();
  }

  const updatedProjectile: Projectile = {
    ...projectile,
    x: newX,
    y: newY,
    vx: newVx,
    vy: newVy,
    trail: newTrail,
  };

  const collision = checkCollision(updatedProjectile, map, players);

  return {
    projectile: updatedProjectile,
    collision,
  };
}

export function checkCollision(
  projectile: Projectile,
  map: GridCell[][],
  players: Player[]
): CollisionResult | null {
  if (projectile.x < 0 || projectile.x > MAP_WIDTH || projectile.y < 0 || projectile.y > MAP_HEIGHT) {
    return {
      type: 'boundary',
      x: projectile.x,
      y: projectile.y,
    };
  }

  for (const player of players) {
    if (checkTruckCollision(projectile, player)) {
      return {
        type: 'truck',
        targetId: player.id,
        x: projectile.x,
        y: projectile.y,
      };
    }
  }

  const gridX = Math.floor(projectile.x / CELL_SIZE);
  const gridY = Math.floor(projectile.y / CELL_SIZE);

  if (gridY >= 0 && gridY < map.length && gridX >= 0 && gridX < map[0].length) {
    const cell = map[gridY][gridX];
    if (cell.terrain === 'dune') {
      return {
        type: 'dune',
        x: projectile.x,
        y: projectile.y,
        normal: { x: 0, y: -1 },
      };
    }
    if (cell.terrain === 'ore') {
      return {
        type: 'ore',
        x: projectile.x,
        y: projectile.y,
      };
    }
  }

  return null;
}

function checkTruckCollision(projectile: Projectile, player: Player): boolean {
  const truckLeft = player.position.x - TRUCK_WIDTH / 2;
  const truckRight = player.position.x + TRUCK_WIDTH / 2;
  const truckTop = player.position.y - TRUCK_HEIGHT / 2;
  const truckBottom = player.position.y + TRUCK_HEIGHT / 2;

  return (
    projectile.x >= truckLeft &&
    projectile.x <= truckRight &&
    projectile.y >= truckTop &&
    projectile.y <= truckBottom
  );
}

export function calculateBounceVelocity(
  vx: number,
  vy: number,
  normal: { x: number; y: number }
): { vx: number; vy: number } {
  const dot = vx * normal.x + vy * normal.y;
  const reflectVx = vx - 2 * dot * normal.x;
  const reflectVy = vy - 2 * dot * normal.y;

  return {
    vx: reflectVx * BOUNCE_DAMPING,
    vy: reflectVy * BOUNCE_DAMPING,
  };
}

export function calculateDamage(): number {
  return Math.floor(Math.random() * (MAX_DAMAGE - MIN_DAMAGE + 1)) + MIN_DAMAGE;
}
