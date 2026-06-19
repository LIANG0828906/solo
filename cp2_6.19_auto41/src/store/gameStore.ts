import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { BattleRound, Card, SkillType } from '../utils/battleEngine';

export const INITIAL_RED_CARD: Card = {
  id: uuidv4(),
  name: '烈焰战士',
  hp: 100,
  maxHp: 100,
  attack: 25,
  skill: 'combo',
  side: 'red',
};

export const INITIAL_BLUE_CARD: Card = {
  id: uuidv4(),
  name: '寒霜守卫',
  hp: 120,
  maxHp: 120,
  attack: 20,
  skill: 'shield',
  side: 'blue',
};

interface GameState {
  redCard: Card;
  blueCard: Card;
  battleLogs: BattleRound[];
  isBattling: boolean;
  currentRound: number;
  winner: 'red' | 'blue' | null;
  initialRedCard: Card;
  initialBlueCard: Card;
  updateCard: (side: 'red' | 'blue', updates: Partial<Card>) => void;
  setBattleLogs: (logs: BattleRound[]) => void;
  appendLog: (log: BattleRound) => void;
  setIsBattling: (val: boolean) => void;
  setCurrentRound: (round: number) => void;
  setWinner: (winner: 'red' | 'blue' | null) => void;
  setCardHp: (side: 'red' | 'blue', hp: number) => void;
  startBattle: () => void;
  resetBattle: () => void;
  clearLogs: () => void;
}

export const useGameStore = create<GameState>((set) => ({
  redCard: { ...INITIAL_RED_CARD },
  blueCard: { ...INITIAL_BLUE_CARD },
  battleLogs: [],
  isBattling: false,
  currentRound: 0,
  winner: null,
  initialRedCard: { ...INITIAL_RED_CARD },
  initialBlueCard: { ...INITIAL_BLUE_CARD },

  updateCard: (side, updates) =>
    set((state) => {
      const key = side === 'red' ? 'redCard' : 'blueCard';
      const initialKey = side === 'red' ? 'initialRedCard' : 'initialBlueCard';
      const current = state[key];
      const merged: Card = { ...current, ...updates };
      if (updates.hp !== undefined) merged.maxHp = updates.hp;
      return {
        [key]: merged,
        [initialKey]: { ...state[initialKey], ...updates, maxHp: updates.hp ?? state[initialKey].maxHp } as Card,
      };
    }),

  setBattleLogs: (logs) => set({ battleLogs: logs }),

  appendLog: (log) => set((state) => ({ battleLogs: [...state.battleLogs, log] })),

  setIsBattling: (val) => set({ isBattling: val }),

  setCurrentRound: (round) => set({ currentRound: round }),

  setWinner: (winner) => set({ winner }),

  setCardHp: (side, hp) =>
    set((state) => {
      const key = side === 'red' ? 'redCard' : 'blueCard';
      return { [key]: { ...state[key], hp: Math.max(0, hp) } };
    }),

  startBattle: () =>
    set((state) => ({
      isBattling: true,
      winner: null,
      battleLogs: [],
      currentRound: 0,
      redCard: { ...state.initialRedCard, hp: state.initialRedCard.maxHp },
      blueCard: { ...state.initialBlueCard, hp: state.initialBlueCard.maxHp },
    })),

  resetBattle: () =>
    set((state) => ({
      redCard: { ...state.initialRedCard, hp: state.initialRedCard.maxHp },
      blueCard: { ...state.initialBlueCard, hp: state.initialBlueCard.maxHp },
      battleLogs: [],
      isBattling: false,
      currentRound: 0,
      winner: null,
    })),

  clearLogs: () => set({ battleLogs: [] }),
}));

export type { SkillType, Card, BattleRound };
