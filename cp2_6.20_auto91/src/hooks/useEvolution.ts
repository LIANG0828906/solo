import { useEffect, useState, useRef } from 'react';
import { useIncubationStore } from '../store/incubationStore';

interface EvolutionAnimationState {
  rotation: number;
  scale: number;
  particleIntensity: number;
  showLightBeam: boolean;
  phase: 'idle' | 'rotating' | 'particles' | 'lightBeam';
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

        if (elapsed < 0.5) {
          const t = elapsed / 0.5;
          rotation = t * Math.PI * 4;
          scale = 1 + Math.sin(t * Math.PI) * 0.5;
          particleIntensity = t * 0.5;
          phase = 'rotating';
        } else if (elapsed < 2) {
          const t = (elapsed - 0.5) / 1.5;
          rotation = Math.PI * 4 + t * Math.PI * 8;
          scale = 1.5 - t * 0.3;
          particleIntensity = 0.5 + t * 0.5;
          phase = 'particles';
        } else {
          const t = (elapsed - 2) / 2;
          rotation = Math.PI * 12;
          scale = 1.2 - t * 0.2;
          particleIntensity = 1 - t;
          showLightBeam = true;
          phase = 'lightBeam';
        }

        setAnimationState({
          rotation,
          scale,
          particleIntensity,
          showLightBeam,
          phase,
          shouldTransition: elapsed >= 2,
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
