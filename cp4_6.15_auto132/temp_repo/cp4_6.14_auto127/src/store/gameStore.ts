import { create } from 'zustand';

export type CellType = 'rock' | 'iron' | 'gold' | 'diamond' | 'empty' | 'exit';

export interface Cell {
  type: CellType;
  x: number;
  y: number;
}

export interface Inventory {
  iron: number;
  gold: number;
  diamond: number;
}

export interface Equipment {
  ironPickaxe: boolean;
  goldPickaxe: boolean;
  diamondHelmet: boolean;
}

export interface FallingRock {
  id: number;
  x: number;
  y: number;
  startY: number;
  targetY: number;
  progress: number;
  rotation: number;
}

export interface GameState {
  grid: Cell[][];
  gridSize: number;
  cellSize: number;
  playerX: number;
  playerY: number;
  playerPixelX: number;
  playerPixelY: number;
  health: number;
  maxHealth: number;
  energy: number;
  maxEnergy: number;
  inventory: Inventory;
  equipment: Equipment;
  isDigging: boolean;
  digProgress: number;
  digTargetX: number;
  digTargetY: number;
  isGameOver: boolean;
  isWin: boolean;
  score: number;
  elapsedTime: number;
  fallingRocks: FallingRock[];
  playerHurtTimer: number;
  gameStarted: boolean;
  
  setGrid: (grid: Cell[][]) => void;
  setPlayerPosition: (x: number, y: number) => void;
  setPlayerPixelPosition: (x: number, y: number) => void;
  setHealth: (health: number) => void;
  setEnergy: (energy: number) => void;
  addToInventory: (type: 'iron' | 'gold' | 'diamond', amount: number) => void;
  setDigging: (digging: boolean, targetX?: number, targetY?: number) => void;
  setDigProgress: (progress: number) => void;
  setGameOver: (over: boolean) => void;
  setWin: (win: boolean) => void;
  setScore: (score: number) => void;
  setElapsedTime: (time: number) => void;
  addFallingRock: (rock: FallingRock) => void;
  removeFallingRock: (id: number) => void;
  updateFallingRocks: (rocks: FallingRock[]) => void;
  setPlayerHurtTimer: (timer: number) => void;
  upgradeEquipment: (type: keyof Equipment) => boolean;
  setGameStarted: (started: boolean) => void;
  resetGame: () => void;
}

const initialInventory: Inventory = { iron: 0, gold: 0, diamond: 0 };
const initialEquipment: Equipment = { ironPickaxe: false, goldPickaxe: false, diamondHelmet: false };

export const useGameStore = create<GameState>((set, get) => ({
  grid: [],
  gridSize: 10,
  cellSize: 48,
  playerX: 0,
  playerY: 0,
  playerPixelX: 0,
  playerPixelY: 0,
  health: 5,
  maxHealth: 5,
  energy: 100,
  maxEnergy: 100,
  inventory: { ...initialInventory },
  equipment: { ...initialEquipment },
  isDigging: false,
  digProgress: 0,
  digTargetX: 0,
  digTargetY: 0,
  isGameOver: false,
  isWin: false,
  score: 0,
  elapsedTime: 0,
  fallingRocks: [],
  playerHurtTimer: 0,
  gameStarted: false,

  setGrid: (grid) => set({ grid }),
  setPlayerPosition: (x, y) => set({ playerX: x, playerY: y }),
  setPlayerPixelPosition: (x, y) => set({ playerPixelX: x, playerPixelY: y }),
  setHealth: (health) => set({ health: Math.max(0, Math.min(get().maxHealth, health)) }),
  setEnergy: (energy) => set({ energy: Math.max(0, Math.min(get().maxEnergy, energy)) }),
  addToInventory: (type, amount) => {
    const inv = { ...get().inventory };
    inv[type] += amount;
    set({ inventory: inv });
  },
  setDigging: (digging, targetX, targetY) => {
    if (targetX !== undefined && targetY !== undefined) {
      set({ isDigging: digging, digTargetX: targetX, digTargetY: targetY, digProgress: 0 });
    } else {
      set({ isDigging: digging, digProgress: 0 });
    }
  },
  setDigProgress: (progress) => set({ digProgress: progress }),
  setGameOver: (over) => set({ isGameOver: over }),
  setWin: (win) => set({ isWin: win }),
  setScore: (score) => set({ score }),
  setElapsedTime: (time) => set({ elapsedTime: time }),
  addFallingRock: (rock) => set({ fallingRocks: [...get().fallingRocks, rock] }),
  removeFallingRock: (id) => set({ fallingRocks: get().fallingRocks.filter(r => r.id !== id) }),
  updateFallingRocks: (rocks) => set({ fallingRocks: rocks }),
  setPlayerHurtTimer: (timer) => set({ playerHurtTimer: timer }),
  upgradeEquipment: (type) => {
    const state = get();
    const inv = { ...state.inventory };
    const eq = { ...state.equipment };

    if (eq[type]) return false;

    if (type === 'ironPickaxe' && inv.iron >= 5) {
      inv.iron -= 5;
      eq.ironPickaxe = true;
    } else if (type === 'goldPickaxe' && inv.gold >= 3) {
      inv.gold -= 3;
      eq.goldPickaxe = true;
    } else if (type === 'diamondHelmet' && inv.diamond >= 2) {
      inv.diamond -= 2;
      eq.diamondHelmet = true;
    } else {
      return false;
    }

    set({ inventory: inv, equipment: eq });
    return true;
  },
  setGameStarted: (started) => set({ gameStarted: started }),
  resetGame: () => set({
    grid: [],
    playerX: 0,
    playerY: 0,
    playerPixelX: 0,
    playerPixelY: 0,
    health: 5,
    energy: 100,
    inventory: { ...initialInventory },
    equipment: { ...initialEquipment },
    isDigging: false,
    digProgress: 0,
    isGameOver: false,
    isWin: false,
    score: 0,
    elapsedTime: 0,
    fallingRocks: [],
    playerHurtTimer: 0,
    gameStarted: false,
  }),
}));
