import {
  Floor, Room, RoomType, Position, Monster, Equipment, CONFIG
} from './types';
import {
  SeededRandom, generateId, generateWeapon, generateArmor, generateMonster
} from './utils';

export class MapGenerator {
  private rng: SeededRandom;

  constructor(seed?: number) {
    this.rng = new SeededRandom(seed);
  }

  regenerate(seed?: number): void {
    this.rng = new SeededRandom(seed ?? Date.now());
  }

  generateAllFloors(): Floor[] {
    const floors: Floor[] = [];
    for (let i = 1; i <= CONFIG.TOTAL_FLOORS; i++) {
      floors.push(this.generateFloor(i));
    }
    return floors;
  }

  generateFloor(level: number): Floor {
    const rooms: Room[][] = [];
    for (let y = 0; y < CONFIG.GRID_HEIGHT; y++) {
      rooms[y] = [];
      for (let x = 0; x < CONFIG.GRID_WIDTH; x++) {
        rooms[y]![x] = this.createEmptyRoom(x, y);
      }
    }

    const selectedPositions = this.selectRoomPositions();
    this.assignRoomTypes(selectedPositions, rooms, level);
    this.ensureConnectivity(selectedPositions, rooms);

    const entrance = this.findRoomByType(rooms, 'ENTRANCE');
    const stairs = this.findRoomByType(rooms, 'STAIRS');
    const bossRoom = level === CONFIG.TOTAL_FLOORS ? this.findRoomByType(rooms, 'BOSS') : undefined;

    return {
      level,
      rooms,
      entrance,
      stairs,
      bossRoom
    };
  }

  private createEmptyRoom(x: number, y: number): Room {
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

  private selectRoomPositions(): Position[] {
    const positions: Position[] = [];
    const centerX = Math.floor(CONFIG.GRID_WIDTH / 2);
    const centerY = Math.floor(CONFIG.GRID_HEIGHT / 2);
    const entrancePos = { x: centerX, y: centerY };
    positions.push(entrancePos);

    while (positions.length < CONFIG.ROOMS_PER_FLOOR) {
      const existingPos = this.rng.pick(positions);
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 }
      ];
      this.rng.pick(directions);

      const shuffled = [...directions].sort(() => this.rng.next() - 0.5);
      let added = false;

      for (const dir of shuffled) {
        const newX = existingPos.x + dir.dx;
        const newY = existingPos.y + dir.dy;

        if (newX >= 0 && newX < CONFIG.GRID_WIDTH &&
            newY >= 0 && newY < CONFIG.GRID_HEIGHT) {
          const exists = positions.some(p => p.x === newX && p.y === newY);
          if (!exists) {
            positions.push({ x: newX, y: newY });
            added = true;
            break;
          }
        }
      }

      if (!added && positions.length < CONFIG.ROOMS_PER_FLOOR) {
        for (let y = 0; y < CONFIG.GRID_HEIGHT && !added; y++) {
          for (let x