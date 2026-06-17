import { Tile, TileType, TILE_SIZE, MAP_WIDTH, MAP_HEIGHT } from '../data/worldData';

export interface Enemy {
  id: string;
  x: number;
  y: number;
  health: number;
  maxHealth: number;
  targetX: number;
  targetY: number;
  speed: number;
  path: { x: number; y: number }[];
  animationFrame: number;
  facing: 'left' | 'right';
  attackCooldown: number;
}

interface PathNode {
  x: number;
  y: number;
  prev: PathNode | null;
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 10);
}

export function createEnemy(x: number, y: number): Enemy {
  return {
    id: generateId(),
    x,
    y,
    health: 40,
    maxHealth: 40,
    targetX: x,
    targetY: y,
    speed: 1.2,
    path: [],
    animationFrame: 0,
    facing: 'right',
    attackCooldown: 0,
  };
}

function bfsPathfind(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  map: Tile[][],
  buildings: Set<string>
): { x: number; y: number }[] {
  if (startX === endX && startY === endY) {
    return [];
  }

  const queue: PathNode[] = [];
  const visited = new Set<string>();
  const startNode: PathNode = { x: startX, y: startY, prev: null };
  queue.push(startNode);
  visited.add(`${startX},${startY}`);

  const directions = [
    { dx: 0, dy: -1 },
    { dx: 0, dy: 1 },
    { dx: -1, dy: 0 },
    { dx: 1, dy: 0 },
  ];

  let foundNode: PathNode | null = null;
  const maxIterations = MAP_WIDTH * MAP_HEIGHT;
  let iterations = 0;

  while (queue.length > 0 && iterations < maxIterations) {
    iterations++;
    const current = queue.shift()!;

    if (current.x === endX && current.y === endY) {
      foundNode = current;
      break;
    }

    for (const dir of directions) {
      const nx = current.x + dir.dx;
      const ny = current.y + dir.dy;
      const key = `${nx},${ny}`;

      if (visited.has(key)) continue;
      if (nx < 0 || nx >= MAP_WIDTH || ny < 0 || ny >= MAP_HEIGHT) continue;

      const tile = map[ny][nx];
      if (tile.type === TileType.ROCK) continue;

      const buildKey = `${nx},${ny}`;
      if (buildings.has(buildKey)) {
        if (nx === endX && ny === endY) {
        } else {
          continue;
        }
      }

      visited.add(key);
      queue.push({ x: nx, y: ny, prev: current });
    }
  }

  if (!foundNode) {
    return [];
  }

  const path: { x: number; y: number }[] = [];
  let node: PathNode | null = foundNode;
  while (node !== null && node.prev !== null) {
    path.unshift({ x: node.x, y: node.y });
    node = node.prev;
  }

  return path;
}

export function updateEnemies(
  enemies: Enemy[],
  playerX: number,
  playerY: number,
  map: Tile[][],
  buildings: { x: number; y: number }[],
  deltaTime: number,
  onPlayerDamage: () => void
): Enemy[] {
  const buildingSet = new Set<string>();
  for (const b of buildings) {
    buildingSet.add(`${b.x},${b.y}`);
  }

  const playerTileX = Math.floor(playerX / TILE_SIZE);
  const playerTileY = Math.floor(playerY / TILE_SIZE);

  return enemies.map((enemy) => {
    const updatedEnemy = { ...enemy };

    if (updatedEnemy.attackCooldown > 0) {
      updatedEnemy.attackCooldown -= deltaTime;
    }

    const distToPlayer = Math.hypot(playerX - updatedEnemy.x, playerY - updatedEnemy.y);

    if (distToPlayer < TILE_SIZE * 0.8) {
      if (updatedEnemy.attackCooldown <= 0) {
        onPlayerDamage();
        updatedEnemy.attackCooldown = 0.5;
      }
      updatedEnemy.facing = playerX < updatedEnemy.x ? 'left' : 'right';
      return updatedEnemy;
    }

    if (distToPlayer < TILE_SIZE * 25) {
      const enemyTileX = Math.floor(updatedEnemy.x / TILE_SIZE);
      const enemyTileY = Math.floor(updatedEnemy.y / TILE_SIZE);

      if (updatedEnemy.path.length === 0 ||
          Math.abs(playerTileX - updatedEnemy.path[updatedEnemy.path.length - 1]?.x) > 2 ||
          Math.abs(playerTileY - updatedEnemy.path[updatedEnemy.path.length - 1]?.y) > 2) {
        updatedEnemy.path = bfsPathfind(enemyTileX, enemyTileY, playerTileX, playerTileY, map, buildingSet);
      }

      if (updatedEnemy.path.length > 0) {
        const nextTile = updatedEnemy.path[0];
        const targetPixelX = nextTile.x * TILE_SIZE + TILE_SIZE / 2;
        const targetPixelY = nextTile.y * TILE_SIZE + TILE_SIZE / 2;

        const dx = targetPixelX - updatedEnemy.x;
        const dy = targetPixelY - updatedEnemy.y;
        const dist = Math.hypot(dx, dy);

        if (dist < 2) {
          updatedEnemy.path.shift();
        } else {
          const moveSpeed = updatedEnemy.speed * TILE_SIZE * deltaTime;
          const ratio = Math.min(moveSpeed / dist, 1);
          updatedEnemy.x += dx * ratio;
          updatedEnemy.y += dy * ratio;
          updatedEnemy.facing = dx < 0 ? 'left' : 'right';

          updatedEnemy.animationFrame += deltaTime * 4;
          if (updatedEnemy.animationFrame >= 2) {
            updatedEnemy.animationFrame = 0;
          }
        }
      } else {
        const dx = playerX - updatedEnemy.x;
        const dy = playerY - updatedEnemy.y;
        const dist = Math.hypot(dx, dy);
        if (dist > 1) {
          const moveSpeed = updatedEnemy.speed * TILE_SIZE * deltaTime;
          const ratio = Math.min(moveSpeed / dist, 1);
          updatedEnemy.x += dx * ratio;
          updatedEnemy.y += dy * ratio;
          updatedEnemy.facing = dx < 0 ? 'left' : 'right';
          updatedEnemy.animationFrame += deltaTime * 4;
          if (updatedEnemy.animationFrame >= 2) {
            updatedEnemy.animationFrame = 0;
          }
        }
      }
    }

    return updatedEnemy;
  }).filter((e) => e.health > 0);
}

export function spawnEnemyNearPlayer(
  playerX: number,
  playerY: number,
  screenWidth: number,
  screenHeight: number,
  map: Tile[][]
): Enemy | null {
  const maxAttempts = 20;

  for (let i = 0; i < maxAttempts; i++) {
    const angle = Math.random() * Math.PI * 2;
    const viewDist = Math.max(screenWidth, screenHeight) / 2;
    const spawnDist = viewDist + TILE_SIZE * (5 + Math.random() * 10);

    const sx = playerX + Math.cos(angle) * spawnDist;
    const sy = playerY + Math.sin(angle) * spawnDist;

    const tileX = Math.floor(sx / TILE_SIZE);
    const tileY = Math.floor(sy / TILE_SIZE);

    if (tileX >= 1 && tileX < MAP_WIDTH - 1 && tileY >= 1 && tileY < MAP_HEIGHT - 1) {
      const tile = map[tileY][tileX];
      if (tile.type !== TileType.ROCK && !tile.occupiedByBuilding) {
        return createEnemy(sx, sy);
      }
    }
  }

  return null;
}
