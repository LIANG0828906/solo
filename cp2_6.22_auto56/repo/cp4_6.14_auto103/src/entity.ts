import { TILE, type TileType } from './mapGenerator';

export type MonsterType = 'slime' | 'bat' | 'skeleton';

export interface MonsterConfig {
  type: MonsterType;
  symbol: string;
  color: string;
  hp: number;
  attack: number;
  expReward: number;
  name: string;
}

export const MONSTER_CONFIGS: Record<MonsterType, MonsterConfig> = {
  slime: {
    type: 'slime',
    symbol: 'S',
    color: '#a78bfa',
    hp: 5,
    attack: 1,
    expReward: 10,
    name: '史莱姆',
  },
  bat: {
    type: 'bat',
    symbol: 'B',
    color: '#fbbf24',
    hp: 3,
    attack: 2,
    expReward: 15,
    name: '蝙蝠',
  },
  skeleton: {
    type: 'skeleton',
    symbol: 'K',
    color: '#94a3b8',
    hp: 8,
    attack: 3,
    expReward: 25,
    name: '骷髅',
  },
};

export interface TrailPoint {
  x: number;
  y: number;
  alpha: number;
}

export interface Player {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  moveProgress: number;
  isMoving: boolean;
  targetX: number;
  targetY: number;
  hp: number;
  maxHp: number;
  attack: number;
  mp: number;
  maxMp: number;
  level: number;
  exp: number;
  expToNext: number;
  gold: number;
  trail: TrailPoint[];
}

export interface Monster {
  id: number;
  type: MonsterType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attack: number;
  expReward: number;
  symbol: string;
  color: string;
  name: string;
}

let monsterIdCounter = 0;

export function createPlayer(startX: number, startY: number): Player {
  return {
    x: startX,
    y: startY,
    prevX: startX,
    prevY: startY,
    moveProgress: 1,
    isMoving: false,
    targetX: startX,
    targetY: startY,
    hp: 10,
    maxHp: 10,
    attack: 2,
    mp: 5,
    maxMp: 5,
    level: 1,
    exp: 25,
    expToNext: 100,
    gold: 120,
    trail: [],
  };
}

export function createMonster(
  type: MonsterType,
  x: number,
  y: number
): Monster {
  const cfg = MONSTER_CONFIGS[type];
  return {
    id: monsterIdCounter++,
    type,
    x,
    y,
    hp: cfg.hp,
    maxHp: cfg.hp,
    attack: cfg.attack,
    expReward: cfg.expReward,
    symbol: cfg.symbol,
    color: cfg.color,
    name: cfg.name,
  };
}

export function isWalkable(
  tiles: TileType[][],
  x: number,
  y: number
): boolean {
  if (y < 0 || y >= tiles.length) return false;
  if (x < 0 || x >= tiles[0].length) return false;
  const t = tiles[y][x];
  return t === TILE.FLOOR || t === TILE.CORRIDOR;
}

export function startPlayerMove(
  player: Player,
  tiles: TileType[][],
  dx: number,
  dy: number,
  monsters: Monster[]
): boolean {
  if (player.isMoving) return false;

  const nx = player.x + dx;
  const ny = player.y + dy;

  if (!isWalkable(tiles, nx, ny)) return false;

  for (const m of monsters) {
    if (m.x === nx && m.y === ny) return false;
  }

  player.trail.unshift({ x: player.x, y: player.y, alpha: 0.33 });
  if (player.trail.length > 5) {
    player.trail.pop();
  }

  player.prevX = player.x;
  player.prevY = player.y;
  player.targetX = nx;
  player.targetY = ny;
  player.isMoving = true;
  player.moveProgress = 0;

  return true;
}

export function updatePlayerMovement(player: Player, dt: number): void {
  if (!player.isMoving) return;

  const MOVE_DURATION = 0.2;
  player.moveProgress += dt / MOVE_DURATION;

  if (player.moveProgress >= 1) {
    player.moveProgress = 1;
    player.x = player.targetX;
    player.y = player.targetY;
    player.prevX = player.x;
    player.prevY = player.y;
    player.isMoving = false;
  }

  for (let i = 0; i < player.trail.length; i++) {
    player.trail[i].alpha -= dt / MOVE_DURATION * 0.33;
    if (player.trail[i].alpha < 0) player.trail[i].alpha = 0;
  }
  player.trail = player.trail.filter((t) => t.alpha > 0);
}

export function getPlayerRenderPos(player: Player): { x: number; y: number } {
  if (!player.isMoving) {
    return { x: player.x, y: player.y };
  }
  const t = player.moveProgress;
  return {
    x: player.prevX + (player.targetX - player.prevX) * t,
    y: player.prevY + (player.targetY - player.prevY) * t,
  };
}

function isPositionOccupied(
  x: number,
  y: number,
  monsters: Monster[],
  excludeId?: number
): boolean {
  for (const m of monsters) {
    if (m.id !== excludeId && m.x === x && m.y === y) return true;
  }
  return false;
}

function manhattan(
  ax: number,
  ay: number,
  bx: number,
  by: number
): number {
  return Math.abs(ax - bx) + Math.abs(ay - by);
}

export function moveMonsterAI(
  monster: Monster,
  player: Player,
  tiles: TileType[][],
  monsters: Monster[]
): void {
  if (player.isMoving) return;

  const dist = manhattan(monster.x, monster.y, player.x, player.y);
  const isAdjacent = dist === 1;
  const CHASE_RANGE = 5;
  const shouldChase = dist <= CHASE_RANGE && monster.hp > player.hp;

  const dirs = [
    { dx: 1, dy: 0 },
    { dx: -1, dy: 0 },
    { dx: 0, dy: 1 },
    { dx: 0, dy: -1 },
  ];

  let chosenDir: { dx: number; dy: number } | null = null;

  if (isAdjacent) {
    return;
  }

  if (shouldChase) {
    const best: { dx: number; dy: number }[] = [];
    let bestDist = Infinity;
    for (const d of dirs) {
      const nx = monster.x + d.dx;
      const ny = monster.y + d.dy;
      if (
        isWalkable(tiles, nx, ny) &&
        !isPositionOccupied(nx, ny, monsters, monster.id) &&
        !(nx === player.x && ny === player.y)
      ) {
        const nd = manhattan(nx, ny, player.x, player.y);
        if (nd < bestDist) {
          bestDist = nd;
          best.length = 0;
          best.push(d);
        } else if (nd === bestDist) {
          best.push(d);
        }
      }
    }
    if (best.length > 0 && bestDist < dist) {
      chosenDir = best[Math.floor(Math.random() * best.length)];
    }
  }

  if (!chosenDir) {
    const valid: { dx: number; dy: number }[] = [];
    for (const d of dirs) {
      const nx = monster.x + d.dx;
      const ny = monster.y + d.dy;
      if (
        isWalkable(tiles, nx, ny) &&
        !isPositionOccupied(nx, ny, monsters, monster.id) &&
        !(nx === player.x && ny === player.y)
      ) {
        valid.push(d);
      }
    }
    if (valid.length > 0) {
      chosenDir = valid[Math.floor(Math.random() * valid.length)];
    }
  }

  if (chosenDir) {
    monster.x += chosenDir.dx;
    monster.y += chosenDir.dy;
  }
}

export function checkAdjacentForBattle(
  player: Player,
  monsters: Monster[]
): Monster | null {
  for (const m of monsters) {
    const dist = manhattan(player.x, player.y, m.x, m.y);
    if (dist === 1) return m;
  }
  return null;
}

export function addExp(player: Player, amount: number): void {
  player.exp += amount;
  while (player.exp >= player.expToNext) {
    player.exp -= player.expToNext;
    player.level += 1;
    player.expToNext = Math.floor(player.expToNext * 1.5);
    player.maxHp += 2;
    player.hp = player.maxHp;
    player.maxMp += 1;
    player.mp = player.maxMp;
    player.attack += 1;
  }
}
