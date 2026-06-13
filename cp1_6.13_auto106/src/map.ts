import {
  Floor, Room, RoomType, Position, Monster, Equipment, CONFIG
} from './types';
import {
  SeededRandom, generateId, generateWeapon, generateArmor, generateMonster
} from './utils';

const MAX_RETRY = 100;

interface Wall {
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
}

export class MapGenerator {
  private rng: SeededRandom;
  private floorSeed: number;

  constructor(seed?: number) {
    this.floorSeed = seed ?? Date.now();
    this.rng = new SeededRandom(this.floorSeed);
  }

  regenerate(seed?: number): void {
    this.floorSeed = seed ?? Date.now();
    this.rng = new SeededRandom(this.floorSeed);
  }

  generateAllFloors(): Floor[] {
    const floors: Floor[] = [];
    for (let i = 1; i <= CONFIG.TOTAL_FLOORS; i++) {
      const floorSeed = this.floorSeed + i * 1000;
      floors.push(this.generateFloor(i, floorSeed));
    }
    return floors;
  }

  generateFloor(level: number, seed?: number): Floor {
    const rng = new SeededRandom(seed ?? this.floorSeed + level * 1000);
    let attempts = 0;

    while (attempts < MAX_RETRY) {
      attempts++;
      try {
        const rooms = this.initializeRooms(rng);
        const roomPositions = this.generateMaze(rng);

        if (roomPositions.length < CONFIG.ROOMS_PER_FLOOR) {
          continue;
        }

        this.markRooms(rooms, roomPositions);
        this.connectRooms(rooms, roomPositions, rng);
        this.assignRoomTypes(rooms, roomPositions, level, rng);

        const entrancePos = this.findFurthestFromCenter(roomPositions, false);
        const stairsPos = this.findFurthestFromCenter(roomPositions, true);
        const bossPos = level === CONFIG.TOTAL_FLOORS ? stairsPos : undefined;

        rooms[entrancePos.y]![entrancePos.x]!.type = 'ENTRANCE';
        rooms[entrancePos.y]![entrancePos.x]!.visited = true;

        if (level === CONFIG.TOTAL_FLOORS) {
          rooms[stairsPos.y]![stairsPos.x]!.type = 'BOSS';
        } else {
          rooms[stairsPos.y]![stairsPos.x]!.type = 'STAIRS';
        }

        return {
          level,
          rooms,
          entrance: entrancePos,
          stairs: stairsPos,
          bossRoom: bossPos
        };
      } catch {
        continue;
      }
    }

    throw new Error(`Failed to generate floor ${level} after ${MAX_RETRY} attempts`);
  }

  private initializeRooms(rng: SeededRandom): Room[][] {
    const rooms: Room[][] = [];
    for (let y = 0; y < CONFIG.GRID_HEIGHT; y++) {
      rooms[y] = [];
      for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
        rooms[y]![x] = this.createEmptyRoom(x, y, rng);
      }
    }
    return rooms;
  }

  private createEmptyRoom(x: number, y: number, _rng: SeededRandom): Room {
    return {
      id: generateId(),
      x,
      y,
      type: 'EMPTY',
      visited: false,
      doors: {
        up: false,
        down: false,
        left: false,
        right: false
      }
    };
  }

  private generateMaze(rng: SeededRandom): Position[] {
    const centerX = Math.floor(CONFIG.GRID_WIDTH / 2);
    const centerY = Math.floor(CONFIG.GRID_HEIGHT / 2);

    const visited: boolean[][] = [];
    for (let y = 0; y < CONFIG.GRID_HEIGHT; y++) {
      visited[y] = [];
      for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
        visited[y]![x] = false;
      }
    }

    const roomPositions: Position[] = [];
    const walls: Wall[] = [];

    visited[centerY]![centerX] = true;
    roomPositions.push({ x: centerX, y: centerY });

    this.addWalls(walls, centerX, centerY, rng);

    while (walls.length > 0 && roomPositions.length < CONFIG.ROOMS_PER_FLOOR) {
      const wallIndex = rng.nextInt(0, walls.length - 1);
      const wall = walls[wallIndex]!;
      walls.splice(wallIndex, 1);

      let nx = wall.x;
      let ny = wall.y;

      switch (wall.direction) {
        case 'up': ny -= 1; break;
        case 'down': ny += 1; break;
        case 'left': nx -= 1; break;
        case 'right': nx += 1; break;
      }

      if (nx < 0 || nx >= CONFIG.GRID_WIDTH || ny < 0 || ny >= CONFIG.GRID_HEIGHT) {
        continue;
      }

      if (!visited[ny]![nx]!) {
        visited[ny]![nx] = true;
        roomPositions.push({ x: nx, y: ny });
        this.addWalls(walls, nx, ny, rng);
      }
    }

    return roomPositions;
  }

  private addWalls(walls: Wall[], x: number, y: number, rng: SeededRandom): void {
    const directions: Wall[] = [
      { x, y, direction: 'up' },
      { x, y, direction: 'down' },
      { x, y, direction: 'left' },
      { x, y, direction: 'right' }
    ];

    const shuffled = [...directions].sort(() => rng.next() - 0.5);
    for (const wall of shuffled) {
      walls.push(wall);
    }
  }

  private markRooms(rooms: Room[][], positions: Position[]): void {
    for (const pos of positions) {
      rooms[pos.y]![pos.x]!.type = 'EMPTY';
    }
  }

  private connectRooms(rooms: Room[][], positions: Position[], rng: SeededRandom): void {
    const posSet = new Set(positions.map(p => `${p.x},${p.y}`));

    for (const pos of positions) {
      const room = rooms[pos.y]![pos.x]!;

      const directions = [
        { dx: 0, dy: -1, door: 'up', opposite: 'down' },
        { dx: 0, dy: 1, door: 'down', opposite: 'up' },
        { dx: -1, dy: 0, door: 'left', opposite: 'right' },
        { dx: 1, dy: 0, door: 'right', opposite: 'left' }
      ];

      const shuffled = [...directions].sort(() => rng.next() - 0.5);

      for (const dir of shuffled) {
        const nx = pos.x + dir.dx;
        const ny = pos.y + dir.dy;

        if (posSet.has(`${nx},${ny}`)) {
          const neighbor = rooms[ny]![nx]!;
          (room.doors as Record<string, boolean>)[dir.door] = true;
          (neighbor.doors as Record<string, boolean>)[dir.opposite] = true;
        }
      }
    }
  }

  private findFurthestFromCenter(positions: Position[], _furthest: boolean): Position {
    const centerX = (CONFIG.GRID_WIDTH - 1) / 2;
    const centerY = (CONFIG.GRID_HEIGHT - 1) / 2;

    let result = positions[0]!;
    let maxDist = -1;
    let minDist = Infinity;

    for (const pos of positions) {
      const dist = Math.sqrt((pos.x - centerX) ** 2 + (pos.y - centerY) ** 2);
      if (_furthest) {
        if (dist > maxDist) {
          maxDist = dist;
          result = pos;
        }
      } else {
        if (dist < minDist) {
          minDist = dist;
          result = pos;
        }
      }
    }

    return result;
  }

  private assignRoomTypes(
    rooms: Room[][],
    positions: Position[],
    level: number,
    rng: SeededRandom
  ): void {
    const otherPositions = positions.filter(p => {
      const room = rooms[p.y]![p.x]!;
      return room.type === 'EMPTY';
    });

    const shuffled = [...otherPositions].sort(() => rng.next() - 0.5);

    let monsterCount = Math.floor(shuffled.length * 0.25);
    let equipmentCount = Math.floor(shuffled.length * 0.25);
    let trapCount = Math.floor(shuffled.length * 0.1);

    let index = 0;

    while (monsterCount > 0 && index < shuffled.length) {
      const pos = shuffled[index]!;
      const room = rooms[pos.y]![pos.x]!;
      if (room.type === 'EMPTY') {
        room.type = 'MONSTER';
        room.monster = this.createMonster(level, rng);
        monsterCount--;
      }
      index++;
    }

    index = 0;
    while (equipmentCount > 0 && index < shuffled.length) {
      const pos = shuffled[index]!;
      const room = rooms[pos.y]![pos.x]!;
      if (room.type === 'EMPTY') {
        room.type = 'EQUIPMENT';
        room.equipment = this.createEquipment(rng);
        equipmentCount--;
      }
      index++;
    }

    index = 0;
    while (trapCount > 0 && index < shuffled.length) {
      const pos = shuffled[index]!;
      const room = rooms[pos.y]![pos.x]!;
      if (room.type === 'EMPTY') {
        room.type = 'TRAP';
        room.trapDamage = rng.nextInt(5, 10);
        trapCount--;
      }
      index++;
    }
  }

  private createMonster(level: number, rng: SeededRandom): Monster {
    const data = generateMonster(rng, level);
    return {
      id: generateId(),
      name: data.name,
      maxHp: data.hp,
      hp: data.hp,
      attack: data.attack,
      defense: data.defense,
      color: data.color
    };
  }

  private createEquipment(rng: SeededRandom): Equipment {
    const isWeapon = rng.chance(0.5);

    if (isWeapon) {
      const data = generateWeapon(rng);
      return {
        id: generateId(),
        type: 'WEAPON',
        name: data.name,
        attackBonus: data.bonus,
        defenseBonus: 0,
        color: data.color
      };
    } else {
      const data = generateArmor(rng);
      return {
        id: generateId(),
        type: 'ARMOR',
        name: data.name,
        attackBonus: 0,
        defenseBonus: data.bonus,
        color: data.color
      };
    }
  }

  getRoomAt(floor: Floor, x: number, y: number): Room | null {
    if (x < 0 || x >= CONFIG.GRID_WIDTH || y < 0 || y >= CONFIG.GRID_HEIGHT) {
      return null;
    }
    const room = floor.rooms[y]![x];
    if (!room || room.type === 'EMPTY') {
      return null;
    }
    return room;
  }

  canMove(floor: Floor, x: number, y: number, direction: 'up' | 'down' | 'left' | 'right'): boolean {
    const room = this.getRoomAt(floor, x, y);
    if (!room) return false;
    return room.doors[direction];
  }

  getNeighbor(floor: Floor, x: number, y: number, direction: 'up' | 'down' | 'left' | 'right'): Room | null {
    if (!this.canMove(floor, x, y, direction)) return null;

    let nx = x;
    let ny = y;

    switch (direction) {
      case 'up': ny -= 1; break;
      case 'down': ny += 1; break;
      case 'left': nx -= 1; break;
      case 'right': nx += 1; break;
    }

    return this.getRoomAt(floor, nx, ny);
  }
}
