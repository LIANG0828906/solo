import { create } from 'zustand';
import {
  GameState,
  Target,
  Phase,
  canPlayCard,
  playMinionCard,
  playSpellCard,
  playWeaponCard,
  canAttackTarget,
  attackTarget,
  needsTarget,
} from './gameEngine';
import {
  createPlayer,
  restoreMana,
  drawCard,
  resetMinionAttacks,
  getDeckRemaining,
} from './player';
import { SpellCard } from './card';
import { makeAIDecision, executeAIDecision } from './AI';

function createInitialState(): GameState {
  return {
    turn: 1,
    currentPlayer: 'player',
    phase: 'main',
    player: createPlayer('player', '玩家'),
    ai: createPlayer('ai', 'AI对手'),
    selectedCardIndex: null,
    selectedMinion: null,
    pendingTarget: null,
    gameOver: false,
    winner: null,
    isAiThinking: false,
    battleLog: [],
    animationState: {
      flyingCard: null,
      screenShake: false,
      damagingTargets: [],
    },
  };
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

interface GameActions {
  resetGame: () => void;
  selectCard: (index: number | null) => void;
  selectMinion: (side: 'player' | 'ai', row: number, col: number) => void;
  clearSelection: () => void;
  playCardOnCell: (row: number, col: number) => boolean;
  playCardOnTarget: (target: Target) => boolean;
  playCardNoTarget: () => boolean;
  attackWithSelected: (target: Target) => boolean;
  endTurn: () => void;
  startAITurn: () => Promise<void>;
  clearScreenShake: () => void;
  clearDamagingTargets: () => void;
  getPlayerDeckRemaining: () => number;
  getAIDeckRemaining: () => number;
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...createInitialState(),

  resetGame: () => {
    set(createInitialState());
  },

  selectCard: (index: number | null) => {
    const state = get();
    if (index === null) {
      set({ selectedCardIndex: null, selectedMinion: null, pendingTarget: null });
      return;
    }
    if (!canPlayCard(state, 'player', index)) return;
    const card = state.player.hand[index];
    let pendingTarget = null;
    if (card.type === 'spell') {
      const spell = card as SpellCard;
      if (needsTarget(spell.effect)) {
        pendingTarget = { cardIndex: index, effect: spell.effect };
      }
    }
    set({ selectedCardIndex: index, selectedMinion: null, pendingTarget });
  },

  selectMinion: (side: 'player' | 'ai', row: number, col: number) => {
    const state = get();
    if (state.gameOver || state.currentPlayer !== 'player' || state.phase !== 'main') return;

    if (state.selectedCardIndex !== null && state.pendingTarget) {
      const target: Target = { type: 'minion', side, row, col };
      get().playCardOnTarget(target);
      return;
    }

    if (side === 'player') {
      const player = state.player;
      const minion = player.board[row][col];
      if (minion && minion.canAttack && minion.attacksThisTurn < minion.maxAttacksPerTurn && !minion.frozen) {
        set({ selectedMinion: { side, row, col }, selectedCardIndex: null, pendingTarget: null });
      } else if (state.selectedCardIndex !== null) {
        const card = state.player.hand[state.selectedCardIndex];
        if (card?.type === 'minion') {
          get().playCardOnCell(row, col);
        }
      } else {
        set({ selectedMinion: null });
      }
    } else {
      if (state.selectedMinion) {
        const target: Target = { type: 'minion', side, row, col };
        get().attackWithSelected(target);
      }
    }
  },

  clearSelection: () => {
    set({ selectedCardIndex: null, selectedMinion: null, pendingTarget: null });
  },

  playCardOnCell: (row: number, col: number): boolean => {
    const state = get();
    if (state.selectedCardIndex === null) return false;
    const newState = deepClone(state);
    const success = playMinionCard(newState, 'player', state.selectedCardIndex, row, col);
    if (success) {
      newState.selectedCardIndex = null;
      newState.pendingTarget = null;
      set(newState);
      setTimeout(() => get().clearScreenShake(), 300);
      setTimeout(() => get().clearDamagingTargets(), 500);
    }
    return success;
  },

  playCardOnTarget: (target: Target): boolean => {
    const state = get();
    if (state.selectedCardIndex === null) return false;
    const newState = deepClone(state);
    const success = playSpellCard(newState, 'player', state.selectedCardIndex, target);
    if (success) {
      newState.selectedCardIndex = null;
      newState.pendingTarget = null;
      set(newState);
      setTimeout(() => get().clearScreenShake(), 300);
      setTimeout(() => get().clearDamagingTargets(), 500);
    }
    return success;
  },

  playCardNoTarget: (): boolean => {
    const state = get();
    if (state.selectedCardIndex === null) return false;
    const card = state.player.hand[state.selectedCardIndex];
    if (!card) return false;
    const newState = deepClone(state);
    let success = false;
    if (card.type === 'weapon') {
      success = playWeaponCard(newState, 'player', state.selectedCardIndex);
    } else if (card.type === 'spell') {
      success = playSpellCard(newState, 'player', state.selectedCardIndex, null);
    }
    if (success) {
      newState.selectedCardIndex = null;
      newState.pendingTarget = null;
      set(newState);
      setTimeout(() => get().clearScreenShake(), 300);
      setTimeout(() => get().clearDamagingTargets(), 500);
    }
    return success;
  },

  attackWithSelected: (target: Target): boolean => {
    const state = get();
    if (!state.selectedMinion) return false;
    const newState = deepClone(state);
    const { side, row, col } = state.selectedMinion;
    const success = attackTarget(newState, side, row, col, target);
    if (success) {
      newState.selectedMinion = null;
      set(newState);
      setTimeout(() => get().clearScreenShake(), 300);
      setTimeout(() => get().clearDamagingTargets(), 500);
    }
    return success;
  },

  endTurn: () => {
    const state = get();
    if (state.gameOver || state.currentPlayer !== 'player') return;
    const newState = deepClone(state);
    newState.phase = 'end';
    newState.selectedCardIndex = null;
    newState.selectedMinion = null;
    newState.pendingTarget = null;
    set(newState);

    setTimeout(() => {
      const s = get();
      const ns = deepClone(s);
      ns.currentPlayer = 'ai';
      ns.phase = 'draw';
      drawCard(ns.ai);
      restoreMana(ns.ai);
      resetMinionAttacks(ns.ai);
      if (ns.ai.weapon) {
        ns.ai.weapon.durability -= 1;
        if (ns.ai.weapon.durability <= 0) {
          ns.ai.weapon = null;
        }
      }
      ns.phase = 'main';
      ns.isAiThinking = true;
      set(ns);
      get().startAITurn();
    }, 300);
  },

  startAITurn: async () => {
    const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

    let iterations = 0;
    const maxIterations = 20;

    while (iterations < maxIterations) {
      const state = get();
      if (state.gameOver || state.currentPlayer !== 'ai') break;

      await sleep(1000);

      const currentState = get();
      if (currentState.gameOver || currentState.currentPlayer !== 'ai') break;

      const decision = makeAIDecision(currentState);
      if (!decision || decision.type === 'end_turn') break;

      const ns = deepClone(currentState);
      const executed = executeAIDecision(ns, decision);
      if (!executed) break;

      ns.isAiThinking = false;
      set(ns);
      setTimeout(() => get().clearScreenShake(), 300);
      setTimeout(() => get().clearDamagingTargets(), 500);
      iterations++;

      await sleep(800);
      set({ isAiThinking: true });
    }

    const finalState = get();
    if (finalState.gameOver) {
      set({ isAiThinking: false });
      return;
    }

    const ns = deepClone(finalState);
    ns.isAiThinking = false;
    ns.turn = ns.turn + 1;
    ns.currentPlayer = 'player';
    ns.phase = 'draw';
    drawCard(ns.player);
    restoreMana(ns.player);
    resetMinionAttacks(ns.player);
    if (ns.player.weapon) {
      ns.player.weapon.durability -= 1;
      if (ns.player.weapon.durability <= 0) {
        ns.player.weapon = null;
      }
    }
    ns.phase = 'main';
    set(ns);
  },

  clearScreenShake: () => {
    const state = get();
    if (state.animationState.screenShake) {
      set({
        animationState: {
          ...state.animationState,
          screenShake: false,
        },
      });
    }
  },

  clearDamagingTargets: () => {
    const state = get();
    if (state.animationState.damagingTargets.length > 0) {
      set({
        animationState: {
          ...state.animationState,
          damagingTargets: [],
        },
      });
    }
  },

  getPlayerDeckRemaining: () => {
    return getDeckRemaining(get().player);
  },

  getAIDeckRemaining: () => {
    return getDeckRemaining(get().ai);
  },
}));
