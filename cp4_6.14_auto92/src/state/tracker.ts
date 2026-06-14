import { EffectState, CardEffect, ResolvedEffect } from '../cards/effects';
import { resolveChain } from '../cards/effects';

export interface ChainStackItem {
  id: string;
  effect: CardEffect;
  addedAt: number;
}

export interface StateSnapshot {
  id: string;
  state: EffectState;
  chainStack: ChainStackItem[];
  timestamp: number;
  description: string;
}

export const createInitialState = (): EffectState => ({
  hp: 30,
  attack: 0,
  defense: 0,
  handCount: 5,
  deckCount: 20,
  fieldCards: [],
  statusCounters: {}
});

export const createPlayerState = (playerId: number) => ({
  playerId,
  state: createInitialState(),
  chainStack: [] as ChainStackItem[],
  history: [] as StateSnapshot[]
});

export type PlayerState = ReturnType<typeof createPlayerState>;

export const addToChainStack = (
  playerState: PlayerState,
  effect: CardEffect,
  itemId: string
): PlayerState => {
  const newItem: ChainStackItem = {
    id: itemId,
    effect,
    addedAt: Date.now()
  };
  
  return {
    ...playerState,
    chainStack: [...playerState.chainStack, newItem]
  };
};

export const removeFromChainStack = (
  playerState: PlayerState,
  itemId: string
): PlayerState => {
  return {
    ...playerState,
    chainStack: playerState.chainStack.filter(item => item.id !== itemId)
  };
};

export const clearChainStack = (playerState: PlayerState): PlayerState => {
  return {
    ...playerState,
    chainStack: []
  };
};

export const takeSnapshot = (
  playerState: PlayerState,
  description: string
): { snapshot: StateSnapshot; playerState: PlayerState } => {
  const snapshot: StateSnapshot = {
    id: `snap-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    state: {
      ...playerState.state,
      statusCounters: { ...playerState.state.statusCounters },
      fieldCards: [...playerState.state.fieldCards]
    },
    chainStack: [...playerState.chainStack],
    timestamp: Date.now(),
    description
  };
  
  return {
    snapshot,
    playerState: {
      ...playerState,
      history: [...playerState.history, snapshot]
    }
  };
};

export const rollbackToSnapshot = (
  playerState: PlayerState,
  snapshotId: string
): PlayerState | null => {
  const snapshotIndex = playerState.history.findIndex(s => s.id === snapshotId);
  if (snapshotIndex === -1) return null;
  
  const snapshot = playerState.history[snapshotIndex];
  
  return {
    ...playerState,
    state: {
      ...snapshot.state,
      statusCounters: { ...snapshot.state.statusCounters },
      fieldCards: [...snapshot.state.fieldCards]
    },
    chainStack: [...snapshot.chainStack],
    history: playerState.history.slice(0, snapshotIndex)
  };
};

export const executeChain = (
  playerState: PlayerState
): { playerState: PlayerState; resolvedEffects: ResolvedEffect[]; duration: number } | null => {
  if (playerState.chainStack.length === 0) return null;
  
  const effects = playerState.chainStack.map(item => item.effect);
  const { finalState, resolvedEffects, duration } = resolveChain(effects, playerState.state);
  
  return {
    playerState: {
      ...playerState,
      state: {
        ...finalState,
        statusCounters: { ...finalState.statusCounters },
        fieldCards: [...finalState.fieldCards]
      },
      chainStack: []
    },
    resolvedEffects,
    duration
  };
};

export const sortChainByPriority = (chainStack: ChainStackItem[]): ChainStackItem[] => {
  return [...chainStack].sort((a, b) => b.effect.priority - a.effect.priority);
};
