import type { Room, RoomType, Monster, Equipment, EquipmentSlot, EquipmentQuality } from './types';

interface SeededRandom {
  next: () => number;
}

function createSeededRandom(seed: number): SeededRandom {
  let s = seed;
  return {
    next: () => {
      s = (s * 16807 + 0) % 2147483647;
      return (s - 1) / 2147483646;
    },
  };
}

const GRID_SIZE = 6;
const MAX_BACKPACK = 16;

const MONSTER_NAMES = [
  '暗影蝙蝠', '腐化蜘蛛', '幽灵骑士', '暗夜猎手',
  '深渊蠕虫', '虚空行者', '堕落守卫', '噬魂者',
  '枯萎魔像', '血月狼人', '疫病食尸鬼', '冥界刺客',
];

const BOSS_NAMES = ['深渊领主', '虚空之王', '末日审判者', '混沌巨兽', '永恒梦魇'];

const WEAPON_NAMES: Record<EquipmentQuality, string[]> = {
  white: ['生锈短剑', '木棒', '石斧'],
  blue: ['精钢长剑', '符文匕首', '战锤'],
  purple: ['暗影之刃', '龙骨大剑', '虚空法杖'],
  orange: ['灭世者', '天界之怒', '命运裁决'],
};

const HELMET_NAMES: Record<EquipmentQuality, string[]> = {
  white: ['布帽', '皮头盔'],
  blue: ['精钢头盔', '符文头冠'],
  purple: ['暗影兜帽', '龙角盔'],
  orange: ['天界之冠', '命运面甲'],
};

const ARMOR_NAMES: Record<EquipmentQuality, string[]> = {
  white: ['布甲', '皮甲'],
  blue: ['精钢铠甲', '符文法袍'],
  purple: ['暗影战甲', '龙鳞铠'],
  orange: ['天界圣铠', '命运战甲'],
};

const BOOTS_NAMES: Record<EquipmentQuality, string[]> = {
  white: ['布鞋', '皮靴'],
  blue: ['精钢战靴', '符文便鞋'],
  purple: ['暗影之靴', '龙翼靴'],
  orange: ['天界之履', '命运步伐'],
};

const SLOT_NAMES: Record<EquipmentSlot, Record<EquipmentQuality, string[]>> = {
  weapon: WEAPON_NAMES,
  helmet: HELMET_NAMES,
  armor: ARMOR_NAMES,
  boots: BOOTS_NAMES,
};

function randomInt(rng: SeededRandom, min: number, max: number): number {
  return Math.floor(rng.next() * (max - min + 1)) + min;
}

function randomChoice<T>(rng: SeededRandom, arr: T[]): T {
  return arr[Math.floor(rng.next() * arr.length)];
}

function generateEquipment(rng: SeededRandom, floor: number): Equipment {
  const roll = rng.next();
  let quality: EquipmentQuality;
  const floorBonus = Math.min(floor * 0.02, 0.15);
  if (roll < 0.05 + floorBonus * 0.5) quality = 'orange';
  else if (roll < 0.20 + floorBonus) quality = 'purple';
  else if (roll < 0.50 + floorBonus) quality = 'blue';
  else quality = 'white';

  const slot: EquipmentSlot = randomChoice(rng, ['weapon', 'helmet', 'armor', 'boots'] as EquipmentSlot[]);
  const names = SLOT_NAMES[slot][quality];
  const name = randomChoice(rng, names);
  const qualityMultiplier: Record<EquipmentQuality, number> = { white: 1, blue: 1.5, purple: 2.5, orange: 4 };
  const floorMult = 1 + floor * 0.15;
  const baseAttack = slot === 'weapon' ? 5 : slot === 'helmet' ? 1 : slot === 'armor' ? 0 : 2;
  const baseDefense = slot === 'armor' ? 5 : slot === 'helmet' ? 3 : slot === 'boots' ? 2 : 0;

  return {
    id: `eq_${Date.now()}_${Math.floor(rng.next() * 100000)}`,
    name,
    slot,
    quality,
    attackBonus: Math.round(baseAttack * qualityMultiplier[quality] * floorMult),
    defenseBonus: Math.round(baseDefense * qualityMultiplier[quality] * floorMult),
  };
}

function generateMonster(rng: SeededRandom, floor: number, isBoss: boolean): Monster {
  const floorMult = 1 + floor * 0.2;
  const baseHp = isBoss ? 120 : 40;
  const baseAtk = isBoss ? 15 : 8;
  const name = isBoss
    ? randomChoice(rng, BOSS_NAMES)
    : randomChoice(rng, MONSTER_NAMES);

  return {
    name,
    hp: Math.round(baseHp * floorMult * (isBoss ? 3 : 1)),
    maxHp: Math.round(baseHp * floorMult * (isBoss ? 3 : 1)),
    attack: Math.round(baseAtk * floorMult * (isBoss ? 1.5 : 1)),
    isBoss,
    specialSkill: isBoss
      ? {
          name: '范围攻击',
          damage: Math.round(20 * floorMult),
          cooldown: 3,
          currentCooldown: 0,
        }
      : null,
  };
}

export function generateDungeon(seed: number, floor: number): Room[][] {
  const rng = createSeededRandom(seed);
  const grid: Room[][] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      const w = randomInt(rng, 1, 2);
      const h = randomInt(rng, 1, 2);
      grid[y][x] = {
        id: `room_${x}_${y}`,
        x,
        y,
        width: w,
        height: h,
        type: 'empty' as RoomType,
        connections: [],
        cleared: false,
        monster: null,
        loot: [],
        visited: false,
      };
    }
  }

  const path: { x: number; y: number }[] = [];
  let cx = 0;
  let cy = 0;
  path.push({ x: cx, y: cy });

  while (cx < GRID_SIZE - 1 || cy < GRID_SIZE - 1) {
    if (cx >= GRID_SIZE - 1) {
      cy++;
    } else if (cy >= GRID_SIZE - 1) {
      cx++;
    } else if (rng.next() < 0.5) {
      cx++;
    } else {
      cy++;
    }
    path.push({ x: cx, y: cy });
  }

  for (let i = 0; i < path.length - 1; i++) {
    const curr = path[i];
    const next = path[i + 1];
    const currRoom = grid[curr.y][curr.x];
    const nextRoom = grid[next.y][next.x];
    if (!currRoom.connections.includes(nextRoom.id)) {
      currRoom.connections.push(nextRoom.id);
    }
    if (!nextRoom.connections.includes(currRoom.id)) {
      nextRoom.connections.push(currRoom.id);
    }
  }

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (rng.next() < 0.35) {
        const dirs = [
          { dx: 1, dy: 0 },
          { dx: 0, dy: 1 },
        ];
        for (const d of dirs) {
          const nx = x + d.dx;
          const ny = y + d.dy;
          if (nx < GRID_SIZE && ny < GRID_SIZE && rng.next() < 0.4) {
            const roomA = grid[y][x];
            const roomB = grid[ny][nx];
            if (!roomA.connections.includes(roomB.id)) {
              roomA.connections.push(roomB.id);
            }
            if (!roomB.connections.includes(roomA.id)) {
              roomB.connections.push(roomA.id);
            }
          }
        }
      }
    }
  }

  grid[0][0].type = 'start';
  grid[0][0].cleared = true;
  grid[0][0].visited = true;

  const endRoom = grid[GRID_SIZE - 1][GRID_SIZE - 1];
  endRoom.type = 'exit';

  const isBossFloor = floor > 0 && floor % 5 === 4;
  if (isBossFloor) {
    const bossRoom = grid[GRID_SIZE - 2][GRID_SIZE - 2];
    bossRoom.type = 'boss';
    bossRoom.monster = generateMonster(rng, floor, true);
  }

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (grid[y][x].type !== 'empty') continue;
      const roll = rng.next();
      if (roll < 0.25) {
        grid[y][x].type = 'monster';
        grid[y][x].monster = generateMonster(rng, floor, false);
      } else if (roll < 0.4) {
        grid[y][x].type = 'chest';
        const lootCount = randomInt(rng, 1, 2);
        for (let i = 0; i < lootCount; i++) {
          grid[y][x].loot.push(generateEquipment(rng, floor));
        }
      }
    }
  }

  return grid;
}

export { generateEquipment, MAX_BACKPACK, GRID_SIZE };
