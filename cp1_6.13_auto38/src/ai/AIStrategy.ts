import type {
  Position,
  Creature,
  Tile,
  GameState,
  AIDecision,
  SpeciesType
} from '../types';
import {
  MAP_SIZE,
  MAX_PATHFINDING_TIME,
  SKILL_EFFECTS,
  posKey
} from '../types';

interface PathNode {
  position: Position;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

interface PathCacheEntry {
  path: Position[];
  timestamp: number;
  targetKey: string;
}

export class AIStrategy {
  private pathCache: Map<string, PathCacheEntry> = new Map();
  private readonly CACHE_TTL = 2000;
  private readonly CACHE_MAX_SIZE = 100;

  decideAction(creature: Creature, gameState: GameState): AIDecision {
    if (creature.hp <= 0 || creature.isEvolving) {
      return { action: 'explore' };
    }

    const currentTile = gameState.map[creature.position.y]?.[creature.position.x];

    if (currentTile?.hasChest) {
      return { action: 'useChest', targetPosition: creature.position };
    }

    if (currentTile?.hasPortal) {
      return { action: 'usePortal', targetPosition: creature.position };
    }

    const nearbyEnemy = this.findNearbyEnemy(creature, gameState.creatures);
    if (nearbyEnemy) {
      const distance = this.getManhattanDistance(creature.position, nearbyEnemy.position);
      const powerRatio = this.calculatePowerRatio(creature, nearbyEnemy);

      if (distance <= 1) {
        if (this.shouldFight(creature, powerRatio)) {
          return { action: 'attack', targetCreatureId: nearbyEnemy.id, targetPosition: nearbyEnemy.position };
        } else {
          return this.getFleeDecision(creature, nearbyEnemy.position, gameState.map, gameState.creatures);
        }
      }

      if (distance <= this.getAggroRange(creature) && this.shouldEngage(creature, powerRatio)) {
        if (creature.species === 'elf' && distance >= 2) {
          const blinkPosition = this.getBlinkTarget(creature, nearbyEnemy.position, gameState.map, gameState.creatures);
          if (blinkPosition) {
            return { action: 'move', targetPosition: blinkPosition };
          }
        }

        const path = this.findPath(creature.position, nearbyEnemy.position, gameState.map, gameState.creatures, creature.id);
        if (path.length > 1) {
          return { action: 'move', targetPosition: path[1] };
        }
        return { action: 'move', targetPosition: nearbyEnemy.position };
      }

      if (this.shouldFlee(creature, powerRatio)) {
        return this.getFleeDecision(creature, nearbyEnemy.position, gameState.map, gameState.creatures);
      }
    }

    if (gameState.selectedCreatureId === creature.id && gameState.userTarget) {
      const path = this.findPath(creature.position, gameState.userTarget, gameState.map, gameState.creatures, creature.id);
      if (path.length > 1) {
        return { action: 'move', targetPosition: path[1] };
      }
      return { action: 'move', targetPosition: gameState.userTarget };
    }

    return this.getExploreDecision(creature, gameState.map, gameState.creatures);
  }

  private shouldFight(creature: Creature, powerRatio: number): boolean {
    if (creature.species === 'dragon') return powerRatio >= 0.7;
    if (creature.species === 'gargoyle') return powerRatio >= 0.8;
    return powerRatio >= 0.8;
  }

  private shouldEngage(creature: Creature, powerRatio: number): boolean {
    if (creature.species === 'dragon') return powerRatio >= 0.6;
    if (creature.species === 'elf') return powerRatio >= 0.9;
    return powerRatio >= 0.7;
  }

  private shouldFlee(creature: Creature, powerRatio: number): boolean {
    if (creature.species === 'elf') return powerRatio < 0.7;
    if (creature.species === 'dragon') return powerRatio < 0.4;
    return powerRatio < 0.5;
  }

  private getAggroRange(creature: Creature): number {
    if (creature.species === 'dragon') return 4;
    if (creature.species === 'elf') return 3;
    return 3;
  }

  private findNearbyEnemy(creature: Creature, creatures: Creature[]): Creature | null {
    let nearest: Creature | null = null;
    let minDistance = Infinity;

    for (const other of creatures) {
      if (other.id === creature.id || other.hp <= 0) continue;
      if (other.species === creature.species) continue;
      const distance = this.getManhattanDistance(creature.position, other.position);
      if (distance < minDistance && distance <= 5) {
        minDistance = distance;
        nearest = other;
      }
    }

    return nearest;
  }

  calculatePowerRatio(attacker: Creature, defender: Creature): number {
    const attackerPower = attacker.attack * 2 + attacker.defense + attacker.hp * 0.5;
    const defenderPower = defender.attack * 2 + defender.defense + defender.hp * 0.5;
    return defenderPower > 0 ? attackerPower / defenderPower : 10;
  }

  private getFleeDecision(creature: Creature, threatPosition: Position, map: Tile[][], creatures: Creature[]): AIDecision {
    if (creature.species === 'elf') {
      const blinkAway = this.getBlinkAwayTarget(creature, threatPosition, map, creatures);
      if (blinkAway) {
        return { action: 'flee', targetPosition: blinkAway };
      }
    }

    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    let bestPosition: Position | null = null;
    let maxDistance = 0;

    for (const dir of directions) {
      const newPos: Position = {
        x: creature.position.x + dir.x,
        y: creature.position.y + dir.y
      };

      if (!this.isValidPosition(newPos, map, creatures, creature.id)) continue;

      const distance = this.getManhattanDistance(newPos, threatPosition);
      if (distance > maxDistance) {
        maxDistance = distance;
        bestPosition = newPos;
      }
    }

    if (bestPosition) {
      return { action: 'flee', targetPosition: bestPosition };
    }

    return { action: 'explore' };
  }

  private getBlinkAwayTarget(creature: Creature, threatPosition: Position, map: Tile[][], creatures: Creature[]): Position | null {
    if (creature.species !== 'elf') return null;

    const hasMultiTeleport = creature.skills.includes('multiTeleport');
    const blinkRange = hasMultiTeleport ? 2 : (SKILL_EFFECTS.blink.type === 'active' && SKILL_EFFECTS.blink.range ? SKILL_EFFECTS.blink.range : 1);

    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    let bestPosition: Position | null = null;
    let maxDistance = 0;

    for (const dir of directions) {
      const blinkPos: Position = {
        x: creature.position.x + dir.x * blinkRange,
        y: creature.position.y + dir.y * blinkRange
      };

      if (this.isValidPosition(blinkPos, map, creatures, creature.id)) {
        const distance = this.getManhattanDistance(blinkPos, threatPosition);
        if (distance > maxDistance) {
          maxDistance = distance;
          bestPosition = blinkPos;
        }
      }
    }

    return bestPosition;
  }

  private getExploreDecision(creature: Creature, map: Tile[][], creatures: Creature[]): AIDecision {
    const unvisitedTiles: Position[] = [];
    const nearbyTiles: Position[] = [];

    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (map[y][x].type === 'wall') continue;
        const pos = { x, y };
        const key = posKey(pos);

        if (!creature.visitedTiles.has(key)) {
          unvisitedTiles.push(pos);
        }

        const distance = this.getManhattanDistance(creature.position, pos);
        if (distance <= creature.speed && distance > 0 && this.isValidPosition(pos, map, creatures, creature.id)) {
          nearbyTiles.push(pos);
        }
      }
    }

    if (unvisitedTiles.length > 0) {
      let nearestUnvisited: Position | null = null;
      let minDistance = Infinity;

      for (const pos of unvisitedTiles) {
        const distance = this.getManhattanDistance(creature.position, pos);
        if (distance < minDistance) {
          minDistance = distance;
          nearestUnvisited = pos;
        }
      }

      if (nearestUnvisited) {
        const path = this.findPath(creature.position, nearestUnvisited, map, creatures, creature.id);
        if (path.length > 1) {
          return { action: 'move', targetPosition: path[1] };
        }
      }
    }

    if (nearbyTiles.length > 0) {
      const randomTile = nearbyTiles[Math.floor(Math.random() * nearbyTiles.length)];
      return { action: 'explore', targetPosition: randomTile };
    }

    return { action: 'explore' };
  }

  getManhattanDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  isValidPosition(pos: Position, map: Tile[][], creatures: Creature[], excludeId?: string): boolean {
    if (pos.x < 0 || pos.x >= MAP_SIZE || pos.y < 0 || pos.y >= MAP_SIZE) {
      return false;
    }
    if (map[pos.y][pos.x].type === 'wall') {
      return false;
    }
    for (const creature of creatures) {
      if (creature.id !== excludeId &&
          creature.position.x === pos.x &&
          creature.position.y === pos.y &&
          creature.hp > 0) {
        return false;
      }
    }
    return true;
  }

  private getNeighbors(pos: Position): Position[] {
    return [
      { x: pos.x, y: pos.y - 1 },
      { x: pos.x, y: pos.y + 1 },
      { x: pos.x - 1, y: pos.y },
      { x: pos.x + 1, y: pos.y }
    ];
  }

  private getCacheKey(start: Position, end: Position, excludeId?: string): string {
    return `${posKey(start)}|${posKey(end)}|${excludeId || 'none'}`;
  }

  private cleanupCache(now: number): void {
    if (this.pathCache.size > this.CACHE_MAX_SIZE) {
      let oldestKey: string | null = null;
      let oldestTime = Infinity;

      for (const [key, entry] of this.pathCache) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp;
          oldestKey = key;
        }
      }

      if (oldestKey) {
        this.pathCache.delete(oldestKey);
      }
    }

    for (const [key, entry] of this.pathCache) {
      if (now - entry.timestamp > this.CACHE_TTL) {
        this.pathCache.delete(key);
      }
    }
  }

  findPath(start: Position, end: Position, map: Tile[][], creatures: Creature[], excludeId?: string): Position[] {
    const startTime = performance.now();
    const cacheKey = this.getCacheKey(start, end, excludeId);

    this.cleanupCache(startTime);

    const cached = this.pathCache.get(cacheKey);
    if (cached && startTime - cached.timestamp < this.CACHE_TTL) {
      return cached.path;
    }

    const endTile = map[end.y]?.[end.x];
    if (!endTile || endTile.type === 'wall') {
      return [start];
    }

    const openList: PathNode[] = [];
    const closedSet = new Set<string>();
    const cameFrom = new Map<string, PathNode>();

    const startNode: PathNode = {
      position: { ...start },
      g: 0,
      h: this.getManhattanDistance(start, end),
      f: this.getManhattanDistance(start, end),
      parent: null
    };

    openList.push(startNode);
    cameFrom.set(posKey(start), startNode);

    while (openList.length > 0) {
      if (performance.now() - startTime > MAX_PATHFINDING_TIME) {
        let bestNode = openList[0];
        for (const node of openList) {
          if (node.f < bestNode.f) {
            bestNode = node;
          }
        }
        const result = this.reconstructPath(bestNode);
        this.pathCache.set(cacheKey, { path: result, timestamp: startTime, targetKey: posKey(end) });
        return result;
      }

      let minIndex = 0;
      for (let i = 1; i < openList.length; i++) {
        if (openList[i].f < openList[minIndex].f) {
          minIndex = i;
        }
      }

      const current = openList.splice(minIndex, 1)[0];
      const currentKey = posKey(current.position);

      if (current.position.x === end.x && current.position.y === end.y) {
        const result = this.reconstructPath(current);
        this.pathCache.set(cacheKey, { path: result, timestamp: startTime, targetKey: posKey(end) });
        return result;
      }

      closedSet.add(currentKey);

      for (const neighbor of this.getNeighbors(current.position)) {
        const neighborKey = posKey(neighbor);

        if (closedSet.has(neighborKey)) continue;

        const isTarget = neighbor.x === end.x && neighbor.y === end.y;
        if (!isTarget && !this.isValidPosition(neighbor, map, creatures, excludeId)) {
          continue;
        }

        const tentativeG = current.g + 1;

        const existing = cameFrom.get(neighborKey);
        if (!existing || tentativeG < existing.g) {
          const h = this.getManhattanDistance(neighbor, end);
          const neighborNode: PathNode = {
            position: { ...neighbor },
            g: tentativeG,
            h,
            f: tentativeG + h,
            parent: current
          };

          cameFrom.set(neighborKey, neighborNode);
          openList.push(neighborNode);
        }
      }
    }

    return [start];
  }

  private reconstructPath(node: PathNode): Position[] {
    const path: Position[] = [];
    let current: PathNode | null = node;

    while (current) {
      path.unshift({ ...current.position });
      current = current.parent;
    }

    return path;
  }

  private getBlinkTarget(creature: Creature, targetPos: Position, map: Tile[][], creatures: Creature[]): Position | null {
    if (creature.species !== 'elf') return null;

    const hasMultiTeleport = creature.skills.includes('multiTeleport');
    const blinkRange = hasMultiTeleport ? 2 : (SKILL_EFFECTS.blink.type === 'active' && SKILL_EFFECTS.blink.range ? SKILL_EFFECTS.blink.range : 2);

    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    let bestPosition: Position | null = null;
    let bestDistance = Infinity;

    for (const dir of directions) {
      const blinkPos: Position = {
        x: creature.position.x + dir.x * blinkRange,
        y: creature.position.y + dir.y * blinkRange
      };

      if (this.isValidPosition(blinkPos, map, creatures, creature.id)) {
        const targetDist = this.getManhattanDistance(blinkPos, targetPos);
        if (targetDist < bestDistance) {
          bestDistance = targetDist;
          bestPosition = blinkPos;
        }
      }
    }

    if (bestPosition && bestDistance <= 2) {
      return bestPosition;
    }

    return null;
  }
}
