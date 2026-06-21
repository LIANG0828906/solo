import { RoomType, Room, Dungeon, Connections, RoomTemplate, Enemy, EnemyType } from './types';

class SeededRandom {
  private seed: number;

  constructor(seed: number) {
    this.seed = seed >>> 0;
  }

  next(): number {
    this.seed = (this.seed * 1664525 + 1013904223) >>> 0;
    return this.seed / 0xFFFFFFFF;
  }

  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

const ROOM_TEMPLATES: RoomTemplate[] = [
  {
    id: 0, size: 5,
    wallMap: [
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,0,0,0,1],
      [1,1,1,1,1]
    ],
    defaultConnections: { north: true, south: true, east: true, west: true }
  },
  {
    id: 1, size: 5,
    wallMap: [
      [1,1,1,1,1],
      [1,0,1,0,1],
      [1,0,0,0,1],
      [1,0,1,0,1],
      [1,1,1,1,1]
    ],
    defaultConnections: { north: true, south: true, east: false, west: false }
  },
  {
    id: 2, size: 5,
    wallMap: [
      [1,1,1,1,1],
      [1,0,0,0,1],
      [1,1,0,1,1],
      [1,0,0,0,1],
      [1,1,1,1,1]
    ],
    defaultConnections: { north: false, south: false, east: true, west: true }
  },
  {
    id: 3, size: 7,
    wallMap: [
      [1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,1,1,1,0,1],
      [1,0,1,0,1,0,1],
      [1,0,1,1,1,0,1],
      [1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1]
    ],
    defaultConnections: { north: true, south: true, east: true, west: true }
  },
  {
    id: 4, size: 7,
    wallMap: [
      [1,1,1,1,1,1,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,0,0,0,0,0,1],
      [1,1,1,1,1,1,1]
    ],
    defaultConnections: { north: true, south: true, east: true, west: true }
  },
  {
    id: 5, size: 7,
    wallMap: [
      [1,1,1,1,1,1,1],
      [1,0,1,0,1,0,1],
      [1,0,0,0,0,0,1],
      [1,0,1,0,1,0,1],
      [1,0,0,0,0,0,1],
      [1,0,1,0,1,0,1],
      [1,1,1,1,1,1,1]
    ],
    defaultConnections: { north: true, south: false, east: true, west: false }
  },
  {
    id: 6, size: 9,
    wallMap: [
      [1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,1],
      [1,0,1,1,0,1,1,0,1],
      [1,0,1,0,0,0,1,0,1],
      [1,0,0,0,0,0,0,0,1],
      [1,0,1,0,0,0,1,0,1],
      [1,0,1,1,0,1,1,0,1],
      [1,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1]
    ],
    defaultConnections: { north: true, south: true, east: true, west: true }
  },
  {
    id: 7, size: 9,
    wallMap: [
      [1,1,1,1,1,1,1,1,1],
      [1,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,1],
      [1,0,0,0,0,0,0,0,1],
      [1,1,1,1,1,1,1,1,1]
    ],
    defaultConnections: { north: true, south: true, east: true, west: true }
  },
  {
    id: 8, size: 9,
    wallMap: [
      [1,1,1,1,1,1,1,1,1],
      [1,0,0,0,1,0,0,0,1],
      [1,0,1,0,0,0,1,0,1],
      [1,0,0,0,1,0,0,0,1],
      [1,1,0,1,0,1,0,1,1],
      [1,0,0,0,1,0,0,0,1],
      [1,0,1,0,0,0,1,0,1],
      [1,0,0,0,1,0,0,0,1],
      [1,1,1,1,1,1,1,1,1]
    ],
    defaultConnections: { north: true, south: true, east: false, west: true }
  },
  {
    id: 9, size: 9,
    wallMap: [
      [1,1,1,1,1,1,1,1,1],
      [1,0,1,0,0,0,1,0,1],
      [1,0,0,0,1,0,0,0,1],
      [1,1,0,1,0,1,0,1,1],
      [1,0,0,0,0,0,0,0,1],
      [1,1,0,1,0,1,0,1,1],
      [1,0,0,0,1,0,0,0,1],
      [1,0,1,0,0,0,1,0,1],
      [1,1,1,1,1,1,1,1,1]
    ],
    defaultConnections: { north: false, south: true, east: true, west: true }
  }
];

export class DungeonGenerator {
  private rng: SeededRandom;
  private gridWidth: number;
  private gridHeight: number;
  private enemyIdCounter: number;

  constructor(seed: number, gridWidth: number = 6, gridHeight: number = 6) {
    this.rng = new SeededRandom(seed);
    this.gridWidth = Math.max(6, gridWidth);
    this.gridHeight = Math.max(6, gridHeight);
    this.enemyIdCounter = 0;
  }

  generate(): Dungeon {
    const startTime = performance.now();

    const rooms: Room[][] = [];
    for (let y = 0; y < this.gridHeight; y++) {
      rooms[y] = [];
      for (let x = 0; x < this.gridWidth; x++) {
        rooms[y][x] = this.createEmptyRoom(x, y);
      }
    }

    const coreX = this.rng.nextInt(1, this.gridWidth - 2);
    const coreY = this.rng.nextInt(1, this.gridHeight - 2);
    rooms[coreY][coreX] = this.createRoom(coreX, coreY, RoomType.CORE, 8);

    const specialPositions = this.getSpecialPositions(coreX, coreY);
    const treasureCount = this.rng.nextInt(2, 3);
    const monsterCount = this.rng.nextInt(3, 5);

    for (let i = 0; i < treasureCount && i < specialPositions.length; i++) {
      const pos = specialPositions[i];
      rooms[pos.y][pos.x] = this.createRoom(pos.x, pos.y, RoomType.TREASURE, this.getRandomTemplateId([5, 7]));
    }

    for (let i = treasureCount; i < treasureCount + monsterCount && i < specialPositions.length; i++) {
      const pos = specialPositions[i];
      rooms[pos.y][pos.x] = this.createRoom(pos.x, pos.y, RoomType.MONSTER, this.getRandomTemplateId([5, 7]));
    }

    this.generateCorridors(rooms, coreX, coreY);
    this.ensureConnectivity(rooms);
    this.setupConnections(rooms);

    const endTime = performance.now();
    console.log(`Dungeon generated in ${(endTime - startTime).toFixed(2)}ms`);

    return {
      seed: this.rng['seed'],
      gridWidth: this.gridWidth,
      gridHeight: this.gridHeight,
      rooms,
      coreRoom: { x: coreX, y: coreY }
    };
  }

  private createEmptyRoom(x: number, y: number): Room {
    return {
      x, y,
      width: 5, height: 5,
      type: RoomType.EMPTY,
      templateId: -1,
      connections: { north: false, south: false, east: false, west: false },
      explored: false,
      enemies: [],
      treasures: 0,
      cleared: false,
      wallMap: [],
      clearFlashTimer: 0
    };
  }

  private createRoom(x: number, y: number, type: RoomType, templateId: number): Room {
    const template = ROOM_TEMPLATES[templateId];
    const enemies: Enemy[] = [];

    if (type === RoomType.MONSTER) {
      const enemyCount = this.rng.nextInt(3, 4);
      for (let i = 0; i < enemyCount; i++) {
        const enemyType = this.rng.next() > 0.5 ? EnemyType.SKELETON : EnemyType.SLIME;
        let ex, ey;
        do {
          ex = this.rng.nextInt(1, template.size - 2);
          ey = this.rng.nextInt(1, template.size - 2);
        } while (template.wallMap[ey][ex] === 1 || (ex === Math.floor(template.size / 2) && ey === Math.floor(template.size / 2)));

        enemies.push({
          id: this.enemyIdCounter++,
          type: enemyType,
          x: ex + 0.5,
          y: ey + 0.5,
          hp: enemyType === EnemyType.SKELETON ? 2 : 1,
          maxHp: enemyType === EnemyType.SKELETON ? 2 : 1,
          alive: true,
          deathTimer: 0
        });
      }
    }

    return {
      x, y,
      width: template.size,
      height: template.size,
      type,
      templateId,
      connections: { ...template.defaultConnections },
      explored: false,
      enemies,
      treasures: type === RoomType.TREASURE ? 1 : 0,
      cleared: type !== RoomType.MONSTER,
      wallMap: JSON.parse(JSON.stringify(template.wallMap)),
      clearFlashTimer: 0
    };
  }

  private getSpecialPositions(coreX: number, coreY: number): { x: number; y: number }[] {
    const positions: { x: number; y: number; dist: number }[] = [];

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (x === coreX && y === coreY) continue;
        const dist = Math.abs(x - coreX) + Math.abs(y - coreY);
        if (dist >= 2) {
          positions.push({ x, y, dist });
        }
      }
    }

    return this.rng.shuffle(positions).sort((a, b) => b.dist - a.dist);
  }

  private getRandomTemplateId(sizes: number[]): number {
    const candidates = ROOM_TEMPLATES.filter(t => sizes.includes(t.size));
    const template = candidates[this.rng.nextInt(0, candidates.length - 1)];
    return template.id;
  }

  private generateCorridors(rooms: Room[][], coreX: number, coreY: number): void {
    const specialRooms: { x: number; y: number }[] = [];

    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (rooms[y][x].type !== RoomType.EMPTY) {
          specialRooms.push({ x, y });
        }
      }
    }

    const connected = new Set<string>();
    connected.add(`${coreX},${coreY}`);

    while (connected.size < specialRooms.length) {
      let minDist = Infinity;
      let bestFrom: { x: number; y: number } | null = null;
      let bestTo: { x: number; y: number } | null = null;

      for (const from of specialRooms) {
        if (!connected.has(`${from.x},${from.y}`)) continue;
        for (const to of specialRooms) {
          if (connected.has(`${to.x},${to.y}`)) continue;
          const dist = Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
          if (dist < minDist) {
            minDist = dist;
            bestFrom = from;
            bestTo = to;
          }
        }
      }

      if (bestFrom && bestTo) {
        this.createCorridorPath(rooms, bestFrom, bestTo);
        connected.add(`${bestTo.x},${bestTo.y}`);
      } else {
        break;
      }
    }
  }

  private createCorridorPath(rooms: Room[][], from: { x: number; y: number }, to: { x: number; y: number }): void {
    let cx = from.x;
    let cy = from.y;

    const corridorWidth = this.rng.nextInt(2, 3);

    while (cx !== to.x || cy !== to.y) {
      if (rooms[cy][cx].type === RoomType.EMPTY) {
        const templateId = corridorWidth === 2 ?
          this.getRandomTemplateId([5]) :
          this.getRandomTemplateId([5, 7]);
        rooms[cy][cx] = this.createRoom(cx, cy, RoomType.CORRIDOR, templateId);
      }

      if (cx !== to.x) {
        cx += cx < to.x ? 1 : -1;
      } else if (cy !== to.y) {
        cy += cy < to.y ? 1 : -1;
      }
    }
  }

  private ensureConnectivity(rooms: Room[][]): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        if (rooms[y][x].type === RoomType.EMPTY) {
          const hasNonEmptyNeighbor =
            (y > 0 && rooms[y - 1][x].type !== RoomType.EMPTY) ||
            (y < this.gridHeight - 1 && rooms[y + 1][x].type !== RoomType.EMPTY) ||
            (x > 0 && rooms[y][x - 1].type !== RoomType.EMPTY) ||
            (x < this.gridWidth - 1 && rooms[y][x + 1].type !== RoomType.EMPTY);

          if (hasNonEmptyNeighbor && this.rng.next() > 0.6) {
            rooms[y][x] = this.createRoom(x, y, RoomType.CORRIDOR, this.getRandomTemplateId([5]));
          }
        }
      }
    }
  }

  private setupConnections(rooms: Room[][]): void {
    for (let y = 0; y < this.gridHeight; y++) {
      for (let x = 0; x < this.gridWidth; x++) {
        const room = rooms[y][x];
        if (room.type === RoomType.EMPTY) continue;

        if (y > 0 && rooms[y - 1][x].type !== RoomType.EMPTY) {
          room.connections.north = true;
          this.createDoorway(room, 'north');
        }
        if (y < this.gridHeight - 1 && rooms[y + 1][x].type !== RoomType.EMPTY) {
          room.connections.south = true;
          this.createDoorway(room, 'south');
        }
        if (x > 0 && rooms[y][x - 1].type !== RoomType.EMPTY) {
          room.connections.west = true;
          this.createDoorway(room, 'west');
        }
        if (x < this.gridWidth - 1 && rooms[y][x + 1].type !== RoomType.EMPTY) {
          room.connections.east = true;
          this.createDoorway(room, 'east');
        }
      }
    }
  }

  private createDoorway(room: Room, direction: keyof Connections): void {
    if (room.wallMap.length === 0) return;

    const size = room.wallMap.length;
    const mid = Math.floor(size / 2);

    switch (direction) {
      case 'north':
        room.wallMap[0][mid] = 0;
        if (size > 5) room.wallMap[0][mid - 1] = 0;
        break;
      case 'south':
        room.wallMap[size - 1][mid] = 0;
        if (size > 5) room.wallMap[size - 1][mid - 1] = 0;
        break;
      case 'west':
        room.wallMap[mid][0] = 0;
        if (size > 5) room.wallMap[mid - 1][0] = 0;
        break;
      case 'east':
        room.wallMap[mid][size - 1] = 0;
        if (size > 5) room.wallMap[mid - 1][size - 1] = 0;
        break;
    }
  }

  getTemplate(templateId: number): RoomTemplate | undefined {
    return ROOM_TEMPLATES.find(t => t.id === templateId);
  }
}
