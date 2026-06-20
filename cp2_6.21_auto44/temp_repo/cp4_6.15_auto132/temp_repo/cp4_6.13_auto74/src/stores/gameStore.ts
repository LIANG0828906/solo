import { create } from 'zustand'

export interface WeaponConfig {
  fireRate: number;
  damage: number;
  projectileColor: string;
}

export interface ShipPart {
  id: string;
  type: 'hull' | 'engine' | 'shield' | 'weapon';
  variant: number;
  slot: string;
  name: string;
  config?: WeaponConfig;
}

export interface StarmapCell {
  type: 'empty' | 'asteroid' | 'enemy' | 'resource';
  explored: boolean;
}

export interface BattleAction {
  round: number;
  attacker: 'player' | 'enemy';
  weapon: string;
  damage: number;
  shieldAbsorbed: number;
  hullDamage: number;
  dodged: boolean;
}

export interface BattleResult {
  victory: boolean;
  playerHullRemaining: number;
  enemyHullRemaining: number;
  log: BattleAction[];
  resourcesGained: number;
  partsLost: string[];
}

export type ActivePanel = 'builder' | 'starmap' | 'battle' | 'repair';

export const PART_CATALOG: ShipPart[] = [
  { id: 'hull-1', type: 'hull', variant: 1, slot: 'hull-center', name: '核心舱体' },
  { id: 'hull-2', type: 'hull', variant: 2, slot: 'hull-center', name: '强化舱体' },
  { id: 'hull-3', type: 'hull', variant: 3, slot: 'hull-center', name: '重型舱体' },

  { id: 'engine-1', type: 'engine', variant: 1, slot: 'engine-left', name: '基础引擎' },
  { id: 'engine-2', type: 'engine', variant: 2, slot: 'engine-left', name: '高效引擎' },
  { id: 'engine-3', type: 'engine', variant: 3, slot: 'engine-left', name: '超光速引擎' },

  { id: 'shield-1', type: 'shield', variant: 1, slot: 'shield-front', name: '轻型护盾' },
  { id: 'shield-2', type: 'shield', variant: 2, slot: 'shield-front', name: '标准护盾' },
  { id: 'shield-3', type: 'shield', variant: 3, slot: 'shield-front', name: '重型护盾' },

  { id: 'weapon-1', type: 'weapon', variant: 1, slot: 'weapon-left', name: '激光炮', config: { fireRate: 2, damage: 30, projectileColor: '#ff3366' } },
  { id: 'weapon-2', type: 'weapon', variant: 2, slot: 'weapon-left', name: '等离子炮', config: { fireRate: 1.5, damage: 50, projectileColor: '#00d4ff' } },
  { id: 'weapon-3', type: 'weapon', variant: 3, slot: 'weapon-left', name: '离子炮', config: { fireRate: 0.5, damage: 80, projectileColor: '#33ff88' } },
];

export const SLOT_POSITIONS: Record<string, { x: number; y: number; z: number }> = {
  'hull-center': { x: 0, y: 0, z: 0 },
  'engine-left': { x: -1.5, y: -1, z: 0 },
  'engine-right': { x: 1.5, y: -1, z: 0 },
  'shield-front': { x: 0, y: 1.5, z: 0.5 },
  'shield-rear': { x: 0, y: -1.5, z: -0.5 },
  'weapon-left': { x: -1, y: 0.5, z: 0 },
  'weapon-right': { x: 1, y: 0.5, z: 0 },
};

interface GameState {
  parts: ShipPart[];
  resources: number;
  starmap: StarmapCell[][] | null;
  playerPos: { x: number; y: number };
  battleLog: BattleAction[];
  battleResult: BattleResult | null;
  inBattle: boolean;
  currentRound: number;
  wsConnected: boolean;
  activePanel: ActivePanel;
}

interface GameActions {
  addPart: (part: ShipPart) => void;
  removePart: (slot: string) => void;
  updateWeaponConfig: (slot: string, config: WeaponConfig) => void;
  setStarmap: (grid: StarmapCell[][]) => void;
  movePlayer: (x: number, y: number) => void;
  addBattleAction: (action: BattleAction) => void;
  setBattleResult: (result: BattleResult) => void;
  setInBattle: (val: boolean) => void;
  setCurrentRound: (round: number) => void;
  addResources: (amount: number) => void;
  spendResources: (amount: number) => boolean;
  setWsConnected: (val: boolean) => void;
  setActivePanel: (panel: ActivePanel) => void;
  resetBattle: () => void;
}

export const useGameStore = create<GameState & GameActions>()((set, get) => ({
  parts: [],
  resources: 100,
  starmap: null,
  playerPos: { x: 0, y: 0 },
  battleLog: [],
  battleResult: null,
  inBattle: false,
  currentRound: 0,
  wsConnected: false,
  activePanel: 'builder',

  addPart: (part) =>
    set((state) => ({
      parts: [...state.parts.filter((p) => p.slot !== part.slot), part],
    })),

  removePart: (slot) =>
    set((state) => ({
      parts: state.parts.filter((p) => p.slot !== slot),
    })),

  updateWeaponConfig: (slot, config) =>
    set((state) => ({
      parts: state.parts.map((p) =>
        p.slot === slot ? { ...p, config } : p
      ),
    })),

  setStarmap: (grid) => set({ starmap: grid }),

  movePlayer: (x, y) => set({ playerPos: { x, y } }),

  addBattleAction: (action) =>
    set((state) => ({
      battleLog: [...state.battleLog, action],
    })),

  setBattleResult: (result) => set({ battleResult: result }),

  setInBattle: (val) => set({ inBattle: val }),

  setCurrentRound: (round) => set({ currentRound: round }),

  addResources: (amount) =>
    set((state) => ({ resources: state.resources + amount })),

  spendResources: (amount) => {
    const current = get().resources;
    if (current < amount) return false;
    set({ resources: current - amount });
    return true;
  },

  setWsConnected: (val) => set({ wsConnected: val }),

  setActivePanel: (panel) => set({ activePanel: panel }),

  resetBattle: () =>
    set({ battleLog: [], battleResult: null, inBattle: false, currentRound: 0 }),
}));
