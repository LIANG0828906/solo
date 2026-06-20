export type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'thunder';

export const ELEMENT_COLORS: Record<ElementType, string> = {
  fire: '#FF4444',
  water: '#4488FF',
  wind: '#44FF88',
  earth: '#AA6633',
  thunder: '#FFD700'
};

export const ELEMENT_NAMES: Record<ElementType, string> = {
  fire: '火',
  water: '水',
  wind: '风',
  earth: '土',
  thunder: '雷'
};

export const ALL_ELEMENTS: ElementType[] = ['fire', 'water', 'wind', 'earth', 'thunder'];

export const ELEMENT_WEAKNESSES: Record<ElementType, ElementType[]> = {
  fire: ['water', 'earth'],
  water: ['thunder', 'wind'],
  wind: ['fire', 'earth'],
  earth: ['thunder', 'water'],
  thunder: ['wind', 'fire']
};

export interface Rune {
  id: string;
  element: ElementType;
  slotIndex: number;
  pulsePhase: number;
}

export interface RuneSlot {
  index: number;
  angle: number;
  rune: Rune | null;
  ripplePhase: number;
  isHighlighted: boolean;
}

export interface Monster {
  id: string;
  x: number;
  y: number;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  element: ElementType;
  weakness: ElementType[];
  colorStart: string;
  colorEnd: string;
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

export interface Beam {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  color: string;
  life: number;
  maxLife: number;
  width: number;
  targetMonsterId: string | null;
}

export interface Fragment {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  rotation: number;
  life: number;
  maxLife: number;
}

export interface FloatingText {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number;
}

export interface GameState {
  playerHp: number;
  maxPlayerHp: number;
  fragments: number;
  wave: number;
  slots: RuneSlot[];
  monsters: Monster[];
  particles: Particle[];
  beams: Beam[];
  fragmentsItems: Fragment[];
  floatingTexts: FloatingText[];
  sequenceInput: number[];
  targetSequence: ElementType[];
  isElementStorm: boolean;
  stormTimer: number;
  stormElement: ElementType | null;
  stormSuccessCount: number;
  screenFlash: { color: string; life: number } | null;
  altarRadius: number;
  warningRadius: number;
  lastWaveTime: number;
  lastStormTime: number;
  totalSlots: number;
  isRunning: boolean;
  selectedSlotIndex: number | null;
  showRunePanel: boolean;
  panelPosition: { x: number; y: number };
  scale: number;
  centerX: number;
  centerY: number;
}

export interface GameConfig {
  ALTAR_RADIUS: number;
  WARNING_RADIUS: number;
  INITIAL_SLOTS: number;
  MAX_SLOTS: number;
  WAVE_INTERVAL: number;
  STORM_INTERVAL: number;
  STORM_DURATION: number;
  MONSTERS_PER_WAVE: [number, number];
  MONSTER_BASE_HP: number;
  MONSTER_BASE_SPEED: [number, number];
  MONSTER_RADIUS: [number, number];
  DAMAGE_PER_HIT: number;
  PLAYER_MAX_HP: number;
  MONSTER_DAMAGE: number;
  MISMATCH_DAMAGE: number;
  FRAGMENT_DROP_CHANCE: number;
  FRAGMENTS_PER_UNLOCK: number;
  BEAM_DURATION: number;
  PARTICLE_POOL_SIZE: number;
  MAX_MONSTERS: number;
  MAX_PARTICLES: number;
  RIPPLE_DURATION: number;
  PULSE_PERIOD: number;
  FRAGMENT_LIFETIME: number;
  FLOATING_TEXT_DURATION: number;
}

export const DEFAULT_CONFIG: GameConfig = {
  ALTAR_RADIUS: 200,
  WARNING_RADIUS: 280,
  INITIAL_SLOTS: 16,
  MAX_SLOTS: 20,
  WAVE_INTERVAL: 8000,
  STORM_INTERVAL: 60000,
  STORM_DURATION: 15000,
  MONSTERS_PER_WAVE: [1, 3],
  MONSTER_BASE_HP: 3,
  MONSTER_BASE_SPEED: [80, 120],
  MONSTER_RADIUS: [15, 25],
  DAMAGE_PER_HIT: 2,
  PLAYER_MAX_HP: 100,
  MONSTER_DAMAGE: 10,
  MISMATCH_DAMAGE: 5,
  FRAGMENT_DROP_CHANCE: 0.4,
  FRAGMENTS_PER_UNLOCK: 10,
  BEAM_DURATION: 500,
  PARTICLE_POOL_SIZE: 200,
  MAX_MONSTERS: 20,
  MAX_PARTICLES: 200,
  RIPPLE_DURATION: 300,
  PULSE_PERIOD: 2000,
  FRAGMENT_LIFETIME: 10000,
  FLOATING_TEXT_DURATION: 1000
};
