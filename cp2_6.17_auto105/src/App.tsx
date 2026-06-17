import { useEffect, useRef, useCallback } from 'react';
import Scene3D from './components/Scene3D';
import ControlPanel from './components/ControlPanel';
import { ParticleEngine } from './engine/particleEngine';
import { useStore } from './store';
import type { ControlParams, ParticleState } from './engine/types';

export default function App() {
  const engineRef = useRef<ParticleEngine | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const fpsTimeRef = useRef<number>(0);
  const frameCountRef = useRef<number>(0);
  const pendingEmitRef = useRef<{ count: number; position?: [number, number, number] }[]>([]);

  const updateParticles = useStore((state) => state.updateParticles);
  const isPaused = useStore((state) => state.isPaused);
  const setFps = useStore((state) => state.setFps);
  const resetEmittedCount = useStore((state) => state.resetEmittedCount);
  const resetStore = useStore((state) => state.reset);

  const initialParams: ControlParams = {
    particleCount: 3000,
    noiseStrength: 0.2,
    particleLife: 3,
  };

  const handleEmitParticles = useCallback((count: number, position?: [number, number, number]) => {
    pendingEmitRef.current.push({ count, position });
  }, []);

  useEffect(() => {
    if (!engineRef.current) {
      engineRef.current = new ParticleEngine(initialParams);
      engineRef.current.emit(initialParams.particleCount);
    }

    const originalEmit = useStore.getState().emitParticles;
    useStore.setState({
      emitParticles: handleEmitParticles,
    });

    const originalReset = useStore.getState().reset;
    useStore.setState({
      reset: () => {
        if (engineRef.current) {
          engineRef.current.reset();
        }
        resetStore();
        originalReset();
      },
    });

    const animate = (time: number) => {
      if (!engineRef.current) return;

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
        engineRef.current.setControlParams(state.controlParams);

        for (const emit of pendingEmitRef.current) {
          const emitCount = state.fps < 30 ? Math.floor(emit.count * 0.75) : emit.count;
          engineRef.current.emit(emitCount, emit.position);
        }
        pendingEmitRef.current = [];

        const particleStates: ParticleState[] = engineRef.current.update(deltaTime, state.gestureForce);
        updateParticles(particleStates);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    let prevParams = useStore.getState().controlParams;
    const unsubscribeParams = useStore.subscribe(
      (state) => {
        if (state.controlParams !== prevParams && engineRef.current) {
          engineRef.current.setControlParams(state.controlParams);
          prevParams = state.controlParams;
        }
      }
    );

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      unsubscribeParams();
      useStore.setState({ emitParticles: originalEmit, reset: originalReset });
    };
  }, [updateParticles, isPaused, setFps, resetEmittedCount, resetStore, handleEmitParticles]);

  useEffect(() => {
    let prevCount = useStore.getState().controlParams.particleCount;
    
    const unsubscribe = useStore.subscribe(
      (state) => {
        const currentCount = state.controlParams.particleCount;
        if (currentCount !== prevCount && engineRef.current) {
          const diff = currentCount - engineRef.current.getActiveCount();
          if (diff > 0) {
            engineRef.current.emit(diff);
          }
          prevCount = currentCount;
        }
      }
    );

    return unsubscribe;
  }, []);

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
