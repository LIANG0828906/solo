import { useCallback, useRef } from 'react';
import { useGameStore } from '../store/useGameStore';
import type { BattleLogEntry } from '../types';

interface AnimationQueueItem {
  log: BattleLogEntry;
  delay: number;
}

export function useAnimation() {
  const { setAnimationState, setIsAnimating } = useGameStore();
  const animationTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearAnimation = useCallback(() => {
    if (animationTimeout.current) {
      clearTimeout(animationTimeout.current);
      animationTimeout.current = null;
    }
    setAnimationState({
      type: 'idle',
      sourceUnitId: null,
      targetUnitId: null,
      timestamp: 0,
    });
    setIsAnimating(false);
  }, [setAnimationState, setIsAnimating]);

  const playAnimationSequence = useCallback(
    async (logs: BattleLogEntry[]): Promise<void> => {
      return new Promise((resolve) => {
        setIsAnimating(true);

        const queue: AnimationQueueItem[] = logs
          .filter((log) => log.type !== 'death')
          .map((log, index) => ({
            log,
            delay: index * 300,
          }));

        if (queue.length === 0) {
          clearAnimation();
          resolve();
          return;
        }

        let currentIndex = 0;

        const playNext = () => {
          if (currentIndex >= queue.length) {
            setTimeout(() => {
              clearAnimation();
              resolve();
            }, 500);
            return;
          }

          const item = queue[currentIndex];
          setAnimationState({
            type: item.log.type,
            sourceUnitId: item.log.attackerId,
            targetUnitId: item.log.targetId,
            timestamp: Date.now(),
          });

          currentIndex++;
          animationTimeout.current = setTimeout(playNext, 300);
        };

        playNext();
      });
    },
    [setAnimationState, setIsAnimating, clearAnimation]
  );

  return {
    playAnimationSequence,
    clearAnimation,
  };
}
