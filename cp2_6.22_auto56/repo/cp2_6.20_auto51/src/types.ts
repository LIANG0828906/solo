export type ItemId =
  | 'screwdriver'
  | 'key_small'
  | 'key_large'
  | 'note_cipher'
  | 'photo'
  | 'puzzle_piece_1'
  | 'puzzle_piece_2'
  | 'puzzle_piece_3'
  | 'map_complete'
  | 'battery'
  | 'flashlight';

export type FurnitureId =
  | 'bookshelf'
  | 'desk'
  | 'drawer'
  | 'fireplace'
  | 'safe'
  | 'clock'
  | 'painting'
  | 'door';

export type PuzzleType = 'number' | 'pattern' | 'assembly';

export interface Item {
  id: ItemId;
  name: string;
  icon: string;
  description: string;
}

export type CombinationTarget = FurnitureId | ItemId;

export interface CombinationRule {
  id: string;
  itemId: ItemId;
  targetId: CombinationTarget;
  targetIsItem?: boolean;
  requiredItems?: ItemId[];
  resultItem?: ItemId;
  action: string;
  unlocksFurniture?: FurnitureId;
  unlocksPuzzle?: string;
  triggersLayer?: 1 | 2 | 3;
}

export interface HiddenItem {
  itemId: ItemId;
  position: { x: number; y: number };
  collected: boolean;
  requiresItem?: ItemId;
}

export interface Furniture {
  id: FurnitureId;
  name: string;
  position: { x: number; y: number; w: number; h: number };
  color: string;
  acceptsCombinationsWith: ItemId[];
  hiddenItems: HiddenItem[];
  hasPuzzle?: string;
  locked?: boolean;
  unlockedBy?: ItemId;
}

export interface Puzzle {
  id: string;
  type: PuzzleType;
  title: string;
  hint: string;
  targetFurnitureId: FurnitureId;
  solution: string | string[];
  rewards?: ItemId[];
  unlocksLayer: 1 | 2 | 3;
  nextPuzzle?: string;
}

export interface PuzzleChainProgress {
  layer1: boolean;
  layer2: boolean;
  layer3: boolean;
}

export interface FlashEvent {
  id: string;
  position: { x: number; y: number };
  type: 'puzzle_solve' | 'item_pickup';
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface GameState {
  collectedItems: ItemId[];
  selectedItem: ItemId | null;
  furniture: Record<FurnitureId, Furniture>;
  puzzles: Record<string, Puzzle>;
  activePuzzleId: string | null;
  puzzleChain: PuzzleChainProgress;
  completedPuzzles: string[];
  activeFurnitureOverlay: FurnitureId | null;
  overlayClickPosition: { x: number; y: number } | null;
  victory: boolean;
  draggedItemId: ItemId | null;
  dropHoverTarget: FurnitureId | null;
  flashEvents: FlashEvent[];
  particles: Particle[];
  itemBarCollapsed: boolean;
  highlightNewItem: ItemId | null;
  addItem: (itemId: ItemId) => void;
  removeItem: (itemId: ItemId) => void;
  setSelectedItem: (itemId: ItemId | null) => void;
  openFurnitureOverlay: (id: FurnitureId, clickPos?: { x: number; y: number }) => void;
  closeFurnitureOverlay: () => void;
  collectHiddenItem: (furnitureId: FurnitureId, itemId: ItemId) => void;
  tryCombine: (itemId: ItemId, targetFurnitureId: FurnitureId) => boolean;
  openPuzzle: (puzzleId: string) => void;
  closePuzzle: () => void;
  solvePuzzle: (puzzleId: string, triggerPos?: { x: number; y: number }) => void;
  setDraggedItem: (itemId: ItemId | null) => void;
  setDropHoverTarget: (target: FurnitureId | null) => void;
  addFlashEvent: (position: { x: number; y: number }, type: 'puzzle_solve' | 'item_pickup') => void;
  spawnParticles: (origin: { x: number; y: number }, color?: string, count?: number) => void;
  clearFlashEvent: (id: string) => void;
  clearParticle: (id: string) => void;
  toggleItemBarCollapsed: () => void;
  setItemBarCollapsed: (collapsed: boolean) => void;
  setHighlightNewItem: (itemId: ItemId | null) => void;
  reset: () => void;
}

export const ALL_ITEMS: Record<ItemId, Item> = {
  screwdriver: {
    id: 'screwdriver',
    name: '螺丝刀',
    icon: '🪛',
    description: '一把生锈的平头螺丝刀，可以撬开一些固定的东西。',
  },
  key_small: {
    id: 'key_small',
    name: '小铜钥匙',
    icon: '🔑',
    description: '一把精致的小铜钥匙，可能用于抽屉或小箱子。',
  },
  key_large: {
    id: 'key_large',
    name: '大铁门钥匙',
    icon: '🗝️',
    description: '一把沉甸甸的大钥匙，看起来就是开大门用的。',
  },
  note_cipher: {
    id: 'note_cipher',
    name: '密码纸条',
    icon: '📜',
    description: '纸条上写着："钟表指向的时刻，就是打开秘密的数字。"',
  },
  photo: {
    id: 'photo',
    name: '旧照片',
    icon: '🖼️',
    description: '一张泛黄的照片，背面写着三个符号：△○□',
  },
  puzzle_piece_1: {
    id: 'puzzle_piece_1',
    name: '图纸碎片·上',
    icon: '🧩',
    description: '一块图纸碎片，似乎是地图的左上角部分。',
  },
  puzzle_piece_2: {
    id: 'puzzle_piece_2',
    name: '图纸碎片·中',
    icon: '🧩',
    description: '一块图纸碎片，中间部分有山脉和路线。',
  },
  puzzle_piece_3: {
    id: 'puzzle_piece_3',
    name: '图纸碎片·下',
    icon: '🧩',
    description: '一块图纸碎片，底部标注了X记号。',
  },
  map_complete: {
    id: 'map_complete',
    name: '完整地图',
    icon: '🗺️',
    description: '拼接好的地图，X的位置标注了：壁炉第三块砖。',
  },
  battery: {
    id: 'battery',
    name: '干电池',
    icon: '🔋',
    description: '一节还能用的干电池。',
  },
  flashlight: {
    id: 'flashlight',
    name: '手电筒',
    icon: '🔦',
    description: '一个亮着的手电筒，可以照亮黑暗的角落。',
  },
};

export const COMBINATION_RULES: CombinationRule[] = [
  {
    id: 'rule_1',
    itemId: 'screwdriver',
    targetId: 'drawer',
    action: '用螺丝刀撬开抽屉',
    unlocksFurniture: 'drawer',
    triggersLayer: 1,
  },
  {
    id: 'rule_2',
    itemId: 'key_small',
    targetId: 'safe',
    action: '用小钥匙打开保险箱',
    unlocksPuzzle: 'puzzle_safe',
    triggersLayer: 2,
  },
  {
    id: 'rule_3',
    itemId: 'note_cipher',
    targetId: 'safe',
    action: '参考纸条上的密码线索',
  },
  {
    id: 'rule_4',
    itemId: 'photo',
    targetId: 'painting',
    action: '对比照片上的符号',
    triggersLayer: 2,
  },
  {
    id: 'rule_5',
    itemId: 'battery',
    targetId: 'flashlight',
    targetIsItem: true,
    requiredItems: ['flashlight'],
    resultItem: 'flashlight',
    action: '给手电筒装上电池',
  },
  {
    id: 'rule_6',
    itemId: 'map_complete',
    targetId: 'fireplace',
    action: '根据地图找到壁炉暗格',
    unlocksFurniture: 'fireplace',
    triggersLayer: 3,
  },
  {
    id: 'rule_7',
    itemId: 'key_large',
    targetId: 'door',
    action: '用大钥匙打开大门，逃出密室！',
  },
];

export const INITIAL_FURNITURE: Record<FurnitureId, Furniture> = {
  bookshelf: {
    id: 'bookshelf',
    name: '书架',
    position: { x: 5, y: 5, w: 22, h: 28 },
    color: '#8b5a2b',
    acceptsCombinationsWith: [],
    hiddenItems: [
      { itemId: 'screwdriver', position: { x: 30, y: 65 }, collected: false },
      { itemId: 'puzzle_piece_1', position: { x: 70, y: 30 }, collected: false },
    ],
  },
  desk: {
    id: 'desk',
    name: '书桌',
    position: { x: 35, y: 40, w: 30, h: 20 },
    color: '#a0724a',
    acceptsCombinationsWith: [],
    hiddenItems: [
      { itemId: 'note_cipher', position: { x: 25, y: 45 }, collected: false },
      { itemId: 'photo', position: { x: 75, y: 40 }, collected: false },
    ],
  },
  drawer: {
    id: 'drawer',
    name: '抽屉柜',
    position: { x: 70, y: 45, w: 18, h: 28 },
    color: '#6d4423',
    acceptsCombinationsWith: ['screwdriver'],
    locked: true,
    unlockedBy: 'screwdriver',
    hiddenItems: [
      { itemId: 'key_small', position: { x: 50, y: 55 }, collected: false, requiresItem: 'screwdriver' },
      { itemId: 'battery', position: { x: 50, y: 80 }, collected: false, requiresItem: 'screwdriver' },
    ],
  },
  fireplace: {
    id: 'fireplace',
    name: '壁炉',
    position: { x: 45, y: 5, w: 25, h: 25 },
    color: '#5c3317',
    acceptsCombinationsWith: ['map_complete'],
    locked: true,
    unlockedBy: 'map_complete',
    hiddenItems: [
      {
        itemId: 'puzzle_piece_2',
        position: { x: 40, y: 50 },
        collected: false,
      },
      {
        itemId: 'key_large',
        position: { x: 60, y: 75 },
        collected: false,
        requiresItem: 'map_complete',
      },
    ],
  },
  safe: {
    id: 'safe',
    name: '保险箱',
    position: { x: 5, y: 70, w: 20, h: 22 },
    color: '#4a4a4a',
    acceptsCombinationsWith: ['key_small', 'note_cipher'],
    hasPuzzle: 'puzzle_safe',
    hiddenItems: [],
  },
  clock: {
    id: 'clock',
    name: '老式挂钟',
    position: { x: 30, y: 10, w: 10, h: 14 },
    color: '#8b6914',
    acceptsCombinationsWith: [],
    hiddenItems: [],
  },
  painting: {
    id: 'painting',
    name: '墙上画框',
    position: { x: 78, y: 8, w: 15, h: 18 },
    color: '#3d2b1f',
    acceptsCombinationsWith: ['photo'],
    hasPuzzle: 'puzzle_pattern',
    hiddenItems: [],
  },
  door: {
    id: 'door',
    name: '密室大门',
    position: { x: 92, y: 35, w: 7, h: 35 },
    color: '#3d2914',
    acceptsCombinationsWith: ['key_large'],
    hiddenItems: [],
  },
};

export const INITIAL_PUZZLES: Record<string, Puzzle> = {
  puzzle_safe: {
    id: 'puzzle_safe',
    type: 'number',
    title: '保险箱密码锁',
    hint: '提示：注意挂钟指针指向的时间...（时、分、秒对应3位数字）',
    targetFurnitureId: 'safe',
    solution: '345',
    rewards: ['puzzle_piece_3', 'flashlight'],
    unlocksLayer: 2,
  },
  puzzle_pattern: {
    id: 'puzzle_pattern',
    type: 'pattern',
    title: '画框机关',
    hint: '提示：按照旧照片背面的顺序点击符号',
    targetFurnitureId: 'painting',
    solution: ['△', '○', '□'],
    unlocksLayer: 2,
  },
  puzzle_assembly: {
    id: 'puzzle_assembly',
    type: 'assembly',
    title: '拼接图纸',
    hint: '将三块图纸碎片拖入拼合区，按顺序排列',
    targetFurnitureId: 'desk',
    solution: ['puzzle_piece_1', 'puzzle_piece_2', 'puzzle_piece_3'],
    rewards: ['map_complete'],
    unlocksLayer: 3,
  },
};
