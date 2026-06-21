import { v4 as uuidv4 } from 'uuid';
import { MapData, Tile, Room, Position, Monster, Chest, Item, ItemRarity } from '@/types';

const TILE_SIZE = 32;
const MAP_WIDTH = 40;
const MAP_HEIGHT = 30;
const MIN_ROOM_SIZE = 4;
const MAX_ROOM_SIZE = 8;
const MAX_ROOMS = 12;

export class MapGenerator {
  static generate(floor: number): {
    map: MapData;
    monsters: Monster[];
    chests: Chest[];
    heroStart: Position;
    stairs: Position;
  } {
    const startTime = performance.now();
    const tiles: Tile[][] = [];
    const rooms: Room[] = [];

    for (let y = 0; y < MAP_HEIGHT; y++) {
      tiles[y] = [];
      for (let x = 0; x < MAP_WIDTH; x++) {
        tiles[y][x] = { type: 'wall', explored: false, visible: false };
      }
    }

    for (let i = 0; i < MAX_ROOMS; i++) {
      const w = Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE + 1)) + MIN_ROOM_SIZE;
      const h = Math.floor(Math.random() * (MAX_ROOM_SIZE - MIN_ROOM_SIZE + 1)) + MIN_ROOM_SIZE;
      const x = Math.floor(Math.random() * (MAP_WIDTH - w - 2)) + 1;
      const y = Math.floor(Math.random() * (MAP_HEIGHT - h - 2)) + 1;

      const newRoom: Room = {
        x, y, width: w, height: h,
        center: { x: Math.floor(x + w / 2), y: Math.floor(y + h / 2) }
      };

      let overlaps = false;
      for (const room of rooms) {
        if (this.roomsOverlap(newRoom, room)) {
          overlaps = true;
          break;
        }
      }

      if (!overlaps) {
        this.carveRoom(tiles, newRoom);

        if (rooms.length > 0) {
          const prevRoom = rooms[rooms.length - 1];
          if (Math.random() > 0.5) {
            this.carveHorizontalCorridor(tiles, prevRoom.center.x, newRoom.center.x, prevRoom.center.y);
            this.carveVerticalCorridor(tiles, prevRoom.center.y, newRoom.center.y, newRoom.center.x);
          } else {
            this.carveVerticalCorridor(tiles, prevRoom.center.y, newRoom.center.y, prevRoom.center.x);
            this.carveHorizontalCorridor(tiles, prevRoom.center.x, newRoom.center.x, newRoom.center.y);
          }
        }

        rooms.push(newRoom);
      }
    }

    const heroStart = { ...rooms[0].center };
    const stairsRoom = rooms[rooms.length - 1];
    const stairs = { ...stairsRoom.center };
    tiles[stairs.y][stairs.x].type = 'stairs';

    const monsters = this.spawnMonsters(rooms, floor);
    const chests = this.spawnChests(rooms, floor);

    const endTime = performance.now();
    console.log(`Map generated in ${(endTime - startTime).toFixed(2)}ms`);

    return {
      map: {
        tiles,
        rooms,
        width: MAP_WIDTH,
        height: MAP_HEIGHT,
        tileSize: TILE_SIZE,
      },
      monsters,
      chests,
      heroStart,
      stairs,
    };
  }

  private static roomsOverlap(r1: Room, r2: Room): boolean {
    return (
      r1.x < r2.x + r2.width + 1 &&
      r1.x + r1.width + 1 > r2.x &&
      r1.y < r2.y + r2.height + 1 &&
      r1.y + r1.height + 1 > r2.y
    );
  }

  private static carveRoom(tiles: Tile[][], room: Room) {
    for (let y = room.y; y < room.y + room.height; y++) {
      for (let x = room.x; x < room.x + room.width; x++) {
        if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
          tiles[y][x].type = 'floor';
        }
      }
    }
  }

  private static carveHorizontalCorridor(tiles: Tile[][], x1: number, x2: number, y: number) {
    const start = Math.min(x1, x2);
    const end = Math.max(x1, x2);
    for (let x = start; x <= end; x++) {
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        tiles[y][x].type = 'floor';
      }
    }
  }

  private static carveVerticalCorridor(tiles: Tile[][], y1: number, y2: number, x: number) {
    const start = Math.min(y1, y2);
    const end = Math.max(y1, y2);
    for (let y = start; y <= end; y++) {
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        tiles[y][x].type = 'floor';
      }
    }
  }

  private static spawnMonsters(rooms: Room[], floor: number): Monster[] {
    const monsters: Monster[] = [];
    const monsterTypes = [
      { name: '史莱姆', sprite: 'slime', baseHp: 20, baseAtk: 5, baseDef: 2 },
      { name: '哥布林', sprite: 'goblin', baseHp: 30, baseAtk: 8, baseDef: 3 },
      { name: '骷髅兵', sprite: 'skeleton', baseHp: 40, baseAtk: 12, baseDef: 5 },
      { name: '暗影蝙蝠', sprite: 'bat', baseHp: 15, baseAtk: 10, baseDef: 1 },
      { name: '石像鬼', sprite: 'gargoyle', baseHp: 50, baseAtk: 15, baseDef: 8 },
    ];

    for (let i = 1; i < rooms.length - 1; i++) {
      const room = rooms[i];
      const count = Math.floor(Math.random() * 2) + 1;

      for (let j = 0; j < count; j++) {
        const typeIndex = Math.min(
          Math.floor(Math.random() * Math.min(monsterTypes.length, 2 + Math.floor(floor / 2))),
          monsterTypes.length - 1
        );
        const type = monsterTypes[typeIndex];

        const mx = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
        const my = room.y + 1 + Math.floor(Math.random() * (room.height - 2));

        const floorMultiplier = 1 + (floor - 1) * 0.2;

        monsters.push({
          id: uuidv4(),
          name: type.name,
          position: { x: mx, y: my },
          hp: Math.floor(type.baseHp * floorMultiplier),
          maxHp: Math.floor(type.baseHp * floorMultiplier),
          attack: Math.floor(type.baseAtk * floorMultiplier),
          defense: Math.floor(type.baseDef * floorMultiplier),
          sprite: type.sprite,
          isHit: false,
          hitFrame: 0,
        });
      }
    }

    return monsters;
  }

  private static spawnChests(rooms: Room[], floor: number): Chest[] {
    const chests: Chest[] = [];
    const numChests = Math.floor(Math.random() * 3) + 2;

    for (let i = 0; i < numChests && i < rooms.length - 2; i++) {
      const roomIndex = 1 + Math.floor(Math.random() * (rooms.length - 2));
      const room = rooms[roomIndex];

      const cx = room.x + 1 + Math.floor(Math.random() * (room.width - 2));
      const cy = room.y + 1 + Math.floor(Math.random() * (room.height - 2));

      chests.push({
        id: uuidv4(),
        position: { x: cx, y: cy },
        opened: false,
        items: this.generateChestItems(floor),
      });
    }

    return chests;
  }

  private static generateChestItems(floor: number): Item[] {
    const items: Item[] = [];
    const numItems = Math.floor(Math.random() * 2) + 1;

    for (let i = 0; i < numItems; i++) {
      items.push(this.generateRandomItem(floor));
    }

    return items;
  }

  static generateRandomItem(floor: number): Item {
    const types: ('weapon' | 'shield' | 'potion')[] = ['weapon', 'shield', 'potion'];
    const type = types[Math.floor(Math.random() * types.length)];
    const rarityRoll = Math.random();
    let rarity: ItemRarity = 'common';
    if (rarityRoll > 0.95) rarity = 'legendary';
    else if (rarityRoll > 0.8) rarity = 'epic';
    else if (rarityRoll > 0.5) rarity = 'rare';

    const rarityMultiplier = { common: 1, rare: 1.5, epic: 2, legendary: 3 }[rarity];
    const floorBonus = 1 + (floor - 1) * 0.15;

    const weaponNames = ['短剑', '长剑', '巨剑', '魔剑', '龙牙剑'];
    const shieldNames = ['木盾', '铁盾', '骑士盾', '符文盾', '圣光盾'];
    const potionNames = ['小型药水', '中型药水', '大型药水', '超强药水', '神圣药水'];

    let name = '';
    let attackBonus = 0;
    let defenseBonus = 0;
    let healAmount = 0;

    if (type === 'weapon') {
      name = weaponNames[Math.min(Math.floor(floor / 2), weaponNames.length - 1)];
      attackBonus = Math.floor((5 + Math.random() * 5) * rarityMultiplier * floorBonus);
    } else if (type === 'shield') {
      name = shieldNames[Math.min(Math.floor(floor / 2), shieldNames.length - 1)];
      defenseBonus = Math.floor((3 + Math.random() * 4) * rarityMultiplier * floorBonus);
    } else {
      name = potionNames[Math.min(Math.floor(floor / 2), potionNames.length - 1)];
      healAmount = Math.floor((20 + Math.random() * 20) * rarityMultiplier * floorBonus);
    }

    const rarityPrefix = { common: '', rare: '精良', epic: '史诗', legendary: '传说' }[rarity];
    if (rarityPrefix) name = rarityPrefix + name;

    return {
      id: uuidv4(),
      name,
      type,
      rarity,
      attackBonus,
      defenseBonus,
      healAmount,
      description: this.generateItemDescription(type, attackBonus, defenseBonus, healAmount),
    };
  }

  private static generateItemDescription(type: string, atk: number, def: number, heal: number): string {
    if (type === 'weapon') return `攻击力 +${atk}`;
    if (type === 'shield') return `防御力 +${def}`;
    return `恢复 ${heal} 生命值`;
  }

  static updateVisibility(map: MapData, heroPos: Position, viewRadius: number = 8) {
    for (let y = 0; y < map.height; y++) {
      for (let x = 0; x < map.width; x++) {
        map.tiles[y][x].visible = false;
      }
    }

    for (let dy = -viewRadius; dy <= viewRadius; dy++) {
      for (let dx = -viewRadius; dx <= viewRadius; dx++) {
        const x = heroPos.x + dx;
        const y = heroPos.y + dy;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist <= viewRadius && x >= 0 && x < map.width && y >= 0 && y < map.height) {
          if (this.hasLineOfSight(map, heroPos, { x, y })) {
            map.tiles[y][x].visible = true;
            map.tiles[y][x].explored = true;
          }
        }
      }
    }
  }

  private static hasLineOfSight(map: MapData, from: Position, to: Position): boolean {
    const dx = Math.abs(to.x - from.x);
    const dy = Math.abs(to.y - from.y);
    const sx = from.x < to.x ? 1 : -1;
    const sy = from.y < to.y ? 1 : -1;
    let err = dx - dy;
    let x = from.x;
    let y = from.y;

    while (x !== to.x || y !== to.y) {
      if (map.tiles[y][x].type === 'wall') return false;

      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x += sx; }
      if (e2 < dx) { err += dx; y += sy; }
    }

    return true;
  }
}
