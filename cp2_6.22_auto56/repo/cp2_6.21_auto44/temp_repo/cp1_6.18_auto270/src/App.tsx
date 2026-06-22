import React, { useEffect, useRef } from 'react';
import Controls from './components/Controls';
import Visualizer from './components/Visualizer';
import InfoPanel from './components/InfoPanel';
import { useSortStore } from './store/sortStore';

const App: React.FC = () => {
  const {
    isPlaying,
    stepForward,
    updateElapsedTime,
    currentStepIndex,
    steps,
  } = useSortStore();

  const animationFrameRef = useRef<number | null>(null);
  const lastStepTimeRef = useRef<number>(0);
  const expectedTimeRef = useRef<number>(0);
  const STEP_INTERVAL = 300;

  useEffect(() => {
    if (isPlaying) {
      lastStepTimeRef.current = performance.now();
      expectedTimeRef.current = performance.now() + STEP_INTERVAL;

      const playLoop = (now: number) => {
        updateElapsedTime();

        if (now >= expectedTimeRef.current) {
          const drift = now - expectedTimeRef.current;
          stepForward();

          expectedTimeRef.current = now + STEP_INTERVAL - Math.min(drift, STEP_INTERVAL);
        }

        const state = useSortStore.getState();
        if (state.isPlaying && state.currentStepIndex < state.steps.length - 1) {
          animationFrameRef.current = requestAnimationFrame(playLoop);
        } else if (state.isPlaying) {
          useSortStore.getState().stopPlaying();
        }
      };

      animationFrameRef.current = requestAnimationFrame(playLoop);

      return () => {
        if (animationFrameRef.current !== null) {
          cancelAnimationFrame(animationFrameRef.current);
          animationFrameRef.current = null;
        }
      };
    }
  }, [isPlaying, stepForward, updateElapsedTime]);

  useEffect(() => {
    const timer = setInterval(() => {
      updateElapsedTime();
    }, 16);

    return () => clearInterval(timer);
  }, [updateElapsedTime]);

  return (
    <div className="app">
      <Controls />
      <Visualizer />
      <InfoPanel />
    </div>
  );
};

export default App;
