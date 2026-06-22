import { TileType, Position, Enemy, EnemyType, Item, Chest, ItemQuality, ItemType } from './gameState';

interface Room {
  x: number;
  y: number;
  width: number;
  height: number;
  centerX: number;
  centerY: number;
}

const ENEMY_TEMPLATES: Record<EnemyType, { name: string; maxHealth: number; attack: number; defense: number; expReward: number; symbol: string }> = {
  slime: {
    name: '史莱姆',
    maxHealth: 8,
    attack: 3,
    defense: 0,
    expReward: 8,
    symbol: 'S'
  },
  skeleton: {
    name: '骷髅',
    maxHealth: 12,
    attack: 5,
    defense: 2,
    expReward: 15,
    symbol: 'K'
  },
  bat: {
    name: '蝙蝠',
    maxHealth: 6,
    attack: 4,
    defense: 1,
    expReward: 10,
    symbol: 'B'
  }
};

const WEAPON_NAMES: Record<ItemQuality, string[]> = {
  common: ['铁剑', '短刀', '木棍'],
  rare: ['精钢剑', '魔法匕首', '战锤'],
  legendary: ['炎魔之刃', '暗影刺杀者', '圣光之锤']
};

const ARMOR_NAMES: Record<ItemQuality, string[]> = {
  common: ['皮甲', '布甲', '木盾'],
  rare: ['锁子甲', '铁盾', '法师袍'],
  legendary: ['龙鳞铠甲', '圣骑士盾', '大法师斗篷']
};

const ACCESSORY_NAMES: Record<ItemQuality, string[]> = {
  common: ['铜戒指', '皮护腕', '护身符'],
  rare: ['银戒指', '力量护腕', '魔法项链'],
  legendary: ['龙心戒指', '王者护腕', '神器项链']
};

const POTION_NAMES: string[] = ['小型生命药水', '中型生命药水', '大型生命药水'];

export class LevelGenerator {
  private mapWidth: number;
  private mapHeight: number;
  private idCounter: number;

  constructor(mapWidth: number, mapHeight: number) {
    this.mapWidth = mapWidth;
    this.mapHeight = mapHeight;
    this.idCounter = 0;
  }

  private generateId(): string {
    return `id_${Date.now()}_${this.idCounter++}`;
  }

  public generateMap(): TileType[][] {
    const map: TileType[][] = [];

    for (let y = 0; y < this.mapHeight; y++) {
      map[y] = [];
      for (let x = 0; x < this.mapWidth; x++) {
        map[y][x] = 'wall';
      }
    }

    return map;
  }

  private generateRooms(count: number): Room[] {
    const rooms: Room[] = [];
    const minRoomSize = 3;
    const maxRoomSize = 6;
    const maxAttempts = 100;

    for (let i = 0; i < count; i++) {
      let attempts = 0;
      while (attempts < maxAttempts) {
        const width = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
        const height = minRoomSize + Math.floor(Math.random() * (maxRoomSize - minRoomSize + 1));
        const x = 1 + Math.floor(Math.random() * (this.mapWidth - width - 2));
        const y = 1 + Math.floor(Math.random() * (this.mapHeight - height - 2));

        const newRoom: Room = {
          x,
          y,
          width,
          height,
          centerX: Math.floor(x + width / 2),
          centerY: Math.floor(y + height / 2)
        };

        let overlaps = false;
        for (const room of rooms) {
          if (this.roomsOverlap(newRoom, room)) {
            overlaps = true;
            break;
          }
        }

        if (!overlaps) {
          rooms.push(newRoom);
          break;
        }
        attempts++;
      }
    }

    return rooms;
  }

  private roomsOverlap(room1: Room, room2: Room): boolean {
    const padding = 1;
    return (
      room1.x - padding < room2.x + room2.width &&
      room1.x + room1.width + padding > room2.x &&
      room1.y - padding < room2.y + room2.height &&
      room1.y + room1.height + padding > room2.y
    );
  }

  private carveRoom(map: TileType[][], room: Room): void {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y > 0 && y < this.mapHeight - 1 && x > 0 && x < this.mapWidth - 1) {
          map[y][x] = 'floor';
        }
      }
    }
  }

  private carveCorridor(map: TileType[][], x1: number, y1: number, x2: number, y2: number): void {
    let x = x1;
    let y = y1;

    while (x !== x2) {
      if (y > 0 && y < this.mapHeight - 1 && x > 0 && x < this.mapWidth - 1) {
        map[y][x] = 'floor';
      }
      x += x < x2 ? 1 : -1;
    }

    while (y !== y2) {
      if (y > 0 && y < this.mapHeight - 1 && x > 0 && x < this.mapWidth - 1) {
        map[y][x] = 'floor';
      }
      y += y < y2 ? 1 : -1;
    }
  }

  public generateLevel(): { map: TileType[][]; playerStart: Position; enemies: Enemy[]; chests: Chest[] } {
    const map = this.generateMap();
    const roomCount = 3 + Math.floor(Math.random() * 3);
    const rooms = this.generateRooms(roomCount);

    rooms.forEach(room => this.carveRoom(map, room));

    for (let i = 0; i < rooms.length - 1; i++) {
      const room1 = rooms[i];
      const room2 = rooms[i + 1];
      this.carveCorridor(map, room1.centerX, room1.centerY, room2.centerX, room2.centerY);
    }

    if (rooms.length > 2) {
      const first = rooms[0];
      const last = rooms[rooms.length - 1];
      this.carveCorridor(map, first.centerX, first.centerY, last.centerX, last.centerY);
    }

    const playerStart: Position = {
      x: rooms[0].centerX,
      y: rooms[0].centerY
    };

    const enemies = this.generateEnemies(rooms, playerStart);
    const chests = this.generateChests(rooms, playerStart, enemies);

    return { map, playerStart, enemies, chests };
  }

  private getRandomFloorPosition(room: Room, excludePositions: Position[]): Position | null {
    const floorPositions: Position[] = [];

    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        const isExcluded = excludePositions.some(pos => pos.x === x && pos.y === y);
        if (!isExcluded && y > 0 && y < this.mapHeight - 1 && x > 0 && x < this.mapWidth - 1) {
          floorPositions.push({ x, y });
        }
      }
    }

    if (floorPositions.length === 0) return null;

    const shuffled = this.shuffleArray(floorPositions);
    return shuffled[0];
  }

  private shuffleArray<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  private generateEnemies(rooms: Room[], playerStart: Position): Enemy[] {
    const enemies: Enemy[] = [];
    const enemyTypes: EnemyType[] = ['slime', 'skeleton', 'bat'];
    const excludePositions = [playerStart];

    for (let i = 1; i < rooms.length; i++) {
      const room = rooms[i];
      const enemyCount = 1 + Math.floor(Math.random() * 2);

      for (let j = 0; j < enemyCount; j++) {
        const pos = this.getRandomFloorPosition(room, excludePositions);
        if (pos) {
          const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
          const template = ENEMY_TEMPLATES[type];

          const enemy: Enemy = {
            id: this.generateId(),
            type,
            name: template.name,
            position: pos,
            maxHealth: template.maxHealth,
            health: template.maxHealth,
            attack: template.attack,
            defense: template.defense,
            expReward: template.expReward
          };

          enemies.push(enemy);
          excludePositions.push(pos);
        }
      }
    }

    return enemies;
  }

  private generateChests(rooms: Room[], playerStart: Position, enemies: Enemy[]): Chest[] {
    const chests: Chest[] = [];
    const excludePositions = [playerStart, ...enemies.map(e => e.position)];

    for (let i = 0; i < rooms.length; i++) {
      const room = rooms[i];
      if (Math.random() > 0.4 || i === 0) {
        const pos = this.getRandomFloorPosition(room, excludePositions);
        if (pos) {
          const item = this.generateRandomItem();
          const chest: Chest = {
            id: this.generateId(),
            position: pos,
            item
          };
          chests.push(chest);
          excludePositions.push(pos);
        }
      }
    }

    return chests;
  }

  private generateRandomItem(): Item {
    const qualityRoll = Math.random();
    let quality: ItemQuality;
    if (qualityRoll < 0.6) {
      quality = 'common';
    } else if (qualityRoll < 0.9) {
      quality = 'rare';
    } else {
      quality = 'legendary';
    }

    const typeRoll = Math.random();
    let type: ItemType;
    if (typeRoll < 0.35) {
      type = 'weapon';
    } else if (typeRoll < 0.7) {
      type = 'armor';
    } else if (typeRoll < 0.85) {
      type = 'accessory';
    } else {
      type = 'potion';
    }

    const qualityMultiplier = quality === 'common' ? 1 : quality === 'rare' ? 2 : 3;
    let name: string;
    let attackBonus = 0;
    let defenseBonus = 0;
    let healthBonus: number | undefined;

    if (type === 'weapon') {
      const names = WEAPON_NAMES[quality];
      name = names[Math.floor(Math.random() * names.length)];
      attackBonus = Math.floor((2 + Math.random() * 3) * qualityMultiplier);
    } else if (type === 'armor') {
      const names = ARMOR_NAMES[quality];
      name = names[Math.floor(Math.random() * names.length)];
      defenseBonus = Math.floor((2 + Math.random() * 3) * qualityMultiplier);
    } else if (type === 'accessory') {
      const names = ACCESSORY_NAMES[quality];
      name = names[Math.floor(Math.random() * names.length)];
      attackBonus = Math.floor((1 + Math.random() * 2) * qualityMultiplier);
      defenseBonus = Math.floor((1 + Math.random() * 2) * qualityMultiplier);
    } else {
      name = POTION_NAMES[Math.floor(Math.random() * POTION_NAMES.length)];
      healthBonus = Math.floor((10 + Math.random() * 15) * qualityMultiplier);
    }

    return {
      id: this.generateId(),
      name,
      type,
      quality,
      attackBonus,
      defenseBonus,
      healthBonus
    };
  }

  public getEnemySymbol(type: EnemyType): string {
    return ENEMY_TEMPLATES[type].symbol;
  }
}
