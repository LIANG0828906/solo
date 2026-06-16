import { create } from 'zustand';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { Card, GameState } from './types';
import { createCardPool, drawRandomCard } from './data/cardPool';
import {
  canDrawCard,
  checkGameEnd,
  processCardPlay,
  processEnemyAttack,
  startNewTurn,
} from './utils/combatEngine';

interface GameStore extends GameState {
  selectedCardId: string | null;
  isComboFlash: boolean;
  isScreenShake: boolean;
  isTurnTransition: boolean;
  shakeIntensity: number;

  drawCard: () => boolean;
  selectCard: (cardId: string | null) => void;
  playCard: (cardId: string) => boolean;
  endPlayPhase: () => void;
  enemyAttack: () => void;
  startNewTurn: () => void;
  restartGame: () => void;
  saveGame: () => Promise<void>;
  loadGame: () => Promise<boolean>;
  setComboFlash: (value: boolean) => void;
  setScreenShake: (value: boolean, intensity?: number) => void;
  setTurnTransition: (value: boolean) => void;
}

const createInitialState = (): Omit<GameState, 'cardPool'> => ({
  player: {
    hp: 50,
    maxHp: 50,
    gold: 10,
    hand: [],
    deck: [],
  },
  enemy: {
    hp: 80,
    maxHp: 80,
    attack: 5,
    name: '暗影领主',
  },
  turn: 1,
  phase: 'draw',
  cardsPlayedThisTurn: 0,
  comboChain: { tag: null, count: 0 },
  gameResult: null,
  placedCards: [],
});

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialState(),
  cardPool: createCardPool(),
  selectedCardId: null,
  isComboFlash: false,
  isScreenShake: false,
  isTurnTransition: false,
  shakeIntensity: 5,

  drawCard: () => {
    const state = get();
    if (!canDrawCard(state)) return false;

    const newCard = drawRandomCard(state.cardPool);
    set({
      player: {
        ...state.player,
        gold: state.player.gold - 2,
        hand: [...state.player.hand, newCard],
      },
    });
    return true;
  },

  selectCard: (cardId: string | null) => {
    set({ selectedCardId: cardId });
  },

  playCard: (cardId: string) => {
    const state = get();
    const card = state.player.hand.find((c) => c.id === cardId);
    if (!card) return false;
    if (state.phase !== 'draw' && state.phase !== 'play') return false;
    if (state.cardsPlayedThisTurn >= 3) return false;

    const newState = processCardPlay(
      { ...state, phase: 'play' },
      card
    );
    const result = checkGameEnd(newState);

    set({
      ...newState,
      selectedCardId: null,
      gameResult: result,
      phase: result ? 'ended' : 'play',
    });

    return true;
  },

  endPlayPhase: () => {
    set({ phase: 'enemy' });
  },

  enemyAttack: () => {
    const state = get();
    if (state.phase !== 'enemy') return;

    const newState = processEnemyAttack(state);
    const result = checkGameEnd(newState);

    set({
      ...newState,
      gameResult: result,
      phase: result ? 'ended' : 'enemy',
    });
  },

  startNewTurn: () => {
    const state = get();
    const newState = startNewTurn(state);
    set(newState);
  },

  restartGame: () => {
    set({
      ...createInitialState(),
      cardPool: createCardPool(),
      selectedCardId: null,
      isComboFlash: false,
      isScreenShake: false,
      isTurnTransition: false,
    });
  },

  saveGame: async () => {
    const state = get();
    const saveData = {
      player: state.player,
      enemy: state.enemy,
      turn: state.turn,
      phase: state.phase,
      cardsPlayedThisTurn: state.cardsPlayedThisTurn,
      comboChain: state.comboChain,
      placedCards: state.placedCards,
    };
    await idbSet('cardcascade_save', saveData);
  },

  loadGame: async () => {
    try {
      const saveData = await idbGet('cardcascade_save') as Omit<GameState, 'cardPool' | 'gameResult'> | undefined;
      if (!saveData) return false;

      const result = checkGameEnd(saveData as GameState);
      set({
        ...saveData,
        cardPool: createCardPool(),
        gameResult: result,
        selectedCardId: null,
        isComboFlash: false,
        isScreenShake: false,
        isTurnTransition: false,
      });
      return true;
    } catch {
      return false;
    }
  },

  setComboFlash: (value: boolean) => set({ isComboFlash: value }),
  setScreenShake: (value: boolean, intensity = 5) =>
    set({ isScreenShake: value, shakeIntensity: intensity }),
  setTurnTransition: (value: boolean) => set({ isTurnTransition: value }),
}));
