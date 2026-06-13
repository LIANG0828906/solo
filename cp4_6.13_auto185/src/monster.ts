import { Point, CELL_SIZE, Room, GameMap, GRID_COLS, GRID_ROWS } from './map';
import { distance } from './tower';

export type MonsterType = 'zombie' | 'ghost' | 'golem';

export interface MonsterConfig {
  hp: number;
  speed: number;
  damage: number;
  goldDrop: number;
  color: string;
  radius: number;
  canBreakWalls: boolean;
}

export interface Monster {
  id: number;
  type: MonsterType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  damage: number;
  goldDrop: number;
  color: string;
  radius: number;
  path: Point[];
  pathIndex: number;
  slowTimer: number;
  slowFactor: number;
  canBreakWalls: boolean;
  pathRecalcTimer: number;
}

export const MONSTER_CONFIGS: Record<MonsterType, MonsterConfig> = {
  zombie: {
    hp: 80,
    speed: 1,
    damage: 1,
    goldDrop: 10,
    color: '#e74c3c',
    radius: 10,
    canBreakWalls: false
  },
  ghost: {
    hp: 30,
    speed: 2.5,
    damage: 0.5,
    goldDrop: 5,
    color: '#9b59b6',
    radius: 8,
    canBreakWalls: false
  },
  golem: {
    hp: 200,
    speed: 0.8,
    damage: 3,
    goldDrop: 30,
    color: '#34495e',
    radius: 14,
    canBreakWalls: true
  }
};

export const MAX_MONSTERS_PER_ROOM = 30;

let nextMonsterId = 1;

export function createMonster(
  type: MonsterType,
  gridX: number,
  gridY: number
): Monster {
  const cfg = MONSTER_CONFIGS[type];
  return {
    id: nextMonsterId++,
    type,
    x: gridX * CELL_SIZE + CELL_SIZE / 2,
    y: gridY * CELL_SIZE + CELL_SIZE / 2,
    hp: cfg.hp,
    maxHp: cfg.hp,
    speed: cfg.speed,
    damage: cfg.damage,
    goldDrop: cfg.goldDrop,
    color: cfg.color,
    radius: cfg.radius,
    path: [],
    pathIndex: 0,
    slowTimer: 0,
    slowFactor: 1,
    canBreakWalls: cfg.canBreakWalls,
    pathRecalcTimer: 0
  };
}

export function getMonsterGridPos(monster: Monster): Point {
  return {
    x: Math.floor(monster.x / CELL_SIZE),
    y: Math.floor(monster.y / CELL_SIZE)
  };
}

export function recalculatePath(
  monster: Monster,
  targetGrid: Point,
  room: Room,
  map: GameMap
): void {
  const start = getMonsterGridPos(monster);
  monster.path = map.findPath(start, targetGrid, room);
  if (monster.path.length === 0 && monster.canBreakWalls) {
    monster.path = findPathBreakWalls(start, targetGrid, room);
  }
  monster.pathIndex = 0;
  monster.pathRecalcTimer = 0;
}

function findPathBreakWalls(start: Point, end: Point, room: Room): Point[] {
  if (start.x === end.x && start.y === end.y) return [start];
  const visited = new Set<string>();
  const queue: { point: Point; path: Point[] }[] = [];
  queue.push({ point: start, path: [start] });
  visited.add(`${start.x},${start.y}`);
  const dirs = [
    { x: 0, y: -1 }, { x: 1, y: 0 },
    { x: 0, y: 1 }, { x: -1, y: 0 }
  ];
  while (queue.length > 0) {
    const current = queue.shift()!;
    for (const dir of dirs) {
      const nx = current.point.x + dir.x;
      const ny = current.point.y + dir.y;
      if (nx < 0 || nx >= GRID_COLS || ny < 0 || ny >= GRID_ROWS) continue;
      const key = `${nx},${ny}`;
      if (visited.has(key)) continue;
      visited.add(key);
      const newPath = [...current.path, { x: nx, y: ny }];
      if (nx === end.x && ny === end.y) return newPath;
      queue.push({ point: { x: nx, y: ny }, path: newPath });
    }
  }
  return [];
}

export function updateMonster(
  monster: Monster,
  dt: number,
  targetGrid: Point,
  targetPixel: Point,
  room: Room,
  map: GameMap,
  playerDamageCallback: (dmg: number) => void,
  breakWallCallback: (gx: number, gy: number) => void
): void {
  if (monster.slowTimer > 0) {
    monster.slowTimer -= dt;
    if (monster.slowTimer <= 0) monster.slowFactor = 1;
  }

  monster.pathRecalcTimer -= dt;
  if (monster.pathRecalcTimer <= 0 || monster.path.length === 0) {
    recalculatePath(monster, targetGrid, room, map);
    monster.pathRecalcTimer = 0.8 + Math.random() * 0.4;
  }

  const distToPlayer = distance(monster.x, monster.y, targetPixel.x, targetPixel.y);
  if (distToPlayer < CELL_SIZE * 0.6) {
    playerDamageCallback(monster.damage);
    monster.hp = 0;
    return;
  }

  if (monster.path.length === 0 || monster.pathIndex >= monster.path.length) {
    const dx = targetPixel.x - monster.x;
    const dy = targetPixel.y - monster.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      const speed = monster.speed * CELL_SIZE * monster.slowFactor;
      monster.x += (dx / len) * speed * dt;
      monster.y += (dy / len) * speed * dt;
    }
    return;
  }

  const nextNode = monster.path[monster.pathIndex];
  const targetX = nextNode.x * CELL_SIZE + CELL_SIZE / 2;
  const targetY = nextNode.y * CELL_SIZE + CELL_SIZE / 2;
  const dx = targetX - monster.x;
  const dy = targetY - monster.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const speed = monster.speed * CELL_SIZE * monster.slowFactor;
  const moveAmount = speed * dt;

  if (monster.canBreakWalls) {
    const gx = nextNode.x;
    const gy = nextNode.y;
    if (room.walls[gy] && room.walls[gy][gx]) {
      breakWallCallback(gx, gy);
    }
  }

  if (dist <= moveAmount) {
    monster.x = targetX;
    monster.y = targetY;
    monster.pathIndex++;
  } else {
    monster.x += (dx / dist) * moveAmount;
    monster.y += (dy / dist) * moveAmount;
  }
}

export function applyDamage(monster: Monster, damage: number): boolean {
  monster.hp -= damage;
  return monster.hp <= 0;
}

export function applySlow(monster: Monster, factor: number, duration: number): void {
  monster.slowFactor = Math.min(monster.slowFactor, factor);
  monster.slowTimer = Math.max(monster.slowTimer, duration);
}

export function pickMonsterType(roomIndex: number): MonsterType {
  const roll = Math.random();
  const difficulty = Math.min(1, roomIndex / 15);
  if (roll < 0.5 - difficulty * 0.2) return 'zombie';
  if (roll < 0.85 - difficulty * 0.1) return 'ghost';
  return 'golem';
}
