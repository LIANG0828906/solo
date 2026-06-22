import { useEffect, useRef, useCallback } from 'react';
import { useGameStore } from '../store/gameStore';
import {
  SETTLE_INTERVAL,
  EVENT_INTERVAL,
  FRAME_TIME,
  TARGET_FPS
} from '../types/gameTypes';
import { shouldTriggerEvent, getRandomEventType, createGameEvent } from '../core/eventSystem';

export const useGameLoop = () => {
  const lastSettleTime = useRef<number>(Date.now());
  const lastEventTime = useRef<number>(Date.now());
  const lastFrameTime = useRef<number>(Date.now());
  const frameAccumulator = useRef<number>(0);
  const animationFrameId = useRef<number | null>(null);

  const settleResources = useGameStore(state => state.settleResources);
  const triggerEvent = useGameStore(state => state.triggerEvent);
  const updateTimers = useGameStore(state => state.updateTimers);

  const gameLoop = useCallback(() => {
    const now = Date.now();
    const deltaTime = now - lastFrameTime.current;
    lastFrameTime.current = now;
    frameAccumulator.current += deltaTime;

    while (frameAccumulator.current >= FRAME_TIME) {
      updateTimers(FRAME_TIME);
      frameAccumulator.current -= FRAME_TIME;
    }

    if (now - lastSettleTime.current >= SETTLE_INTERVAL) {
      settleResources();
      lastSettleTime.current = now;
    }

    if (now - lastEventTime.current >= EVENT_INTERVAL) {
      if (shouldTriggerEvent()) {
        const eventType = getRandomEventType();
        const event = createGameEvent(eventType);
        triggerEvent(event);
      }
      lastEventTime.current = now;
    }

    animationFrameId.current = requestAnimationFrame(gameLoop);
  }, [settleResources, triggerEvent, updateTimers]);

  useEffect(() => {
    lastSettleTime.current = Date.now();
    lastEventTime.current = Date.now();
    lastFrameTime.current = Date.now();
    
    animationFrameId.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [gameLoop]);

  return null;
};

export default useGameLoop;
