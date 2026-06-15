export interface PlacedTile {
  tileId: string;
  x: number;
  y: number;
}

export interface CollisionRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface NPCData {
  id: string;
  x: number;
  y: number;
  direction: 'up' | 'down' | 'left' | 'right';
  dialog: string;
}

export const GRID_WIDTH = 20;
export const GRID_HEIGHT = 15;
export const CELL_SIZE = 50;

export type TileCategory = 'ground' | 'wall' | 'decoration' | 'npc';

export interface TileDef {
  id: string;
  name: string;
  category: TileCategory;
  emoji: string;
  color: string;
  walkable: boolean;
}

export const TILE_DEFS: TileDef[] = [
  { id: 'grass', name: '草地', category: 'ground', emoji: '🌿', color: '#3a7d44', walkable: true },
  { id: 'stone', name: '石板路', category: 'ground', emoji: '🧱', color: '#6b7280', walkable: true },
  { id: 'water', name: '水域', category: 'ground', emoji: '🌊', color: '#2563eb', walkable: false },
  { id: 'sand', name: '沙地', category: 'ground', emoji: '🏜️', color: '#d4a574', walkable: true },
  { id: 'wall_stone', name: '石墙', category: 'wall', emoji: '🪨', color: '#4b5563', walkable: false },
  { id: 'wall_wood', name: '木墙', category: 'wall', emoji: '🪵', color: '#92400e', walkable: false },
  { id: 'tree', name: '树木', category: 'decoration', emoji: '🌳', color: '#166534', walkable: false },
  { id: 'flower', name: '花丛', category: 'decoration', emoji: '🌸', color: '#ec4899', walkable: true },
  { id: 'chest', name: '宝箱', category: 'decoration', emoji: '📦', color: '#b45309', walkable: false },
  { id: 'fountain', name: '喷泉', category: 'decoration', emoji: '⛲', color: '#0ea5e9', walkable: false },
  { id: 'npc_villager', name: '村民', category: 'npc', emoji: '👨‍🌾', color: '#854d0e', walkable: false },
  { id: 'npc_merchant', name: '商人', category: 'npc', emoji: '🧙', color: '#7c3aed', walkable: false },
  { id: 'npc_guard', name: '守卫', category: 'npc', emoji: '🛡️', color: '#dc2626', walkable: false },
];

function buildGround(baseTile: string, specials: Array<{ tileId: string; x: number; y: number }>): PlacedTile[] {
  const tiles: PlacedTile[] = [];
  for (let y = 0; y < GRID_HEIGHT; y++) {
    for (let x = 0; x < GRID_WIDTH; x++) {
      tiles.push({ tileId: baseTile, x, y });
    }
  }
  specials.forEach((s) => {
    const idx = tiles.findIndex((t) => t.x === s.x && t.y === s.y);
    if (idx >= 0) tiles[idx] = { tileId: s.tileId, x: s.x, y: s.y };
  });
  return tiles;
}

export function getSampleMap(): {
  tiles: PlacedTile[];
  collisions: CollisionRect[];
  npcs: NPCData[];
} {
  const specials: Array<{ tileId: string; x: number; y: number }> = [];

  for (let x = 5; x <= 14; x++) {
    specials.push({ tileId: 'stone', x, y: 7 });
  }
  for (let y = 3; y <= 11; y++) {
    specials.push({ tileId: 'stone', x: 9, y });
  }

  for (let y = 2; y <= 4; y++) {
    for (let x = 2; x <= 4; x++) {
      specials.push({ tileId: 'water', x, y });
    }
  }

  for (let y = 10; y <= 12; y++) {
    for (let x = 15; x <= 17; x++) {
      specials.push({ tileId: 'sand', x, y });
    }
  }

  const tiles = buildGround('grass', specials);

  const decorations: PlacedTile[] = [
    { tileId: 'tree', x: 0, y: 0 },
    { tileId: 'tree', x: 1, y: 0 },
    { tileId: 'tree', x: 0, y: 1 },
    { tileId: 'tree', x: 19, y: 0 },
    { tileId: 'tree', x: 18, y: 0 },
    { tileId: 'tree', x: 19, y: 1 },
    { tileId: 'tree', x: 0, y: 14 },
    { tileId: 'tree', x: 1, y: 14 },
    { tileId: 'tree', x: 19, y: 14 },
    { tileId: 'tree', x: 18, y: 14 },
    { tileId: 'tree', x: 6, y: 2 },
    { tileId: 'tree', x: 13, y: 2 },
    { tileId: 'tree', x: 6, y: 12 },
    { tileId: 'tree', x: 13, y: 12 },
    { tileId: 'flower', x: 3, y: 8 },
    { tileId: 'flower', x: 4, y: 9 },
    { tileId: 'flower', x: 15, y: 5 },
    { tileId: 'flower', x: 16, y: 6 },
    { tileId: 'chest', x: 7, y: 3 },
    { tileId: 'fountain', x: 9, y: 7 },
  ];

  decorations.forEach((d) => {
    const idx = tiles.findIndex((t) => t.x === d.x && t.y === d.y);
    if (idx >= 0) tiles[idx] = d;
  });

  const collisions: CollisionRect[] = [
    { x: 10, y: 5, width: 2, height: 1 },
    { x: 10, y: 5, width: 1, height: 2 },
    { x: 7, y: 9, width: 2, height: 1 },
    { x: 8, y: 9, width: 1, height: 2 },
  ];

  const npcs: NPCData[] = [
    {
      id: 'npc_1',
      x: 5,
      y: 7,
      direction: 'right',
      dialog: '你好，冒险者！欢迎来到我们的小镇。沿着这条石板路向前走，可以到达中央广场。',
    },
    {
      id: 'npc_2',
      x: 14,
      y: 7,
      direction: 'left',
      dialog: '我是镇上的商人，如果你有什么需要的东西，尽管来找我！不过我今天没带货物...',
    },
    {
      id: 'npc_3',
      x: 9,
      y: 11,
      direction: 'up',
      dialog: '守卫在此！北方的森林里最近出现了一些奇怪的声响，你要小心行事。',
    },
  ];

  return { tiles, collisions, npcs };
}
