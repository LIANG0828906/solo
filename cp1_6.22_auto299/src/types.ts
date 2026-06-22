export type RuneType = 'fire' | 'water' | 'earth' | 'wind' | 'light' | 'dark';

export interface RuneShard {
  id: string;
  type: RuneType;
  color: string;
  symbol: string;
}

export interface AltarSlot {
  id: number;
  shard: RuneShard | null;
}

export interface CombinationFormula {
  inputs: RuneType[];
  resultName: string;
  resultColor: string;
  unlockAreaIds: string[];
}

export interface HexCell {
  id: string;
  q: number;
  r: number;
  cx: number;
  cy: number;
  fogOpacity: number;
  isRevealed: boolean;
  hasHiddenPath: boolean;
  hasSecretEntrance: boolean;
  hiddenPathPos?: { x: number; y: number };
  secretEntrancePos?: { x: number; y: number };
}

export type MapNodeType = 'exploration' | 'altar' | 'secret';

export interface MapNode {
  id: string;
  cx: number;
  cy: number;
  type: MapNodeType;
  connectedCellIds: string[];
  isActivated: boolean;
  runeTypesNeeded?: RuneType[];
}

export interface SecretRealm {
  id: string;
  entryNodeId: string;
  mapSize: 200;
  bgColor: string;
  reward: RuneShard | null;
  isOpened: boolean;
}

export interface FogAnimation {
  cellId: string;
  startOpacity: number;
  endOpacity: number;
  startTime: number;
  duration: number;
}

export interface LightPillarAnimation {
  altarNodeId: string;
  cx: number;
  cy: number;
  startTime: number;
  duration: number;
  color: string;
}

export interface SecretEntranceAnimation {
  nodeId: string;
  cx: number;
  cy: number;
  startTime: number;
  rotationSpeed: number;
}

export interface SaveData {
  runeInventory: RuneShard[];
  activatedNodeIds: string[];
  revealedCellIds: string[];
  unlockedSecretIds: string[];
}

export const RUNE_DEFINITIONS: Record<RuneType, { color: string; symbol: string; name: string }> = {
  fire:   { color: '#ff4444', symbol: '🔥', name: '火' },
  water:  { color: '#4488ff', symbol: '💧', name: '水' },
  earth:  { color: '#88aa44', symbol: '🪨', name: '土' },
  wind:   { color: '#88ddff', symbol: '🌬️', name: '风' },
  light:  { color: '#ffee88', symbol: '✨', name: '光' },
  dark:   { color: '#aa44ff', symbol: '🌑', name: '暗' },
};

export const COMBINATION_FORMULAS: CombinationFormula[] = [
  { inputs: ['fire', 'water'],  resultName: '蒸汽符文', resultColor: '#cccccc', unlockAreaIds: ['zone_steam'] },
  { inputs: ['earth', 'wind'],  resultName: '沙暴符文', resultColor: '#ddbb66', unlockAreaIds: ['zone_sandstorm'] },
  { inputs: ['light', 'dark'],  resultName: '蚀影符文', resultColor: '#9966cc', unlockAreaIds: ['zone_eclipse'] },
  { inputs: ['fire', 'earth'],  resultName: '熔岩符文', resultColor: '#ff6622', unlockAreaIds: ['zone_lava'] },
  { inputs: ['water', 'wind'],  resultName: '暴风符文', resultColor: '#66bbff', unlockAreaIds: ['zone_storm'] },
  { inputs: ['fire', 'light'],  resultName: '烈阳符文', resultColor: '#ffcc00', unlockAreaIds: ['zone_sun'] },
  { inputs: ['water', 'dark'],  resultName: '深渊符文', resultColor: '#2244aa', unlockAreaIds: ['zone_abyss'] },
  { inputs: ['earth', 'light'], resultName: '生命符文', resultColor: '#44ff88', unlockAreaIds: ['zone_life'] },
];

export const HEX_SIZE = 80;
export const BACKPACK_CELL_SIZE = 64;
export const ALTAR_SLOT_RADIUS = 30;
export const SECRET_REALM_SIZE = 200;
export const SAVE_KEY = 'rune_map_save_v1';
