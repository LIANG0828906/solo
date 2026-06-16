export interface Position {
  x: number;
  y: number;
}

export enum ElementType {
  FIRE = 'FIRE',
  WATER = 'WATER',
  WIND = 'WIND',
  EARTH = 'EARTH',
  LIGHT = 'LIGHT',
  ARCANE = 'ARCANE',
}

export enum Direction {
  UP = 'UP',
  DOWN = 'DOWN',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
}

export interface Rune {
  id: string;
  element: ElementType;
  position: Position;
  collected: boolean;
  rotation: number;
  collectAnimProgress: number;
  orbitAngle: number;
}

export interface AreaInfo {
  id: string;
  name: string;
  gradientColors: [string, string];
  runePositions: Position[];
  portalPosition: Position | null;
  boundaries: { x: number; y: number; width: number; height: number };
}

export interface AreaState {
  info: AreaInfo;
  runes: Rune[];
  allCollected: boolean;
  hasPortal: boolean;
  visited: boolean;
}

export interface SpellRule {
  elements: ElementType[];
  spellId: string;
  spellName: string;
  particleCount: number;
  particleColors: string[];
  minRadius: number;
  maxRadius: number;
}

export interface SpellResult {
  matched: boolean;
  spell: SpellRule | null;
}

export interface PlayerState {
  position: Position;
  direction: Direction;
  isMoving: boolean;
  cloakFrame: number;
  collectedElements: ElementType[];
  discoveredSpells: string[];
  spellCount: number;
}

export interface ParticleParams {
  count: number;
  colors: string[];
  origin: Position;
  minRadius: number;
  maxRadius: number;
  duration: number;
  minSize: number;
  maxSize: number;
}

export interface GameState {
  player: PlayerState;
  currentArea: string;
  areas: Record<string, AreaState>;
  runes: Rune[];
  activePortal: boolean;
  gamePhase: 'playing' | 'victory';
  startTime: number;
  discoveredSpells: string[];
  spellCount: number;
  transitioning: boolean;
  transitionProgress: number;
  spellBar: SpellRule[];
  collectedBounce: { element: ElementType; time: number } | null;
}

export const ELEMENT_COLORS: Record<ElementType, string> = {
  [ElementType.FIRE]: '#FF4444',
  [ElementType.WATER]: '#4488FF',
  [ElementType.WIND]: '#44FF88',
  [ElementType.EARTH]: '#FFAA44',
  [ElementType.LIGHT]: '#FFFFCC',
  [ElementType.ARCANE]: '#FFD700',
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  [ElementType.FIRE]: '火',
  [ElementType.WATER]: '水',
  [ElementType.WIND]: '风',
  [ElementType.EARTH]: '土',
  [ElementType.LIGHT]: '光',
  [ElementType.ARCANE]: '奥术',
};

export const PLAYER_SPEED = 3;
export const RUNE_COLLECT_DISTANCE = 50;
export const RUNE_HEX_RADIUS = 15;
export const RUNE_ORBIT_PERIOD = 2000;
export const RUNE_COLLECT_ANIM_DURATION = 500;
export const PORTAL_ROTATION_SPEED = 60;
export const TRANSITION_DURATION = 1000;
export const PARTICLE_MAX_COUNT = 400;
