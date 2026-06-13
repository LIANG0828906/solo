import type {
  Position,
  Creature,
  Tile,
  GameState,
  AIDecision,
  Species
} from '../types';
import {
  MAP_SIZE,
  MAX_PATHFINDING_TIME,
  SKILL_EFFECTS
} from '../types';

interface PathNode {
  position: Position;
  g: number;
  h: number;
  f: number;
  parent: PathNode | null;
}

export class AIStrategy {
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
        if (powerRatio >= 0.8 || creature.species === 'dragon') {
          return { action: 'attack', targetCreatureId: nearbyEnemy.id, targetPosition: nearbyEnemy.position };
        } else {
          return this.getFleeDecision(creature, nearbyEnemy.position, gameState.map, gameState.creatures);
        }
      }

      if (distance <= 3 && powerRatio >= 0.7) {
        if (creature.species === 'elf' && distance <= 3 && distance >= 2) {
          const blinkPosition = this.getBlinkTarget(creature, nearbyEnemy.position, gameState.map, gameState.creatures);
          if (blinkPosition) {
            return { action: 'move', targetPosition: blinkPosition };
          }
        }
        return { action: 'move', targetPosition: nearbyEnemy.position };
      }

      if (powerRatio < 0.5) {
        return this.getFleeDecision(creature, nearbyEnemy.position, gameState.map, gameState.creatures);
      }
    }

    if (gameState.selectedCreatureId === creature.id && gameState.userTarget) {
      return { action: 'move', targetPosition: gameState.userTarget };
    }

    return this.getExploreDecision(creature, gameState.map, gameState.creatures);
  }

  private findNearbyEnemy(creature: Creature, creatures: Creature[]): Creature | null {
    let nearest: Creature | null = null;
    let minDistance = Infinity;

    for (const other of creatures) {
      if (other.id === creature.id || other.hp <= 0) continue;
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

  private getExploreDecision(creature: Creature, map: Tile[][], creatures: Creature[]): AIDecision {
    const unvisitedTiles: Position[] = [];
    const nearbyTiles: Position[] = [];

    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (map[y][x].type === 'wall') continue;
        const pos = { x, y };
        const key = `${x},${y}`;

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

  private getBlinkTarget(creature: Creature, targetPos: Position, map: Tile[][], creatures: Creature[]): Position | null {
    const effect = SKILL_EFFECTS['blink'];
    if (!effect || effect.type !== 'active' || !effect.range) return null;

    const directions = [
      { x: 0, y: -1 },
      { x: 0, y: 1 },
      { x: -1, y: 0 },
      { x: 1, y: 0 }
    ];

    for (const dir of directions) {
      const blinkPos: Position = {
        x: creature.position.x + dir.x * effect.range,
        y: creature.position.y + dir.y * effect.range
      };

      if (this.isValidPosition(blinkPos, map, creatures, creature.id)) {
        const targetDist = this.getManhattanDistance(blinkPos, targetPos);
        if (targetDist <= 1) {
          return blinkPos;
        }
