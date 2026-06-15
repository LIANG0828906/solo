import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { CardEffect, ResolvedEffect } from '../cards/effects';
import { getCardById } from '../cards/data';
import {
  PlayerState,
  createPlayerState,
  addToChainStack,
  removeFromChainStack,
  clearChainStack,
  takeSnapshot,
  rollbackToSnapshot,
  executeChain,
  sortChainByPriority,
  ChainStackItem,
  StateSnapshot
} from '../state/tracker';

const STORAGE_KEY = 'card-chain-game-state';

interface GameState {
  currentPlayerIndex: number;
  playerCount: number;
  players: PlayerState[];
  isAnimating: boolean;
  isRollingBack: boolean;
  lastResolvedEffects: ResolvedEffect[];
  turnTransition: boolean;
  lastExecutionDuration: number;
  performanceWarning: boolean;

  getCurrentPlayerState: () => PlayerState;
  getCurrentPlayerEffectState: () => PlayerState['state'];
  getCurrentPlayerChainStack: () => ChainStackItem[];
  getCurrentPlayerHistory: () => StateSnapshot[];
  getSortedChain: () => ChainStackItem[];

  addEffectToChain: (effectId: string) => void;
  removeEffectFromChain: (itemId: string) => void;
  executeChainAction: () => void;
  rollbackLastSnapshot: () => void;
  nextTurn: () => void;
  setPlayerCount: (count: number) => void;
  clearChain: () => void;
  resetGame: () => void;
  loadFromStorage: () => void;
  saveToStorage: () => void;
}

const createInitialPlayers = (count: number): PlayerState[] => {
  return Array.from({ length: count }, (_, i) => createPlayerState(i));
};

export const useGameStore = create<GameState>((set, get) => ({
  currentPlayerIndex: 0,
  playerCount: 2,
  players: createInitialPlayers(2),
  isAnimating: false,
  isRollingBack: false,
  lastResolvedEffects: [],
  turnTransition: false,
  lastExecutionDuration: 0,
  performanceWarning: false,

  getCurrentPlayerState: () => {
    const state = get();
    return state.players[state.currentPlayerIndex];
  },

  getCurrentPlayerEffectState: () => {
    const state = get();
    return state.players[state.currentPlayerIndex].state;
  },

  getCurrentPlayerChainStack: () => {
    const state = get();
    return state.players[state.currentPlayerIndex].chainStack;
  },

  getCurrentPlayerHistory: () => {
    const state = get();
    return state.players[state.currentPlayerIndex].history;
  },

  getSortedChain: () => {
    const state = get();
    return sortChainByPriority(state.players[state.currentPlayerIndex].chainStack);
  },

  addEffectToChain: (effectId: string) => {
    const effect = getCardById(effectId);
    if (!effect) return;

    set(state => {
      const currentPlayer = state.players[state.currentPlayerIndex];
      if (currentPlayer.chainStack.length >= 20) return state;
      
      const itemId = uuidv4();
      const updatedPlayer = addToChainStack(currentPlayer, effect, itemId);
      
      const newPlayers = state.players.map((p, i) => 
        i === state.currentPlayerIndex ? updatedPlayer : p
      );
      
      return { players: newPlayers };
    });
    
    get().saveToStorage();
  },

  removeEffectFromChain: (itemId: string) => {
    set(state => {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const updatedPlayer = removeFromChainStack(currentPlayer, itemId);
      
      const newPlayers = state.players.map((p, i) => 
        i === state.currentPlayerIndex ? updatedPlayer : p
      );
      
      return { players: newPlayers };
    });
    
    get().saveToStorage();
  },

  executeChainAction: () => {
    const state = get();
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    if (currentPlayer.chainStack.length === 0) return;
    
    const { playerState: playerWithSnapshot } = takeSnapshot(
      currentPlayer,
      `连锁执行前 (${currentPlayer.chainStack.length}个效果)`
    );
    
    const result = executeChain(playerWithSnapshot);
    if (!result) return;
    
    const totalDuration = result.duration;
    const hasWarning = totalDuration > 200;
    
    if (hasWarning) {
      console.warn(`性能警告: 连锁解析耗时 ${totalDuration.toFixed(2)}ms，超过200ms阈值`);
    } else {
      console.log(`性能监控: 连锁解析耗时 ${totalDuration.toFixed(2)}ms`);
    }
    
    set({ isAnimating: true });
    
    setTimeout(() => {
      set(state => {
        const newPlayers = state.players.map((p, i) => 
          i === state.currentPlayerIndex ? result.playerState : p
        );
        
        return {
          players: newPlayers,
          isAnimating: false,
          lastResolvedEffects: result.resolvedEffects,
          lastExecutionDuration: totalDuration,
          performanceWarning: hasWarning
        };
      });
      
      get().saveToStorage();
    }, 300);
  },

  rollbackLastSnapshot: () => {
    const state = get();
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    if (currentPlayer.history.length === 0) return;
    
    const lastSnapshot = currentPlayer.history[currentPlayer.history.length - 1];
    const rolledBack = rollbackToSnapshot(currentPlayer, lastSnapshot.id);
    
    if (!rolledBack) return;
    
    set({ isRollingBack: true });
    
    setTimeout(() => {
      set(state => {
        const newPlayers = state.players.map((p, i) => 
          i === state.currentPlayerIndex ? rolledBack : p
        );
        
        return {
          players: newPlayers,
          isRollingBack: false,
          lastResolvedEffects: []
        };
      });
      
      get().saveToStorage();
    }, 500);
  },

  nextTurn: () => {
    set(state => {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const clearedPlayer = clearChainStack(currentPlayer);
      
      const newPlayers = state.players.map((p, i) => 
        i === state.currentPlayerIndex ? clearedPlayer : p
      );
      
      return {
        players: newPlayers,
        turnTransition: true
      };
    });
    
    setTimeout(() => {
      set(state => ({
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.playerCount,
        turnTransition: false,
        lastResolvedEffects: []
      }));
      
      get().saveToStorage();
    }, 300);
  },

  setPlayerCount: (count: number) => {
    if (count < 2 || count > 4) return;
    
    set({
      playerCount: count,
      currentPlayerIndex: 0,
      players: createInitialPlayers(count),
      lastResolvedEffects: []
    });
    
    get().saveToStorage();
  },

  clearChain: () => {
    set(state => {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const updatedPlayer = clearChainStack(currentPlayer);
      
      const newPlayers = state.players.map((p, i) => 
        i === state.currentPlayerIndex ? updatedPlayer : p
      );
      
      return { players: newPlayers };
    });
    
    get().saveToStorage();
  },

  resetGame: () => {
    set(state => ({
      currentPlayerIndex: 0,
      players: createInitialPlayers(state.playerCount),
      lastResolvedEffects: [],
      lastExecutionDuration: 0,
      performanceWarning: false
    }));
    
    get().saveToStorage();
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          currentPlayerIndex: data.currentPlayerIndex ?? 0,
          playerCount: data.playerCount ?? 2,
          players: data.players ?? createInitialPlayers(2)
        });
      }
    } catch (e) {
      console.error('Failed to load game state:', e);
    }
  },

  saveToStorage: () => {
    try {
      const state = get();
      const data = {
        currentPlayerIndex: state.currentPlayerIndex,
        playerCount: state.playerCount,
        players: state.players
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save game state:', e);
    }
  }
}));
