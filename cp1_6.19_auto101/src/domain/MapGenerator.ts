import { Cell, CellType, MapData, MonsterData, TreasureItem } from './types';

const WIDTH = 6;
const HEIGHT = 6;

const MONSTER_TEMPLATES: { name: string; hp: number; attack: number; defense: number; icon: string }[] = [
  { name: '骷髅战士', hp: 30, attack: 8, defense: 4, icon: '💀' },
  { name: '暗影蜘蛛', hp: 20, attack: 12, defense: 2, icon: '🕷️' },
  { name: '哥布林', hp: 25, attack: 6, defense: 3, icon: '👺' },
  { name: '石像鬼', hp: 40, attack: 10, defense: 8, icon: '🗿' },
  { name: '暗夜蝙蝠', hp: 15, attack: 9, defense: 1, icon: '🦇' },
];

const TREASURE_TEMPLATES: Omit<TreasureItem, 'name'>[] = [
  { type: 'weapon', attackBonus: 5, icon: '⚔️' },
  { type: 'armor', defenseBonus: 4, icon: '🛡️' },
  { type: 'potion', hpRestore: 20, icon: '🧪' },
  { type: 'weapon', attackBonus: 8, icon: '🗡️' },
  { type: 'armor', defenseBonus: 6, icon: '🔰' },
  { type: 'potion', hpRestore: 30, icon: '🍷' },
];

const TREASURE_NAMES: Record<string, string[]> = {
  weapon: ['铁剑', '精灵之刃', '暗影匕首'],
  armor: ['链甲', '秘银护胸', '皮甲'],
  potion: ['生命药水', '强效恢复药剂', '圣水'],
};

function shuffle<T>(arr: T[]): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function getEdgeCells(): { x: number; y: number }[] {
  const cells: { x: number; y: number }[] = [];
  for (let x = 0; x < WIDTH; x++) {
    cells.push({ x, y: 0 });
    cells.push({ x, y: HEIGHT - 1 });
  }
  for (let y = 1; y < HEIGHT - 1; y++) {
    cells.push({ x: 0, y });
    cells.push({ x: WIDTH - 1, y });
  }
  return cells;
}

export function generateMap(): MapData {
  const cells: Cell[][] = [];
  for (let y = 0; y < HEIGHT; y++) {
    cells[y] = [];
    for (let x = 0; x < WIDTH; x++) {
      cells[y][x] = { x, y, type: CellType.NORMAL, revealed: false };
    }
  }

  const edgeCells = getEdgeCells();
  const shuffledEdges = shuffle(edgeCells);
  const entrancePos = shuffledEdges[0];

  const oppositeEdge: { x: number; y: number }[] = edgeCells.filter((c) => {
    if (entrancePos.y === 0) return c.y === HEIGHT - 1;
    if (entrancePos.y === HEIGHT - 1) return c.y === 0;
    if (entrancePos.x === 0) return c.x === WIDTH - 1;
    return c.x === 0;
  });
  const exitPos = oppositeEdge[Math.floor(Math.random() * oppositeEdge.length)];

  cells[entrancePos.y][entrancePos.x].type = CellType.ENTRANCE;
  cells[entrancePos.y][entrancePos.x].revealed = true;
  cells[exitPos.y][exitPos.x].type = CellType.EXIT;

  const usedPositions = new Set<string>();
  usedPositions.add(`${entrancePos.x},${entrancePos.y}`);
  usedPositions.add(`${exitPos.x},${exitPos.y}`);

  const specialTypes: CellType[] = [
    CellType.MONSTER,
    CellType.MONSTER,
    CellType.MONSTER,
    CellType.TREASURE,
    CellType.TREASURE,
    CellType.EVENT,
    CellType.EVENT,
  ];

  const allPositions: { x: number; y: number }[] = [];
  for (let y = 0; y < HEIGHT; y++) {
    for (let x = 0; x < WIDTH; x++) {
      if (!usedPositions.has(`${x},${y}`)) {
        allPositions.push({ x, y });
      }
    }
  }

  const shuffledPositions = shuffle(allPositions);

  for (let i = 0; i < specialTypes.length; i++) {
    const pos = shuffledPositions[i];
    cells[pos.y][pos.x].type = specialTypes[i];
    if (specialTypes[i] === CellType.MONSTER) {
      cells[pos.y][pos.x].monsterId = `monster_${pos.x}_${pos.y}`;
    }
  }

  return { cells, width: WIDTH, height: HEIGHT };
}

let monsterCounter = 0;

export function generateMonster(cellX: number, cellY: number): MonsterData {
  const template = MONSTER_TEMPLATES[Math.floor(Math.random() * MONSTER_TEMPLATES.length)];
  const id = `monster_${cellX}_${cellY}_${monsterCounter++}`;
  const variance = () => Math.floor(Math.random() * 5) - 2;
  const hp = template.hp + variance();
  return {
    id,
    name: template.name,
    hp,
    maxHp: hp,
    attack: template.attack + variance(),
    defense: template.defense + variance(),
    icon: template.icon,
  };
}

export function generateTreasure(): TreasureItem {
  const template = TREASURE_TEMPLATES[Math.floor(Math.random() * TREASURE_TEMPLATES.length)];
  const names = TREASURE_NAMES[template.type];
  const name = names[Math.floor(Math.random() * names.length)];
  return {
    name,
    type: template.type,
    attackBonus: template.attackBonus,
    defenseBonus: template.defenseBonus,
    hpRestore: template.hpRestore,
    icon: template.icon,
  };
}
