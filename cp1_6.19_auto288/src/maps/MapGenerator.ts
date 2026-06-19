import type { MapData, Tile, Room, Monster, MonsterType, Item, MapItem, Position, DecorationType } from '../types';

const MAP_WIDTH = 10;
const MAP_HEIGHT = 10;

const MONSTER_TEMPLATES: Record<MonsterType, { name: string; baseHp: number; baseAtk: number; baseDef: number; exp: number }> = {
  slime: { name: '史莱姆', baseHp: 25, baseAtk: 5, baseDef: 1, exp: 15 },
  goblin: { name: '哥布林', baseHp: 35, baseAtk: 8, baseDef: 2, exp: 25 },
  skeleton: { name: '骷髅兵', baseHp: 45, baseAtk: 10, baseDef: 3, exp: 35 },
  orc: { name: '兽人', baseHp: 65, baseAtk: 14, baseDef: 5, exp: 50 },
  boss: { name: '地牢守护者', baseHp: 200, baseAtk: 20, baseDef: 10, exp: 200 },
};

const WEAPON_NAMES = ['生锈的短剑', '铁剑', '精钢长剑', '火焰之刃', '龙牙剑'];
const ARMOR_NAMES = ['布甲', '皮甲', '锁子甲', '板甲', '龙鳞甲'];
const RARITY_MULTIPLIER = { common: 1, uncommon: 1.5, rare: 2, epic: 3, legendary: 5 };

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function createEmptyTiles(): Tile[][] {
  const tiles: Tile[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: Tile[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push({
        type: 'wall',
        decoration: null,
        x,
        y,
        visible: false,
        explored: false,
      });
    }
    tiles.push(row);
  }
  return tiles;
}

function carveRoom(tiles: Tile[][], room: Room): void {
  for (let y = room.y; y < room.y + room.height; y++) {
    for (let x = room.x; x < room.x + room.width; x++) {
      if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
        tiles[y][x].type = 'room';
      }
    }
  }
}

function carveCorridor(tiles: Tile[][], x1: number, y1: number, x2: number, y2: number): void {
  let x = x1;
  let y = y1;

  while (x !== x2) {
    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
      if (tiles[y][x].type === 'wall') {
        tiles[y][x].type = 'corridor';
      }
    }
    x += x < x2 ? 1 : -1;
  }

  while (y !== y2) {
    if (y >= 0 && y < MAP_HEIGHT && x >= 0 && x < MAP_WIDTH) {
      if (tiles[y][x].type === 'wall') {
        tiles[y][x].type = 'corridor';
      }
    }
    y += y < y2 ? 1 : -1;
  }
}

function roomsOverlap(a: Room, b: Room, padding: number = 1): boolean {
  return (
    a.x - padding < b.x + b.width + padding &&
    a.x + a.width + padding > b.x - padding &&
    a.y - padding < b.y + b.height + padding &&
    a.y + a.height + padding > b.y - padding
  );
}

function getRandomPositionInRoom(room: Room, rand: () => number): Position {
  return {
    x: room.x + 1 + Math.floor(rand() * (room.width - 2)),
    y: room.y + 1 + Math.floor(rand() * (room.height - 2)),
  };
}

function generateMonster(
  position: Position,
  floor: number,
  type: MonsterType,
  rand: () => number,
  isBoss: boolean = false
): Monster {
  const template = MONSTER_TEMPLATES[type];
  const floorMultiplier = 1 + (floor - 1) * 0.25;
  const hpVariance = 0.9 + rand() * 0.2;

  return {
    id: `monster_${Math.random().toString(36).substring(2, 9)}`,
    type,
    name: template.name,
    position,
    hp: Math.floor(template.baseHp * floorMultiplier * hpVariance),
    maxHp: Math.floor(template.baseHp * floorMultiplier * hpVariance),
    attack: Math.floor(template.baseAtk * floorMultiplier),
    defense: Math.floor(template.baseDef * floorMultiplier),
    expReward: Math.floor(template.exp * floorMultiplier),
    isBoss,
  };
}

function generateItem(floor: number, rand: () => number): Item {
  const rarities: Array<'common' | 'uncommon' | 'rare' | 'epic' | 'legendary'> = [
    'common', 'common', 'common', 'uncommon', 'uncommon', 'rare', 'epic', 'legendary'
  ];
  const rarity = rarities[Math.min(Math.floor(rand() * rarities.length), 6 + Math.floor(floor / 2))];
  const mult = RARITY_MULTIPLIER[rarity];
  const itemType = rand();

  if (itemType < 0.35) {
    const tier = Math.min(4, Math.floor(floor / 2));
    return {
      id: `item_${Math.random().toString(36).substring(2, 9)}`,
      name: WEAPON_NAMES[tier],
      type: 'weapon',
      rarity,
      attack: Math.floor((5 + tier * 3) * mult),
    };
  } else if (itemType < 0.7) {
    const tier = Math.min(4, Math.floor(floor / 2));
    return {
      id: `item_${Math.random().toString(36).substring(2, 9)}`,
      name: ARMOR_NAMES[tier],
      type: 'armor',
      rarity,
      defense: Math.floor((3 + tier * 2) * mult),
    };
  } else {
    return {
      id: `item_${Math.random().toString(36).substring(2, 9)}`,
      name: rand() < 0.5 ? '生命药水' : '法力药水',
      type: 'potion',
      rarity: 'common',
      hpRestore: rand() < 0.5 ? Math.floor(30 * mult) : undefined,
      manaRestore: rand() >= 0.5 ? Math.floor(25 * mult) : undefined,
    };
  }
}

function addDecorations(tiles: Tile[][], rooms: Room[], rand: () => number): void {
  for (const room of rooms) {
    const numDecorations = Math.floor(rand() * 2) + 1;
    for (let i = 0; i < numDecorations; i++) {
      const pos = getRandomPositionInRoom(room, rand);
      const decorationTypes: DecorationType[] = ['torch', 'chest', 'rubble', 'bones'];
      const deco = decorationTypes[Math.floor(rand() * decorationTypes.length)];
      if (tiles[pos.y][pos.x].decoration === null) {
        tiles[pos.y][pos.x].decoration = deco;
      }
    }
  }
}

export function generateMap(seed: number, floor: number): MapData {
  const rand = seededRandom(seed + floor * 1000);
  const tiles = createEmptyTiles();
  const rooms: Room[] = [];

  const targetRooms = 3 + Math.floor(rand() * 3);
  let attempts = 0;
  while (rooms.length < targetRooms && attempts < 100) {
    attempts++;
    const width = 2 + Math.floor(rand() * 3);
    const height = 2 + Math.floor(rand() * 3);
    const x = 1 + Math.floor(rand() * (MAP_WIDTH - width - 2));
    const y = 1 + Math.floor(rand() * (MAP_HEIGHT - height - 2));

    const newRoom: Room = {
      x,
      y,
      width,
      height,
      centerX: x + Math.floor(width / 2),
      centerY: y + Math.floor(height / 2),
    };

    let overlaps = false;
    for (const existing of rooms) {
      if (roomsOverlap(newRoom, existing, 1)) {
        overlaps = true;
        break;
      }
    }

    if (!overlaps) {
      carveRoom(tiles, newRoom);
      if (rooms.length > 0) {
        const prev = rooms[rooms.length - 1];
        carveCorridor(
          tiles,
          prev.centerX,
          prev.centerY,
          newRoom.centerX,
          newRoom.centerY
        );
      }
      rooms.push(newRoom);
    }
  }

  addDecorations(tiles, rooms, rand);

  const monsters: Monster[] = [];
  const monsterTypes: MonsterType[] = ['slime', 'goblin', 'skeleton', 'orc'];
  const availableTypes = monsterTypes.slice(0, Math.min(monsterTypes.length, 1 + Math.floor(floor / 2) + 1));

  for (let i = 1; i < rooms.length; i++) {
    const room = rooms[i];
    const roomArea = room.width * room.height;
    const numMonsters = Math.max(1, Math.floor(roomArea * 0.3));

    const usedPositions = new Set<string>();
    for (let j = 0; j < numMonsters; j++) {
      let pos: Position;
      let posKey: string;
      let innerAttempts = 0;
      do {
        pos = getRandomPositionInRoom(room, rand);
        posKey = `${pos.x},${pos.y}`;
        innerAttempts++;
      } while (usedPositions.has(posKey) && innerAttempts < 20);

      if (innerAttempts < 20) {
        usedPositions.add(posKey);
        const type = availableTypes[Math.floor(rand() * availableTypes.length)];
        monsters.push(generateMonster(pos, floor, type, rand, false));
      }
    }
  }

  const bossRoom = rooms[rooms.length - 1];
  const bossPosition: Position = {
    x: bossRoom.centerX,
    y: bossRoom.centerY,
  };
  monsters.push(generateMonster(bossPosition, floor, 'boss', rand, true));

  const items: MapItem[] = [];
  const numItems = 1 + Math.floor(rand() * 2);
  for (let i = 0; i < numItems; i++) {
    const roomIdx = 1 + Math.floor(rand() * (rooms.length - 1));
    const room = rooms[roomIdx];
    const pos = getRandomPositionInRoom(room, rand);
    items.push({
      id: `mapitem_${Math.random().toString(36).substring(2, 9)}`,
      position: pos,
      item: generateItem(floor, rand),
    });
  }

  return {
    width: MAP_WIDTH,
    height: MAP_HEIGHT,
    tiles,
    rooms,
    monsters,
    seed,
    floor,
    bossPosition,
    items,
  };
}

export function getPlayerStartPosition(mapData: MapData): Position {
  if (mapData.rooms.length === 0) {
    return { x: 1, y: 1 };
  }
  const firstRoom = mapData.rooms[0];
  return {
    x: firstRoom.centerX,
    y: firstRoom.centerY,
  };
}
