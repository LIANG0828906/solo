import { useEffect, useRef, useReducer } from 'react';
import {
  GameState,
  GameAction,
  createInitialState,
  reducer,
} from './store';

export interface GameEngineResult {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
}

export function useGameEngine(): GameEngineResult {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);
  const logicTimerRef = useRef<number>(0);
  const lastRenderRef = useRef<number>(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    logicTimerRef.current = window.setInterval(() => {
      dispatch({ type: 'TICK_LOGIC' });
    }, 1000);

    let running = true;
    const loop = (now: number) => {
      if (!running) return;
      const delta = (now - lastRenderRef.current) / 1000;
      lastRenderRef.current = now;
      dispatch({ type: 'TICK_RENDER', delta, time: now });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      running = false;
      clearInterval(logicTimerRef.current);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return { state, dispatch };
}
