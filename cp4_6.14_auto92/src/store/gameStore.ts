import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { CardEffect, ResolvedEffect, EffectState } from '../cards/types';
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
  sortChainByPriority
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
  
  getCurrentPlayer: () => PlayerState;
  addEffectToChain: (effectId: string) => void;
  removeEffectFromChain: (itemId: string) => void;
  executeChain: () => void;
  rollbackLastSnapshot: () => void;
  nextTurn: () => void;
  setPlayerCount: (count: number) => void;
  setAnimating: (value: boolean) => void;
  clearChain: () => void;
  getSortedChain: () => { id: string; effect: CardEffect; addedAt: number }[];
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

  getCurrentPlayer: () => {
    const state = get();
    return state.players[state.currentPlayerIndex];
  },

  addEffectToChain: (effectId: string) => {
    const effect = getCardById(effectId);
    if (!effect) return;

    set(state => {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const itemId = uuidv4();
      const updatedPlayer = addToChainStack(currentPlayer, effect, itemId);
      
      const newPlayers = [...state.players];
      newPlayers[state.currentPlayerIndex] = updatedPlayer;
      
      return { players: newPlayers };
    });
    
    get().saveToStorage();
  },

  removeEffectFromChain: (itemId: string) => {
    set(state => {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const updatedPlayer = removeFromChainStack(currentPlayer, itemId);
      
      const newPlayers = [...state.players];
      newPlayers[state.currentPlayerIndex] = updatedPlayer;
      
      return { players: newPlayers };
    });
    
    get().saveToStorage();
  },

  executeChain: () => {
    const state = get();
    const currentPlayer = state.players[state.currentPlayerIndex];
    
    if (currentPlayer.chainStack.length === 0) return;
    
    const { snapshot, playerState: playerWithSnapshot } = takeSnapshot(
      currentPlayer,
      `连锁执行前 (${currentPlayer.chainStack.length}个效果)`
    );
    
    const result = executeChain(playerWithSnapshot);
    if (!result) return;
    
    set({ isAnimating: true });
    
    setTimeout(() => {
      set(state => {
        const newPlayers = [...state.players];
        newPlayers[state.currentPlayerIndex] = result.playerState;
        
        return {
          players: newPlayers,
          isAnimating: false,
          lastResolvedEffects: result.resolvedEffects
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
        const newPlayers = [...state.players];
        newPlayers[state.currentPlayerIndex] = rolledBack;
        
        return {
          players: newPlayers,
          isRollingBack: false
        };
      });
      
      get().saveToStorage();
    }, 500);
  },

  nextTurn: () => {
    set(state => {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const clearedPlayer = clearChainStack(currentPlayer);
      
      const newPlayers = [...state.players];
      newPlayers[state.currentPlayerIndex] = clearedPlayer;
      
      return {
        players: newPlayers,
        turnTransition: true
      };
    });
    
    setTimeout(() => {
      set(state => ({
        currentPlayerIndex: (state.currentPlayerIndex + 1) % state.playerCount,
        turnTransition: false
      }));
      
      get().saveToStorage();
    }, 300);
  },

  setPlayerCount: (count: number) => {
    if (count < 2 || count > 4) return;
    
    set({
      playerCount: count,
      currentPlayerIndex: 0,
      players: createInitialPlayers(count)
    });
    
    get().saveToStorage();
  },

  setAnimating: (value: boolean) => {
    set({ isAnimating: value });
  },

  clearChain: () => {
    set(state => {
      const currentPlayer = state.players[state.currentPlayerIndex];
      const updatedPlayer = clearChainStack(currentPlayer);
      
      const newPlayers = [...state.players];
      newPlayers[state.currentPlayerIndex] = updatedPlayer;
      
      return { players: newPlayers };
    });
    
    get().saveToStorage();
  },

  getSortedChain: () => {
    const currentPlayer = get().getCurrentPlayer();
    return sortChainByPriority(currentPlayer.chainStack);
  },

  resetGame: () => {
    set(state => ({
      currentPlayerIndex: 0,
      players: createInitialPlayers(state.playerCount),
      lastResolvedEffects: []
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
