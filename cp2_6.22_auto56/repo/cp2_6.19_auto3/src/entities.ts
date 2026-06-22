import { MapData, isWalkable, TileType } from './mapGen';

export type Direction = 'up' | 'down' | 'left' | 'right';

function easeOutQuad(t: number): number {
  return 1 - (1 - t) * (1 - t);
}

export abstract class Entity {
  gridX: number;
  gridY: number;
  renderX: number;
  renderY: number;
  fromX: number;
  fromY: number;
  targetX: number;
  targetY: number;
  isMoving: boolean;
  moveProgress: number;
  speed: number;
  facing: Direction;

  constructor(x: number, y: number, speed: number = 6) {
    this.gridX = x;
    this.gridY = y;
    this.renderX = x;
    this.renderY = y;
    this.fromX = x;
    this.fromY = y;
    this.targetX = x;
    this.targetY = y;
    this.isMoving = false;
    this.moveProgress = 0;
    this.speed = speed;
    this.facing = 'down';
  }

  startMove(dx: number, dy: number, map: MapData): boolean {
    if (this.isMoving) return false;
    const nx = this.gridX + dx;
    const ny = this.gridY + dy;
    if (!isWalkable(map, nx, ny)) return false;

    if (dx > 0) this.facing = 'right';
    else if (dx < 0) this.facing = 'left';
    else if (dy > 0) this.facing = 'down';
    else if (dy < 0) this.facing = 'up';

    this.fromX = this.gridX;
    this.fromY = this.gridY;
    this.targetX = nx;
    this.targetY = ny;
    this.isMoving = true;
    this.moveProgress = 0;
    return true;
  }

  update(dt: number): void {
    if (this.isMoving) {
      this.moveProgress += dt * this.speed;
      if (this.moveProgress >= 1) {
        this.moveProgress = 1;
        this.gridX = this.targetX;
        this.gridY = this.targetY;
        this.renderX = this.targetX;
        this.renderY = this.targetY;
        this.isMoving = false;
      } else {
        const t = easeOutQuad(this.moveProgress);
        this.renderX = this.fromX + (this.targetX - this.fromX) * t;
        this.renderY = this.fromY + (this.targetY - this.fromY) * t;
      }
    } else {
      this.renderX = this.gridX;
      this.renderY = this.gridY;
    }
  }

  checkCollision(other: Entity): boolean {
    const dx = Math.abs(this.renderX - other.renderX);
    const dy = Math.abs(this.renderY - other.renderY);
    return dx < 0.6 && dy < 0.6;
  }
}

export class Player extends Entity {
  constructor(x: number, y: number) {
    super(x, y, 6);
  }
}

export class Monster extends Entity {
  patrolPath: { x: number; y: number }[];
  patrolIndex: number;
  isChasing: boolean;
  moveCooldown: number;

  constructor(x: number, y: number) {
    super(x, y, 3.5);
    this.patrolPath = [{ x, y }];
    this.patrolIndex = 0;
    this.isChasing = false;
    this.moveCooldown = 0;
  }

  setPatrolPath(path: { x: number; y: number }[]): void {
    if (path.length > 0) {
      this.patrolPath = path;
      this.patrolIndex = 0;
    }
  }

  private chebyshevDist(ax: number, ay: number, bx: number, by: number): number {
    return Math.max(Math.abs(ax - bx), Math.abs(ay - by));
  }

  private manhattanDist(ax: number, ay: number, bx: number, by: number): number {
    return Math.abs(ax - bx) + Math.abs(ay - by);
  }

  updateAI(dt: number, map: MapData, player: Player): void {
    this.update(dt);

    if (this.moveCooldown > 0) {
      this.moveCooldown -= dt;
      return;
    }

    if (this.isMoving) return;

    const distToPlayer = this.chebyshevDist(this.gridX, this.gridY, player.gridX, player.gridY);
    if (distToPlayer <= 3) {
      this.isChasing = true;
      this.chasePlayer(map, player);
    } else {
      this.isChasing = false;
      this.patrol(map);
    }
  }

  private chasePlayer(map: MapData, player: Player): void {
    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    let bestDir = dirs[0];
    let bestDist = Infinity;

    for (const dir of dirs) {
      const nx = this.gridX + dir.dx;
      const ny = this.gridY + dir.dy;
      if (isWalkable(map, nx, ny)) {
        const d = this.manhattanDist(nx, ny, player.gridX, player.gridY);
        if (d < bestDist) {
          bestDist = d;
          bestDir = dir;
        }
      }
    }

    if (this.startMove(bestDir.dx, bestDir.dy, map)) {
      this.moveCooldown = 0.15;
    } else {
      this.moveCooldown = 0.3;
    }
  }

  private patrol(map: MapData): void {
    if (this.patrolPath.length === 0) {
      this.moveCooldown = 0.5;
      return;
    }

    const target = this.patrolPath[this.patrolIndex];
    if (this.gridX === target.x && this.gridY === target.y) {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
      this.moveCooldown = 0.4;
      return;
    }

    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    let bestDir = dirs[0];
    let bestDist = Infinity;

    for (const dir of dirs) {
      const nx = this.gridX + dir.dx;
      const ny = this.gridY + dir.dy;
      if (isWalkable(map, nx, ny)) {
        const d = this.manhattanDist(nx, ny, target.x, target.y);
        if (d < bestDist) {
          bestDist = d;
          bestDir = dir;
        }
      }
    }

    if (this.startMove(bestDir.dx, bestDir.dy, map)) {
      this.moveCooldown = 0.3;
    } else {
      this.patrolIndex = (this.patrolIndex + 1) % this.patrolPath.length;
      this.moveCooldown = 0.5;
    }
  }

  static generatePatrolPath(
    map: MapData,
    startX: number,
    startY: number,
    length: number = 4
  ): { x: number; y: number }[] {
    const path: { x: number; y: number }[] = [{ x: startX, y: startY }];
    let cx = startX;
    let cy = startY;
    const visited = new Set<string>();
    visited.add(`${cx},${cy}`);

    const dirs = [
      { dx: 1, dy: 0 },
      { dx: -1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: 0, dy: -1 },
    ];

    for (let i = 0; i < length; i++) {
      const shuffled = [...dirs].sort(() => Math.random() - 0.5);
      let moved = false;
      for (const dir of shuffled) {
        const nx = cx + dir.dx * 2;
        const ny = cy + dir.dy * 2;
        const key = `${nx},${ny}`;
        if (isWalkable(map, nx, ny) && !visited.has(key)) {
          path.push({ x: nx, y: ny });
          visited.add(key);
          cx = nx;
          cy = ny;
          moved = true;
          break;
        }
      }
      if (!moved) break;
    }

    return path;
  }
}

export interface CollectedGem {
  x: number;
  y: number;
}

export function tryCollectGem(
  map: MapData,
  player: Player,
  collected: Set<string>
): CollectedGem | null {
  if (player.isMoving) return null;
  const tile = map.grid[player.gridY][player.gridX];
  const key = `${player.gridX},${player.gridY}`;
  if (tile === TileType.GEM && !collected.has(key)) {
    collected.add(key);
    return { x: player.gridX, y: player.gridY };
  }
  return null;
}
