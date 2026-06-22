import { create } from 'zustand';

export type GamePhase = 'idle' | 'playing' | 'waveBreak' | 'won' | 'lost';
export type CrystalType = 'high' | 'low';
export type MonsterType = 'normal' | 'fast' | 'heavy';

export interface Crystal {
  id: string;
  q: number;
  r: number;
  type: CrystalType;
  frequency: number;
  baseRadius: number;
  frequencyOffset: number;
  upgraded: boolean;
  level: number;
}

export interface Monster {
  id: string;
  type: MonsterType;
  hp: number;
  maxHp: number;
  speed: number;
  resistance: number;
  x: number;
  y: number;
  pathIndex: number;
  pathProgress: number;
  dead: boolean;
  escaped: boolean;
  damageMultiplier: number;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  color: string;
  birthTime: number;
  duration: number;
}

export interface WaveInfo {
  current: number;
  total: number;
  monstersInWave: number;
  monstersSpawned: number;
  monstersAlive: number;
  nextWaveTimer: number;
  spawnTimer: number;
  beaconActive: boolean;
  beaconStartTime: number;
}

export interface GameState {
  gamePhase: GamePhase;
  resources: number;
  crystals: Crystal[];
  monsters: Monster[];
  particles: Particle[];
  waveInfo: WaveInfo;
  killsTotal: number;
  escapedTotal: number;
  crystalsPlaced: number;
  crystalsUpgraded: number;
  selectedCrystalType: CrystalType | null;
  gameTime: number;
  waveFieldTimestamp: number;
  gridStep: number;
  lastFrameTime: number;
}

export interface GameActions {
  startGame: () => void;
  setSelectedCrystalType: (type: CrystalType | null) => void;
  placeCrystal: (q: number, r: number) => boolean;
  upgradeCrystal: (crystalId: string, upgradeType: 'frequency' | 'radius') => boolean;
  tick: (update: Partial<GameState>) => void;
  resetGame: () => void;
}

const initialWaveInfo: WaveInfo = {
  current: 0,
  total: 10,
  monstersInWave: 0,
  monstersSpawned: 0,
  monstersAlive: 0,
  nextWaveTimer: 0,
  spawnTimer: 0,
  beaconActive: false,
  beaconStartTime: 0,
};

const initialState: GameState = {
  gamePhase: 'idle',
  resources: 200,
  crystals: [],
  monsters: [],
  particles: [],
  waveInfo: initialWaveInfo,
  killsTotal: 0,
  escapedTotal: 0,
  crystalsPlaced: 0,
  crystalsUpgraded: 0,
  selectedCrystalType: null,
  gameTime: 0,
  waveFieldTimestamp: 0,
  gridStep: 1,
  lastFrameTime: 0,
};

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...initialState,

  startGame: () => {
    set({
      ...initialState,
      gamePhase: 'playing',
      waveInfo: { ...initialWaveInfo, current: 1, nextWaveTimer: 3 },
    });
  },

  setSelectedCrystalType: (type) => {
    set({ selectedCrystalType: type });
  },

  placeCrystal: (q, r) => {
    const state = get();
    const type = state.selectedCrystalType;
    if (!type) return false;

    const cost = type === 'high' ? 80 : 40;
    if (state.resources < cost) return false;

    const occupied = state.crystals.some((c) => c.q === q && c.r === r);
    if (occupied) return false;

    const crystal: Crystal = {
      id: `crystal_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      q,
      r,
      type,
      frequency: type === 'high' ? 880 : 220,
      baseRadius: 5,
      frequencyOffset: 0,
      upgraded: false,
      level: 1,
    };

    set({
      resources: state.resources - cost,
      crystals: [...state.crystals, crystal],
      crystalsPlaced: state.crystalsPlaced + 1,
    });

    return true;
  },

  upgradeCrystal: (crystalId, upgradeType) => {
    const state = get();
    const crystal = state.crystals.find((c) => c.id === crystalId);
    if (!crystal) return false;

    const cost = crystal.type === 'high' ? 60 : 30;
    if (state.resources < cost) return false;

    const updatedCrystals = state.crystals.map((c) => {
      if (c.id !== crystalId) return c;
      if (upgradeType === 'frequency') {
        return { ...c, frequencyOffset: c.frequencyOffset + 50, upgraded: true, level: c.level + 1 };
      } else {
        return { ...c, baseRadius: c.baseRadius + 1, upgraded: true, level: c.level + 1 };
      }
    });

    set({
      resources: state.resources - cost,
      crystals: updatedCrystals,
      crystalsUpgraded: state.crystalsUpgraded + 1,
    });

    return true;
  },

  tick: (update) => {
    set(update);
  },

  resetGame: () => {
    set({ ...initialState });
  },
}));
