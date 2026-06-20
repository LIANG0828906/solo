import {
  GRID_SIZE,
  TILE_SIZE,
  TORCH_RADIUS,
  VISION_RATIO,
  type Position,
  type Tile,
  type Monster,
  type Player,
  type Torch,
  type LightingData
} from '../types';
import { isWalkable, updateMonsterState } from './engine';

function distance(ax: number, ay: number, bx: number, by: number): number {
  const dx = ax - bx;
  const dy = ay - by;
  return Math.sqrt(dx * dx + dy * dy);
}

function tileCenter(x: number, y: number): Position {
  return {
    x: x * TILE_SIZE + TILE_SIZE / 2,
    y: y * TILE_SIZE + TILE_SIZE / 2
  };
}

function getNeighbors(pos: Position): Position[] {
  return [
    { x: pos.x + 1, y: pos.y },
    { x: pos.x - 1, y: pos.y },
    { x: pos.x, y: pos.y + 1 },
    { x: pos.x, y: pos.y - 1 }
  ];
}

function findPath(map: Tile[][], start: Position, end: Position): Position[] {
  if (start.x === end.x && start.y === end.y) return [start];
  
  const visited = new Set<string>();
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
  visited.add(`${start.x},${start.y}`);
  
  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    
    for (const neighbor of getNeighbors(pos)) {
      const key = `${neighbor.x},${neighbor.y}`;
      if (visited.has(key)) continue;
      if (!isWalkable(map, neighbor)) continue;
      
      const newPath = [...path, neighbor];
      if (neighbor.x === end.x && neighbor.y === end.y) {
        return newPath;
      }
      
      visited.add(key);
      queue.push({ pos: neighbor, path: newPath });
    }
  }
  
  return [];
}

function getMonsterVisionRadius(monster: Monster, lighting: LightingData, torches: Torch[], player: Player): number {
  const center = tileCenter(monster.position.x, monster.position.y);
  let maxLightRadius = 0;
  
  for (const torch of torches) {
    const dist = distance(center.x, center.y, torch.position.x, torch.position.y);
    if (dist < torch.radius) {
      maxLightRadius = Math.max(maxLightRadius, torch.radius * VISION_RATIO);
    }
  }
  
  if (player.hasLantern) {
    const playerCenter = tileCenter(player.position.x, player.position.y);
    const dist = distance(center.x, center.y, playerCenter.x, playerCenter.y);
    if (dist < 100) {
      maxLightRadius = Math.max(maxLightRadius, 100 * VISION_RATIO);
    }
  }
  
  const cellLight = lighting.gridLight[monster.position.y]?.[monster.position.x] ?? 0;
  const baseRadius = 60 + cellLight * 120;
  
  return Math.max(baseRadius, maxLightRadius);
}

function canSeePlayer(monster: Monster, player: Player, visionRadius: number): boolean {
  const monsterCenter = tileCenter(monster.position.x, monster.position.y);
  const playerCenter = tileCenter(player.position.x, player.position.y);
  const dist = distance(monsterCenter.x, monsterCenter.y, playerCenter.x, playerCenter.y);
  return dist <= visionRadius;
}

function findNearestTorch(monster: Monster, torches: Torch[], map: Tile[][]): Position | null {
  let best: Position | null = null;
  let bestDist = Infinity;
  const monsterCenter = tileCenter(monster.position.x, monster.position.y);
  
  for (const torch of torches) {
    const tileX = Math.floor(torch.position.x / TILE_SIZE);
    const tileY = Math.floor(torch.position.y / TILE_SIZE);
    const torchPos = { x: tileX, y: tileY };
    
    if (!isWalkable(map, torchPos)) continue;
    
    const path = findPath(map, monster.position, torchPos);
    if (path.length === 0) continue;
    
    if (path.length < bestDist) {
      bestDist = path.length;
      best = torchPos;
    }
  }
  
  return best;
}

function findRandomPatrolTarget(monster: Monster, map: Tile[][]): Position | null {
  const valid: Position[] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (!isWalkable(map, { x, y })) continue;
      const d = Math.abs(x - monster.position.x) + Math.abs(y - monster.position.y);
      if (d >= 2 && d <= 5) {
        valid.push({ x, y });
      }
    }
  }
  if (valid.length === 0) return null;
  return valid[Math.floor(Math.random() * valid.length)];
}

function moveAwayFromPlayer(monster: Monster, player: Player, map: Tile[][], steps: number): Position | null {
  let current = { ...monster.position };
  for (let i = 0; i < steps; i++) {
    const neighbors = getNeighbors(current).filter(n => isWalkable(map, n));
    if (neighbors.length === 0) break;
    
    neighbors.sort((a, b) => {
      const da = Math.abs(a.x - player.position.x) + Math.abs(a.y - player.position.y);
      const db = Math.abs(b.x - player.position.x) + Math.abs(b.y - player.position.y);
      return db - da;
    });
    
    const best = neighbors[0];
    const currentDist = Math.abs(current.x - player.position.x) + Math.abs(current.y - player.position.y);
    const bestDist = Math.abs(best.x - player.position.x) + Math.abs(best.y - player.position.y);
    
    if (bestDist > currentDist) {
      current = best;
    } else {
      break;
    }
  }
  
  if (current.x === monster.position.x && current.y === monster.position.y) {
    return null;
  }
  return current;
}

export function makeMonsterDecision(
  monster: Monster,
  player: Player,
  map: Tile[][],
  torches: Torch[],
  lighting: LightingData
): { nextPosition: Position | null; newState: string } {
  if (!monster.alive) return { nextPosition: null, newState: monster.state };
  
  const visionRadius = getMonsterVisionRadius(monster, lighting, torches, player);
  const canSee = canSeePlayer(monster, player, visionRadius);
  const playerLight = lighting.gridLight[player.position.y]?.[player.position.x] ?? 0;
  
  if (monster.state === 'cooldown') {
    if (monster.cooldownTimer <= 0) {
      updateMonsterState(monster, 'patrolling');
      return { nextPosition: null, newState: 'patrolling' };
    }
    return { nextPosition: null, newState: 'cooldown' };
  }
  
  if (monster.type === 'lightChaser') {
    if (canSee && playerLight > 0.4) {
      updateMonsterState(monster, 'chasing');
      const path = findPath(map, monster.position, player.position);
      if (path.length > 1) {
        return { nextPosition: path[1], newState: 'chasing' };
      }
      return { nextPosition: null, newState: 'chasing' };
    }
    
    if (monster.state === 'chasing' && (!canSee || playerLight <= 0.4)) {
      updateMonsterState(monster, 'retreating');
      const nearestTorch = findNearestTorch(monster, torches, map);
      if (nearestTorch) {
        const path = findPath(map, monster.position, nearestTorch);
        if (path.length > 1) {
          return { nextPosition: path[1], newState: 'retreating' };
        }
      }
      return { nextPosition: null, newState: 'retreating' };
    }
    
    if (monster.state === 'retreating') {
      const cellLight = lighting.gridLight[monster.position.y]?.[monster.position.x] ?? 0;
      if (cellLight > 0.5) {
        updateMonsterState(monster, 'patrolling');
        return { nextPosition: null, newState: 'patrolling' };
      }
      const nearestTorch = findNearestTorch(monster, torches, map);
      if (nearestTorch) {
        const path = findPath(map, monster.position, nearestTorch);
        if (path.length > 1) {
          return { nextPosition: path[1], newState: 'retreating' };
        }
      }
      return { nextPosition: null, newState: 'retreating' };
    }
    
    updateMonsterState(monster, 'patrolling');
    if (!monster.patrolTarget || 
        (monster.patrolTarget.x === monster.position.x && monster.patrolTarget.y === monster.position.y)) {
      monster.patrolTarget = findRandomPatrolTarget(monster, map);
    }
    if (monster.patrolTarget) {
      const path = findPath(map, monster.position, monster.patrolTarget);
      if (path.length > 1) {
        return { nextPosition: path[1], newState: 'patrolling' };
      } else {
        monster.patrolTarget = null;
      }
    }
    return { nextPosition: null, newState: 'patrolling' };
  }
  
  if (monster.type === 'darkChaser') {
    if (canSee && playerLight <= 0.4) {
      updateMonsterState(monster, 'chasing');
      const path = findPath(map, monster.position, player.position);
      if (path.length > 1) {
        return { nextPosition: path[1], newState: 'chasing' };
      }
      return { nextPosition: null, newState: 'chasing' };
    }
    
    if (monster.state === 'chasing' && (!canSee || playerLight > 0.4)) {
      if (playerLight > 0.4) {
        updateMonsterState(monster, 'retreating');
        monster.retreatSteps = 3;
        const away = moveAwayFromPlayer(monster, player, map, 3);
        if (away) {
          const path = findPath(map, monster.position, away);
          if (path.length > 1) {
            return { nextPosition: path[1], newState: 'retreating' };
          }
        }
        monster.cooldownTimer = 3;
        updateMonsterState(monster, 'cooldown');
        return { nextPosition: null, newState: 'cooldown' };
      }
      updateMonsterState(monster, 'patrolling');
      return { nextPosition: null, newState: 'patrolling' };
    }
    
    if (monster.state === 'retreating') {
      const cellLight = lighting.gridLight[monster.position.y]?.[monster.position.x] ?? 0;
      if (cellLight < 0.3 && monster.retreatSteps <= 0) {
        monster.cooldownTimer = 3;
        updateMonsterState(monster, 'cooldown');
        return { nextPosition: null, newState: 'cooldown' };
      }
      monster.retreatSteps -= 1;
      const away = moveAwayFromPlayer(monster, player, map, 1);
      if (away) {
        const path = findPath(map, monster.position, away);
        if (path.length > 1) {
          return { nextPosition: path[1], newState: 'retreating' };
        }
      }
      monster.cooldownTimer = 3;
      updateMonsterState(monster, 'cooldown');
      return { nextPosition: null, newState: 'cooldown' };
    }
    
    updateMonsterState(monster, 'patrolling');
    if (!monster.patrolTarget || 
        (monster.patrolTarget.x === monster.position.x && monster.patrolTarget.y === monster.position.y)) {
      monster.patrolTarget = findRandomPatrolTarget(monster, map);
    }
    if (monster.patrolTarget) {
      const path = findPath(map, monster.position, monster.patrolTarget);
      if (path.length > 1) {
        return { nextPosition: path[1], newState: 'patrolling' };
      } else {
        monster.patrolTarget = null;
      }
    }
    return { nextPosition: null, newState: 'patrolling' };
  }
  
  return { nextPosition: null, newState: monster.state };
}
