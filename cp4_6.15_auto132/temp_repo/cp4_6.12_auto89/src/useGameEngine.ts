import { useReducer, useCallback } from 'react';
import { reducer, initialState, GameState, GameAction } from './GameEngine';

export function useGameEngine() {
  const [state, dispatch] = useReducer(reducer, initialState);

  const useSkill = useCallback((skillId: string, actor: 'player' | 'opponent') => {
    dispatch({ type: 'USE_SKILL', skillId, actor });
  }, []);

  const endAnimation = useCallback(() => {
    dispatch({ type: 'END_ANIMATION' });
  }, []);

  const hideTurnIndicator = useCallback(() => {
    dispatch({ type: 'HIDE_TURN_INDICATOR' });
  }, []);

  const aiTurn = useCallback(() => {
    dispatch({ type: 'AI_TURN' });
  }, []);

  const resetGame = useCallback(() => {
    dispatch({ type: 'RESET_GAME' });
  }, []);

  return {
    state,
    dispatch,
    useSkill,
    endAnimation,
    hideTurnIndicator,
    aiTurn,
    resetGame,
  };
}

export type { GameState, GameAction };
