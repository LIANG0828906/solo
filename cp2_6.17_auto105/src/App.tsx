import { useEffect, useRef } from 'react';
import Scene3D from './components/Scene3D';
import ControlPanel from './components/ControlPanel';
import { ParticleEngine } from './engine/particleEngine';
import { useStore } from './store';
import type { ControlParams, ParticleState } from './engine/types';

const initialParams: ControlParams = {
  particleCount: 3000,
  noiseStrength: 0.2,
  particleLife: 3,
  trailFrameCount: 30,
};

const emitQueue: { count: number; position?: [number, number, number] }[] = [];
let engineInstance: ParticleEngine | null = null;

useStore.setState({
  emitParticles: (count: number, position?: [number, number, number]) => {
    emitQueue.push({ count, position });
  },
  reset: () => {
    if (engineInstance) {
      engineInstance.reset();
    }
  },
});

export default function App() {
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const prevParticleCountRef = useRef<number>(initialParams.particleCount);

  const updateParticles = useStore((state) => state.updateParticles);
  const isPaused = useStore((state) => state.isPaused);
  const setFps = useStore((state) => state.setFps);
  const resetEmittedCount = useStore((state) => state.resetEmittedCount);
  const incrementEmittedCount = useStore((state) => state.incrementEmittedCount);

  useEffect(() => {
    if (!engineInstance) {
      engineInstance = new ParticleEngine(initialParams);
      engineInstance.emit(initialParams.particleCount);
      incrementEmittedCount(initialParams.particleCount);
    }

    const animate = (time: number) => {
      if (!engineInstance) return;

      const deltaTime = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0;
      lastTimeRef.current = time;

      frameCountRef.current++;
      if (time - fpsTimeRef.current >= 1000) {
        const fps = (frameCountRef.current * 1000) / (time - fpsTimeRef.current);
        setFps(fps);
        frameCountRef.current = 0;
        fpsTimeRef.current = time;
        resetEmittedCount();
      }

      if (!isPaused) {
        const state = useStore.getState();
        engineInstance.setControlParams(state.controlParams);

        if (state.controlParams.particleCount !== prevParticleCountRef.current) {
          const diff = state.controlParams.particleCount - engineInstance.getActiveCount();
          if (diff > 0) {
            engineInstance.emit(diff);
            incrementEmittedCount(diff);
          }
          prevParticleCountRef.current = state.controlParams.particleCount;
        }

        let totalEmit = 0;
        while (emitQueue.length > 0) {
          const emit = emitQueue.shift()!;
          const emitCount = state.fps < 30 ? Math.floor(emit.count * 0.75) : emit.count;
          engineInstance.emit(emitCount, emit.position);
          totalEmit += emitCount;
        }
        if (totalEmit > 0) {
          incrementEmittedCount(totalEmit);
        }

        const particleStates: ParticleState[] = engineInstance.update(deltaTime, state.gestureForce);
        updateParticles(particleStates);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [updateParticles, isPaused, setFps, resetEmittedCount, incrementEmittedCount]);

  return (
    <div
      style={{
        display: 'flex',
        width: '100vw',
        height: '100vh',
        backgroundColor: '#0A0A15',
        overflow: 'hidden',
      }}
    >
      <div style={{ width: 'calc(100% - 320px)', height: '100%' }}>
        <Scene3D />
      </div>
      <ControlPanel />
    </div>
  );
}
