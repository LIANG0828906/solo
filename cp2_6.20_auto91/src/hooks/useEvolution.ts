import { useEffect, useState, useRef } from 'react';
import { useIncubationStore } from '../store/incubationStore';

interface EvolutionAnimationState {
  rotation: number;
  scale: number;
  particleIntensity: number;
  showLightBeam: boolean;
  phase: 'idle' | 'rotating' | 'particles' | 'complete';
}

export function useEvolution() {
  const isEvolving = useIncubationStore((state) => state.isEvolving);
  const finishEvolving = useIncubationStore((state) => state.finishEvolving);
  const selectedEgg = useIncubationStore((state) => state.selectedEgg);

  const [animationState, setAnimationState] = useState<EvolutionAnimationState>({
    rotation: 0,
    scale: 1,
    particleIntensity: 0,
    showLightBeam: false,
    phase: 'idle',
  });

  const startTimeRef = useRef<number>(0);
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    if (!isEvolving) {
      setAnimationState({
        rotation: 0,
        scale: 1,
        particleIntensity: 0,
        showLightBeam: false,
        phase: 'idle',
      });
      return;
    }

    startTimeRef.current = performance.now();

    const animate = (currentTime: number) => {
      const elapsed = (currentTime - startTimeRef.current) / 1000;
      const totalDuration = 3.5;

      if (elapsed >= totalDuration) {
        finishEvolving();
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
        const t = (elapsed - 2) / 1.5;
        rotation = Math.PI * 12;
        scale = 1.2 - t * 0.2;
        particleIntensity = 1 - t * 0.5;
        showLightBeam = true;
        phase = 'complete';
      }

      setAnimationState({
        rotation,
        scale,
        particleIntensity,
        showLightBeam,
        phase,
      });

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isEvolving, finishEvolving, selectedEgg]);

  return animationState;
}
