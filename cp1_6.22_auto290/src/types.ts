export type RuneElement = 'fire' | 'water' | 'wind' | 'earth' | 'light' | 'dark';

export enum RuneState {
  INACTIVE = 'inactive',
  STANDBY = 'standby',
  ACTIVE = 'active'
}

export interface GridPosition {
  row: number;
  col: number;
}

export interface Rune {
  id: string;
  element: RuneElement;
  state: RuneState;
  position: GridPosition | null;
}

export interface RuneLibraryItem {
  element: RuneElement;
  count: number;
  maxCount: number;
}

export interface AltarCell {
  position: GridPosition;
  rune: Rune | null;
  isCorner: boolean;
  isEdge: boolean;
  isCenter: boolean;
}

export interface RuneRecipe {
  name: string;
  corners: [RuneElement, RuneElement, RuneElement, RuneElement];
  edges?: [RuneElement | null, RuneElement | null, RuneElement | null, RuneElement | null];
  spellName: string;
}

export interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface AnimationState {
  pulse: {
    active: boolean;
    startTime: number;
    duration: number;
    color: string;
  } | null;
  particles: Particle[];
  screenShake: {
    active: boolean;
    startTime: number;
    duration: number;
    intensity: number;
  } | null;
  ringEffect: {
    active: boolean;
    startTime: number;
    duration: number;
    color: string;
  } | null;
  rotatingSymbol: {
    active: boolean;
    angle: number;
    color: string;
  } | null;
}

export interface AppState {
  altarCells: AltarCell[];
  library: RuneLibraryItem[];
  animationState: AnimationState;
  completedRecipe: RuneRecipe | null;
  showRecipePanel: boolean;
  activationOrder: GridPosition[];
  draggedRune: Rune | null;
}

export type Action =
  | { type: 'PLACE_RUNE'; payload: { element: RuneElement; position: GridPosition } }
  | { type: 'UPDATE_RUNE_STATE'; payload: { position: GridPosition; state: RuneState } }
  | { type: 'TRIGGER_PULSE'; payload: { color: string } }
  | { type: 'TRIGGER_SPELL'; payload: { color: string } }
  | { type: 'TRIGGER_CHAIN_REACTION' }
  | { type: 'START_ROTATING_SYMBOL'; payload: { color: string } }
  | { type: 'UPDATE_ROTATING_ANGLE'; payload: { angle: number } }
  | { type: 'UPDATE_PARTICLES'; payload: { particles: Particle[] } }
  | { type: 'RESET_ALTAR' }
  | { type: 'SHOW_RECIPE_PANEL'; payload: { recipe: RuneRecipe } }
  | { type: 'HIDE_RECIPE_PANEL' }
  | { type: 'SET_DRAGGED_RUNE'; payload: { rune: Rune | null } }
  | { type: 'UPDATE_SCREEN_SHAKE'; payload: { intensity: number; duration: number } }
  | { type: 'UPDATE_RING_EFFECT'; payload: { color: string; duration: number } };

export const RUNE_COLORS: Record<RuneElement, string> = {
  fire: '#FF4444',
  water: '#4488FF',
  wind: '#88FF88',
  earth: '#AA8844',
  light: '#FFFF88',
  dark: '#8844AA'
};

export const RUNE_SYMBOLS: Record<RuneElement, string> = {
  fire: '△',
  water: '≋',
  wind: '🌀',
  earth: '■',
  light: '✦',
  dark: '☾'
};

export const RUNE_NAMES: Record<RuneElement, string> = {
  fire: '火',
  water: '水',
  wind: '风',
  earth: '地',
  light: '光',
  dark: '暗'
};

export const RUNE_RECIPES: RuneRecipe[] = [
  {
    name: '元素平衡法阵',
    corners: ['fire', 'water', 'earth', 'wind'],
    spellName: '四元素召唤'
  },
  {
    name: '光暗交织阵',
    corners: ['light', 'dark', 'light', 'dark'],
    spellName: '黄昏召唤'
  },
  {
    name: '烈焰风暴阵',
    corners: ['fire', 'wind', 'fire', 'wind'],
    spellName: '炎爆术召唤'
  },
  {
    name: '大地洪流阵',
    corners: ['water', 'earth', 'water', 'earth'],
    spellName: '地震术召唤'
  },
  {
    name: '圣光净化阵',
    corners: ['light', 'light', 'light', 'light'],
    spellName: '天使召唤'
  },
  {
    name: '暗影腐蚀阵',
    corners: ['dark', 'dark', 'dark', 'dark'],
    spellName: '恶魔召唤'
  }
];

export const CORNER_POSITIONS: GridPosition[] = [
  { row: 0, col: 0 },
  { row: 0, col: 2 },
  { row: 2, col: 0 },
  { row: 2, col: 2 }
];

export const EDGE_POSITIONS: GridPosition[] = [
  { row: 0, col: 1 },
  { row: 1, col: 2 },
  { row: 2, col: 1 },
  { row: 1, col: 0 }
];
