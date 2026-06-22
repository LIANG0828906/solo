import { create } from 'zustand';
import {
  Card,
  Fighter,
  FloatingNumber,
  HistoryPoint,
} from '../engine/types';

interface BattleStore {
  player: Fighter;
  enemy: Fighter;
  playerHand: Card[];
  enemyHand: Card[];
  currentTurn: 'player' | 'enemy';
  turnCount: number;
  isOver: boolean;
  winner: 'player' | 'enemy' | null;
  isAnimating: boolean;
  hpHistory: HistoryPoint[];
  mpHistory: HistoryPoint[];
  attackHistory: HistoryPoint[];
  skillUsage: Record<string, number>;
  floatingNumbers: FloatingNumber[];

  initBattle: (
    player: Fighter,
    enemy: Fighter,
    playerHand: Card[],
    enemyHand: Card[],
    initialHP: HistoryPoint,
    initialMP: HistoryPoint,
    initialATK: HistoryPoint
  ) => void;
  updateFighters: (player: Fighter, enemy: Fighter) => void;
  addFloatingNumbers: (floats: FloatingNumber[]) => void;
  clearFloatingNumbers: () => void;
  updateSkillUsage: (usage: Record<string, number>) => void;
  incrementTurn: (hp: HistoryPoint, mp: HistoryPoint, attack: HistoryPoint) => void;
  endBattle: (winner: 'player' | 'enemy', floats: FloatingNumber[]) => void;
  setAnimating: (val: boolean) => void;
  resetBattle: () => void;
}

const defaultFighter: Fighter = {
  hp: 100,
  maxHp: 100,
  mp: 20,
  maxMp: 20,
  shield: 0,
  baseAttack: 10,
  attack: 10,
  statusEffects: [],
  isFrozen: false,
};

export const useBattleStore = create<BattleStore>((set) => ({
  player: { ...defaultFighter },
  enemy: { ...defaultFighter },
  playerHand: [],
  enemyHand: [],
  currentTurn: 'player',
  turnCount: 0,
  isOver: false,
  winner: null,
  isAnimating: false,
  hpHistory: [],
  mpHistory: [],
  attackHistory: [],
  skillUsage: {},
  floatingNumbers: [],

  initBattle: (player, enemy, playerHand, enemyHand, initialHP, initialMP, initialATK) =>
    set({
      player,
      enemy,
      playerHand,
      enemyHand,
      currentTurn: 'player',
      turnCount: 0,
      isOver: false,
      winner: null,
      isAnimating: false,
      hpHistory: [initialHP],
      mpHistory: [initialMP],
      attackHistory: [initialATK],
      skillUsage: {},
      floatingNumbers: [],
    }),

  updateFighters: (player, enemy) => set({ player, enemy }),

  addFloatingNumbers: (floats) =>
    set((state) => ({
      floatingNumbers: [...state.floatingNumbers, ...floats],
    })),

  clearFloatingNumbers: () => set({ floatingNumbers: [] }),

  updateSkillUsage: (usage) => set({ skillUsage: usage }),

  incrementTurn: (hp, mp, attack) =>
    set((state) => ({
      turnCount: state.turnCount + 1,
      hpHistory: [...state.hpHistory, hp],
      mpHistory: [...state.mpHistory, mp],
      attackHistory: [...state.attackHistory, attack],
    })),

  endBattle: (winner, floats) =>
    set((state) => ({
      isOver: true,
      winner,
      floatingNumbers: [...state.floatingNumbers, ...floats],
    })),

  setAnimating: (val) => set({ isAnimating: val }),

  resetBattle: () =>
    set({
      player: { ...defaultFighter },
      enemy: { ...defaultFighter },
      playerHand: [],
      enemyHand: [],
      currentTurn: 'player',
      turnCount: 0,
      isOver: false,
      winner: null,
      isAnimating: false,
      hpHistory: [],
      mpHistory: [],
      attackHistory: [],
      skillUsage: {},
      floatingNumbers: [],
    }),
}));
