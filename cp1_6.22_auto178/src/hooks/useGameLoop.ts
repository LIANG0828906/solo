import { useEffect, useRef } from 'react';
import { useGameStore } from '@/store/useGameStore';
import { updateEnvironment } from '@/modules/Environment';
import { updateAllPlants } from '@/modules/PlantGrowth';
import { updateParticles } from '@/modules/ParticleSystem';
import { updateAutoSystems } from '@/modules/AutoSystem';
import { saveGame } from '@/modules/Persistence';

interface UseGameLoopOptions {
  onTick?: (dt: number) => void;
  onRender?: () => void;
  maxFps?: number;
}

export function useGameLoop(options: UseGameLoopOptions = {}): void {
  const { onTick, onRender, maxFps = 60 } = options;
  const rafIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(performance.now());
  const frameAccumulator = useRef<number>(0);
  const minFrameTime = 1000 / maxFps;

  useEffect(() => {
    const initialState = useGameStore.getState();
    lastTimeRef.current = performance.now();
    useGameStore.getState().setLastTickTime(Date.now());

    const tick = (now: number): void => {
      const frameDelta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      frameAccumulator.current += frameDelta;

      while (frameAccumulator.current >= minFrameTime) {
        const dtSec = Math.min(minFrameTime / 1000, 0.05);
        frameAccumulator.current -= minFrameTime;

        updateEnvironment(dtSec);
        updateAllPlants(dtSec);
        updateAutoSystems(dtSec);
        updateParticles(dtSec);
        onTick?.(dtSec);
      }

      onRender?.();
      saveGame();
      rafIdRef.current = requestAnimationFrame(tick);
    };

    rafIdRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
      saveGame(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
