import { create } from 'zustand';
import { GameStatus, AreaName, AREA_NAMES } from '@/types';

interface GameState {
  health: number;
  maxHealth: number;
  shardsCollected: number;
  totalShards: number;
  currentArea: AreaName;
  areaIndex: number;
  gameStatus: GameStatus;
  showMemoryText: boolean;
  memoryText: string;
  invincible: boolean;

  setHealth: (health: number) => void;
  takeDamage: () => void;
  heal: () => void;
  collectShard: () => void;
  setTotalShards: (total: number) => void;
  nextArea: () => void;
  setGameStatus: (status: GameStatus) => void;
  showMemory: (text: string) => void;
  hideMemory: () => void;
  setInvincible: (invincible: boolean) => void;
  resetGame: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  health: 3,
  maxHealth: 3,
  shardsCollected: 0,
  totalShards: 5,
  currentArea: AREA_NAMES[0],
  areaIndex: 0,
  gameStatus: 'playing',
  showMemoryText: false,
  memoryText: '',
  invincible: false,

  setHealth: (health) => set({ health }),

  takeDamage: () => {
    const { health, invincible } = get();
    if (invincible) return;
    const newHealth = Math.max(0, health - 1);
    set({ health: newHealth, invincible: true });
    if (newHealth <= 0) {
      set({ gameStatus: 'gameover' });
    }
    setTimeout(() => set({ invincible: false }), 1500);
  },

  heal: () => {
    const { health, maxHealth } = get();
    set({ health: Math.min(maxHealth, health + 1) });
  },

  collectShard: () => {
    const { shardsCollected, totalShards } = get();
    const newCollected = shardsCollected + 1;
    set({ shardsCollected: newCollected });
  },

  setTotalShards: (total) => set({ totalShards: total }),

  nextArea: () => {
    const { areaIndex } = get();
    const nextIndex = Math.min(areaIndex + 1, AREA_NAMES.length - 1);
    set({
      areaIndex: nextIndex,
      currentArea: AREA_NAMES[nextIndex],
      shardsCollected: 0,
    });
    if (nextIndex === AREA_NAMES.length - 1) {
    }
  },

  setGameStatus: (status) => set({ gameStatus: status }),

  showMemory: (text) => set({ showMemoryText: true, memoryText: text }),

  hideMemory: () => set({ showMemoryText: false }),

  setInvincible: (invincible) => set({ invincible }),

  resetGame: () => set({
    health: 3,
    maxHealth: 3,
    shardsCollected: 0,
    totalShards: 5,
    currentArea: AREA_NAMES[0],
    areaIndex: 0,
    gameStatus: 'playing',
    showMemoryText: false,
    memoryText: '',
    invincible: false,
  }),
}));
