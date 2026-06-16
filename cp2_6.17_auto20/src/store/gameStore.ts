import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type GameState = 'menu' | 'playing' | 'gameover' | 'levelTransition' | 'victory';

export interface Position {
  x: number;
  y: number;
}

export type TrapType = 'gear' | 'lever' | 'arm';

export interface Trap {
  id: string;
  type: TrapType;
  x: number;
  y: number;
  rotation: number;
  active: boolean;
  timer: number;
  path?: Position[];
  pathIndex?: number;
  platformId?: string;
  warningTimer?: number;
  direction?: number;
}

export interface Battery {
  id: string;
  x: number;
  y: number;
  collected: boolean;
}

export interface SteamPlatform {
  id: string;
  x: number;
  y: number;
  baseY: number;
  raised: boolean;
  timer: number;
  leverId: string;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  type: 'steam' | 'spark';
  size?: number;
  color?: string;
}

export const TILE_SIZE = 40;
export const MAP_WIDTH = 20;
export const MAP_HEIGHT = 15;
export const GRAVITY = 0.15;
export const MOVE_SPEED = 3;
export const JUMP_FORCE = -6.5;
export const MAX_HEALTH = 3;
export const MAX_BATTERIES = 3;
export const PLAYER_WIDTH = 30;
export const PLAYER_HEIGHT = 40;
export const GEAR_ROTATION_SPEED = Math.PI / 60;
export const PLATFORM_DURATION = 5000;
export const ARM_SPEED = 2;
export const INVINCIBLE_DURATION = 500;
export const TRANSITION_DURATION = 1500;
export const GEAR_WARNING_DISTANCE = 2 * TILE_SIZE;
export const LEVER_INTERACTION_RANGE = 50;
export const GEAR_WARNING_DURATION = 500;

export interface GameStore {
  gameState: GameState;
  currentLevel: number;
  transitionProgress: number;

  playerX: number;
  playerY: number;
  playerVX: number;
  playerVY: number;
  health: number;
  maxHealth: number;
  maxBatteries: number;
  invincible: number;
  facing: 'left' | 'right';
  isJumping: boolean;

  map: number[][];
  traps: Trap[];
  batteries: Battery[];
  platforms: SteamPlatform[];
  particles: Particle[];
  exploredTiles: boolean[][];

  batteryCount: number;
  elevatorOpen: boolean;
  screenFlash: number;
  gearWarningPulse: number;

  lastActivatedLeverX: number;
  lastActivatedLeverY: number;
  lastCollectedBatteryX: number;
  lastCollectedBatteryY: number;

  startGame: () => void;
  updatePlayer: (x: number, y: number, vx: number, vy: number, facing: 'left' | 'right', jumping: boolean) => void;
  takeDamage: () => void;
  collectBattery: (id: string) => void;
  activateLever: (id: string) => void;
  nextLevel: () => void;
  resetGame: () => void;
  addParticle: (p: Omit<Particle, 'id'>) => void;
  removeParticle: (id: string) => void;
  updateTrap: (id: string, updates: Partial<Trap>) => void;
  updatePlatform: (id: string, updates: Partial<SteamPlatform>) => void;
  setTransitionProgress: (p: number) => void;
  setScreenFlash: (v: number) => void;
  setInvincible: (v: number) => void;
  setGearWarningPulse: (v: number) => void;
  setMap: (map: number[][]) => void;
  setTraps: (traps: Trap[]) => void;
  setBatteries: (batteries: Battery[]) => void;
  setPlatforms: (platforms: SteamPlatform[]) => void;
  setCurrentLevel: (level: number) => void;
  setElevatorOpen: (open: boolean) => void;
  setBatteryCount: (count: number) => void;
  updateParticles: (dt: number) => void;
  decrementGearWarning: (dt: number) => void;
  markTileExplored: (tx: number, ty: number) => void;
  clearExploredTiles: () => void;
}

const createEmptyMap = (): number[][] => {
  const map: number[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: number[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      if (x === 0 || x === MAP_WIDTH - 1 || y === 0 || y === MAP_HEIGHT - 1) {
        row.push(1);
      } else {
        row.push(0);
      }
    }
    map.push(row);
  }
  return map;
};

const createEmptyExploredTiles = (): boolean[][] => {
  const tiles: boolean[][] = [];
  for (let y = 0; y < MAP_HEIGHT; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < MAP_WIDTH; x++) {
      row.push(false);
    }
    tiles.push(row);
  }
  return tiles;
};

const initialPlayerX = 2 * TILE_SIZE + 5;
const initialPlayerY = (MAP_HEIGHT - 3) * TILE_SIZE;

export const useGameStore = create<GameStore>((set, get) => ({
  gameState: 'menu',
  currentLevel: 1,
  transitionProgress: 0,

  playerX: initialPlayerX,
  playerY: initialPlayerY,
  playerVX: 0,
  playerVY: 0,
  health: MAX_HEALTH,
  maxHealth: MAX_HEALTH,
  maxBatteries: MAX_BATTERIES,
  invincible: 0,
  facing: 'right',
  isJumping: false,

  map: createEmptyMap(),
  traps: [],
  batteries: [],
  platforms: [],
  particles: [],
  exploredTiles: createEmptyExploredTiles(),

  batteryCount: 0,
  elevatorOpen: false,
  screenFlash: 0,
  gearWarningPulse: 0,

  lastActivatedLeverX: 0,
  lastActivatedLeverY: 0,
  lastCollectedBatteryX: 0,
  lastCollectedBatteryY: 0,

  startGame: () => set({
    gameState: 'playing',
    currentLevel: 1,
    transitionProgress: 0,
    playerX: initialPlayerX,
    playerY: initialPlayerY,
    playerVX: 0,
    playerVY: 0,
    health: MAX_HEALTH,
    invincible: 0,
    facing: 'right',
    isJumping: false,
    batteryCount: 0,
    elevatorOpen: false,
    screenFlash: 0,
    gearWarningPulse: 0,
    particles: [],
    exploredTiles: createEmptyExploredTiles(),
  }),

  updatePlayer: (x, y, vx, vy, facing, jumping) => set({
    playerX: x,
    playerY: y,
    playerVX: vx,
    playerVY: vy,
    facing,
    isJumping: jumping,
  }),

  takeDamage: () => {
    const state = get();
    if (state.invincible > 0) return;
    const newHealth = state.health - 1;
    if (newHealth <= 0) {
      set({ health: 0, gameState: 'gameover', screenFlash: 1 });
    } else {
      set({ health: newHealth, invincible: INVINCIBLE_DURATION, screenFlash: 1 });
    }
  },

  collectBattery: (id) => {
    const state = get();
    const battery = state.batteries.find(b => b.id === id);
    if (battery && !battery.collected) {
      const newCount = state.batteryCount + 1;
      set({
        batteries: state.batteries.map(b =>
          b.id === id ? { ...b, collected: true } : b
        ),
        batteryCount: newCount,
        elevatorOpen: newCount >= 3,
        lastCollectedBatteryX: battery.x,
        lastCollectedBatteryY: battery.y,
      });
    }
  },

  activateLever: (id) => {
    const state = get();
    const lever = state.traps.find(t => t.id === id && t.type === 'lever');
    if (!lever) return;

    set({
      traps: state.traps.map(t =>
        t.id === id ? { ...t, active: true, timer: PLATFORM_DURATION } : t
      ),
      platforms: state.platforms.map(p =>
        p.leverId === id ? { ...p, raised: true, timer: PLATFORM_DURATION, y: p.baseY - TILE_SIZE } : p
      ),
      lastActivatedLeverX: lever.x,
      lastActivatedLeverY: lever.y,
    });
  },

  nextLevel: () => {
    const state = get();
    if (state.currentLevel >= 3) {
      set({ gameState: 'victory' });
    } else {
      set({
        gameState: 'levelTransition',
        transitionProgress: 0,
      });
    }
  },

  resetGame: () => set({
    gameState: 'menu',
    currentLevel: 1,
    transitionProgress: 0,
    playerX: initialPlayerX,
    playerY: initialPlayerY,
    playerVX: 0,
    playerVY: 0,
    health: MAX_HEALTH,
    invincible: 0,
    facing: 'right',
    isJumping: false,
    map: createEmptyMap(),
    traps: [],
    batteries: [],
    platforms: [],
    particles: [],
    batteryCount: 0,
    elevatorOpen: false,
    screenFlash: 0,
    gearWarningPulse: 0,
    exploredTiles: createEmptyExploredTiles(),
  }),

  addParticle: (p) => set(state => ({
    particles: [...state.particles, { ...p, id: uuidv4() }],
  })),

  removeParticle: (id) => set(state => ({
    particles: state.particles.filter(p => p.id !== id),
  })),

  updateTrap: (id, updates) => set(state => ({
    traps: state.traps.map(t => t.id === id ? { ...t, ...updates } : t),
  })),

  updatePlatform: (id, updates) => set(state => ({
    platforms: state.platforms.map(p => p.id === id ? { ...p, ...updates } : p),
  })),

  setTransitionProgress: (p) => set({ transitionProgress: p }),
  setScreenFlash: (v) => set({ screenFlash: v }),
  setInvincible: (v) => set({ invincible: v }),
  setGearWarningPulse: (v) => set({ gearWarningPulse: v }),
  setMap: (map) => set({ map }),
  setTraps: (traps) => set({ traps }),
  setBatteries: (batteries) => set({ batteries }),
  setPlatforms: (platforms) => set({ platforms }),
  setCurrentLevel: (level) => set({ currentLevel: level, exploredTiles: createEmptyExploredTiles() }),
  setElevatorOpen: (open) => set({ elevatorOpen: open }),
  setBatteryCount: (count) => set({ batteryCount: count }),

  updateParticles: (dt) => {
    const state = get();
    const updated = state.particles
      .map(p => ({
        ...p,
        x: p.x + p.vx * (dt / 16.67),
        y: p.y + p.vy * (dt / 16.67),
        life: p.life - dt,
      }))
      .filter(p => p.life > 0);
    set({ particles: updated });
  },

  decrementGearWarning: (dt) => {
    const state = get();
    if (state.gearWarningPulse > 0) {
      set({ gearWarningPulse: Math.max(0, state.gearWarningPulse - dt) });
    }
    if (state.invincible > 0) {
      set({ invincible: Math.max(0, state.invincible - dt) });
    }
    if (state.screenFlash > 0) {
      set({ screenFlash: Math.max(0, state.screenFlash - dt / 300) });
    }
  },

  markTileExplored: (tx: number, ty: number) => {
    const state = get();
    if (ty < 0 || ty >= MAP_HEIGHT || tx < 0 || tx >= MAP_WIDTH) return;
    if (state.exploredTiles[ty][tx]) return;
    const newTiles = state.exploredTiles.map(row => [...row]);
    newTiles[ty][tx] = true;
    set({ exploredTiles: newTiles });
  },

  clearExploredTiles: () => {
    set({ exploredTiles: createEmptyExploredTiles() });
  },
}));
