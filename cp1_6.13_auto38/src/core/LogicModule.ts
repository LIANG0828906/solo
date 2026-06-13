import { v4 as uuidv4 } from 'uuid';
import type {
  Position,
  Tile,
  Creature,
  CombatResult,
  ChestReward,
  GameState,
  TileType
} from '../types';
import {
  MAP_SIZE,
  EVOLUTION_KILLS_REQUIRED,
  CHEST_REWARD_CHANCE,
  SKILL_EFFECTS,
  SPECIES_STATS
} from '../types';

export class LogicModule {
  private map: Tile[][] = [];

  generateDungeon(): Tile[][] {
    this.map = this.initializeMap();
    this.generateRooms();
    this.generateCorridors();
    this.placeObstacles();
    this.placeChests();
    this.placePortals();
    return this.map;
  }

  private initializeMap(): Tile[][] {
    const newMap: Tile[][] = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      const row: Tile[] = [];
      for (let x = 0; x < MAP_SIZE; x++) {
        row.push({
          x,
          y,
          type: 'wall',
          hasChest: false,
          hasPortal: false,
          isExplored: false
        });
      }
      newMap.push(row);
    }
    return newMap;
  }

  private generateRooms(): void {
    const rooms: { x: number; y: number }[] = [];
    const maxRooms = 4;
    const roomSize = 2;

    for (let i = 0; i < maxRooms; i++) {
      let attempts = 0;
      while (attempts < 20) {
        const x = Math.floor(Math.random() * (MAP_SIZE - roomSize - 1)) + 1;
        const y = Math.floor(Math.random() * (MAP_SIZE - roomSize - 1)) + 1;

        let overlaps = false;
        for (const room of rooms) {
          if (Math.abs(room.x - x) < roomSize + 1 && Math.abs(room.y - y) < roomSize + 1) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          for (let dy = 0; dy < roomSize; dy++) {
            for (let dx = 0; dx < roomSize; dx++) {
              this.setTileType(x + dx, y + dy, 'room');
            }
          }
          rooms.push({ x, y });
          break;
        }
        attempts++;
      }
    }
  }

  private generateCorridors(): void {
    const rooms: Position[] = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (this.map[y][x].type === 'room') {
          rooms.push({ x, y });
        }
      }
    }

    for (let i = 0; i < rooms.length - 1; i++) {
      const current = rooms[i];
      const next = rooms[i + 1];
      this.createHorizontalCorridor(current.x, next.x, current.y);
      this.createVerticalCorridor(current.y, next.y, next.x);
    }
  }

  private createHorizontalCorridor(x1: number, x2: number, y: number): void {
    const minX = Math.min(x1, x2);
    const maxX = Math.max(x1, x2);
    for (let x = minX; x <= maxX; x++) {
      if (this.map[y][x].type === 'wall') {
        this.setTileType(x, y, 'corridor');
      }
    }
  }

  private createVerticalCorridor(y1: number, y2: number, x: number): void {
    const minY = Math.min(y1, y2);
    const maxY = Math.max(y1, y2);
    for (let y = minY; y <= maxY; y++) {
      if (this.map[y][x].type === 'wall') {
        this.setTileType(x, y, 'corridor');
      }
    }
  }

  private placeObstacles(): void {
    const floorTiles: Position[] = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (this.map[y][x].type === 'room' || this.map[y][x].type === 'corridor') {
          floorTiles.push({ x, y });
        }
      }
    }

    const obstacleCount = Math.floor(floorTiles.length * 0.2);
    for (let i = 0; i < obstacleCount; i++) {
      const randomIndex = Math.floor(Math.random() * floorTiles.length);
      const pos = floorTiles[randomIndex];
      this.setTileType(pos.x, pos.y, 'wall');
      floorTiles.splice(randomIndex, 1);
    }
  }

  private placeChests(): void {
    const floorTiles = this.getFloorTiles();
    const chestCount = Math.min(3, Math.floor(floorTiles.length * 0.1));
    for (let i = 0; i < chestCount; i++) {
      const randomIndex = Math.floor(Math.random() * floorTiles.length);
      const pos = floorTiles[randomIndex];
      this.map[pos.y][pos.x].hasChest = true;
      floorTiles.splice(randomIndex, 1);
    }
  }

  private placePortals(): void {
    const floorTiles = this.getFloorTiles();
    if (floorTiles.length >= 2) {
      const portal1 = floorTiles[Math.floor(Math.random() * floorTiles.length)];
      let portal2: Position;
      do {
        portal2 = floorTiles[Math.floor(Math.random() * floorTiles.length)];
      } while (portal1.x === portal2.x && portal1.y === portal2.y);

      const portal1Id = uuidv4();
      const portal2Id = uuidv4();

      this.map[portal1.y][portal1.x].hasPortal = true;
      this.map[portal1.y][portal1.x].portalTarget = `${portal2.x},${portal2.y}`;
      this.map[portal2.y][portal2.x].hasPortal = true;
      this.map[portal2.y][portal2.x].portalTarget = `${portal1.x},${portal1.y}`;
    }
  }

  private setTileType(x: number, y: number, type: TileType): void {
    if (x >= 0 && x < MAP_SIZE && y >= 0 && y < MAP_SIZE) {
      this.map[y][x].type = type;
    }
  }

  private getFloorTiles(): Position[] {
    const tiles: Position[] = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if ((this.map[y][x].type === 'room' || this.map[y][x].type === 'corridor') &&
            !this.map[y][x].hasChest && !this.map[y][x].hasPortal) {
          tiles.push({ x, y });
        }
      }
    }
    return tiles;
  }

  checkCollision(position: Position, map: Tile[][], creatures: Creature[], excludeId?: string): boolean {
    if (position.x < 0 || position.x >= MAP_SIZE || position.y < 0 || position.y >= MAP_SIZE) {
      return true;
    }
    if (map[position.y][position.x].type === 'wall') {
      return true;
    }
    for (const creature of creatures) {
      if (creature.id !== excludeId &&
          creature.position.x === position.x &&
          creature.position.y === position.y &&
          creature.hp > 0) {
        return true;
      }
    }
    return false;
  }

  resolveCombat(attacker: Creature, defender: Creature): CombatResult {
    const baseDamage = attacker.attack - defender.defense * 0.5;
    const randomFactor = 0.8 + Math.random() * 0.4;
    const damage = Math.max(1, Math.floor(baseDamage * randomFactor));

    defender.hp = Math.max(0, defender.hp - damage);

    const isDefenderDead = defender.hp <= 0;
    if (isDefenderDead) {
      attacker.kills++;
    }

    return {
      damage,
      winnerId: isDefenderDead ? attacker.id : defender.id,
      loserId: isDefenderDead ? defender.id : attacker.id,
      isDefenderDead
    };
  }

  checkEvolution(creature: Creature): boolean {
    return creature.kills >= EVOLUTION_KILLS_REQUIRED && !creature.isEvolving;
  }

  openChest(creature: Creature, tile: Tile): ChestReward {
    if (!tile.hasChest) {
      return { isTrap: false, reward: null };
    }

    tile.hasChest = false;

    const isTrap = Math.random() > CHEST_REWARD_CHANCE;
    const hasTrapImmunity = creature.skills.includes('trap_immunity');

    if (isTrap) {
      const damage = hasTrapImmunity ? 0 : Math.floor(Math.random() * 15) + 5;
      creature.hp = Math.max(0, creature.hp - damage);
      return {
        isTrap: true,
        reward: null,
        damage
      };
    }

    const rewardTypes: Array<'hp' | 'attack' | 'defense' | 'speed'> = ['hp', 'attack', 'defense', 'speed'];
    const type = rewardTypes[Math.floor(Math.random() * rewardTypes.length)];
    let value = 0;

    switch (type) {
      case 'hp':
        value = Math.floor(Math.random() * 20) + 10;
        creature.maxHp += value;
        creature.hp += value;
        break;
      case 'attack':
        value = Math.floor(Math.random() * 5) + 2;
        creature.attack += value;
        break;
      case 'defense':
        value = Math.floor(Math.random() * 3) + 1;
        creature.defense += value;
        break;
      case 'speed':
        value = 1;
        creature.speed += value;
        break;
    }

    return {
      isTrap: false,
      reward: { type, value }
    };
  }

  usePortal(creature: Creature, tile: Tile): Position | null {
    if (!tile.hasPortal || !tile.portalTarget) {
      return null;
    }

    const [targetX, targetY] = tile.portalTarget.split(',').map(Number);
    const targetPosition: Position = { x: targetX, y: targetY };

    creature.position = { ...targetPosition };
    creature.visitedTiles.add(`${targetX},${targetY}`);

    return targetPosition;
  }

  applySkillEffects(creature: Creature, creatures: Creature[]): Map<string, number> {
    const damageMap = new Map<string, number>();

    for (const skill of creature.skills) {
      const effect = SKILL_EFFECTS[skill];
      if (!effect) continue;

      if (effect.type === 'aura' && effect.range && effect.damage) {
        for (const other of creatures) {
          if (other.id === creature.id || other.hp <= 0) continue;

          const distance = this.getManhattanDistance(creature.position, other.position);
          if (distance <= effect.range) {
            const currentDamage = damageMap.get(other.id) || 0;
            damageMap.set(other.id, currentDamage + effect.damage);
            other.hp = Math.max(0, other.hp - effect.damage);
          }
        }
      }
    }

    return damageMap;
  }

  private getManhattanDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
  }

  getRandomSpawnPosition(map: Tile[][], creatures: Creature[]): Position | null {
    const validPositions: Position[] = [];
    for (let y = 0; y < MAP_SIZE; y++) {
      for (let x = 0; x < MAP_SIZE; x++) {
        if (map[y][x].type !== 'wall' && !map[y][x].hasChest && !map[y][x].hasPortal) {
          const pos = { x, y };
          if (!this.checkCollision(pos, map, creatures)) {
            validPositions.push(pos);
          }
        }
      }
    }
    if (validPositions.length === 0) return null;
    return validPositions[Math.floor(Math.random() * validPositions.length)];
  }
}
