import { useEffect, useState, useRef } from 'react';
import { useIncubationStore } from '../store/incubationStore';

interface EvolutionAnimationState {
  rotation: number;
  scale: number;
  particleIntensity: number;
  showLightBeam: boolean;
  phase: 'idle' | 'rotating' | 'particles' | 'transition' | 'lightBeam';
  shouldTransition: boolean;
}

export function useEvolution() {
  const isEvolving = useIncubationStore((state) => state.isEvolving);
  const selectedEgg = useIncubationStore((state) => state.selectedEgg);

  const [animationState, setAnimationState] = useState<EvolutionAnimationState>({
    rotation: 0,
    scale: 1,
    particleIntensity: 0,
    showLightBeam: false,
    phase: 'idle',
    shouldTransition: false,
  });

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);
  const isAnimatingRef = useRef(false);

  useEffect(() => {
    if (isEvolving && !isAnimatingRef.current) {
      isAnimatingRef.current = true;
      startTimeRef.current = performance.now();

      const animate = (currentTime: number) => {
        const elapsed = (currentTime - startTimeRef.current) / 1000;

        if (elapsed >= 4) {
          isAnimatingRef.current = false;
          setAnimationState({
            rotation: 0,
            scale: 1,
            particleIntensity: 0,
            showLightBeam: false,
            phase: 'idle',
            shouldTransition: false,
          });
          return;
        }

        let rotation = 0;
        let scale = 1;
        let particleIntensity = 0;
        let showLightBeam = false;
        let phase: EvolutionAnimationState['phase'] = 'rotating';
        let shouldTransition = false;

        if (elapsed < 0.5) {
          const t = elapsed / 0.5;
          rotation = t * Math.PI * 4;
          scale = t < 0.5 ? 1 + t * 1 : 1.5 - (t - 0.5) * 0.6;
          particleIntensity = 0;
          phase = 'rotating';
        } else if (elapsed < 2) {
          const t = (elapsed - 0.5) / 1.5;
          rotation = Math.PI * 4 + t * Math.PI * 8;
          scale = 1.2 - t * 0.2;
          particleIntensity = t;
          phase = 'particles';
        } else if (elapsed < 2.5) {
          const t = (elapsed - 2) / 0.5;
          const easeOut = 1 - Math.pow(1 - t, 2);
          rotation = Math.PI * 12 + (1 - easeOut) * Math.PI * 2;
          scale = 1;
          particleIntensity = 1 - t;
          phase = 'transition';
          shouldTransition = true;
        } else {
          const t = (elapsed - 2.5) / 1.5;
          const easeOut = 1 - Math.pow(1 - t, 2);
          rotation = Math.PI * 12 + (1 - easeOut) * Math.PI * 1;
          scale = 1;
          particleIntensity = 0;
          showLightBeam = true;
          phase = 'lightBeam';
        }

        setAnimationState({
          rotation,
          scale,
          particleIntensity,
          showLightBeam,
          phase,
          shouldTransition,
        });

        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animationFrameRef.current = requestAnimationFrame(animate);
    }
  }, [isEvolving, selectedEgg]);

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      isAnimatingRef.current = false;
    };
  }, []);

  return animationState;
}
