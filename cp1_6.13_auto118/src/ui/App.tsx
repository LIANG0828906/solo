import React, { useEffect, useRef, useState, useCallback } from 'react';
import { SceneManager } from '@/rendering/SceneManager';
import { ControlPanel } from './ControlPanel';
import {
  generateGalaxies,
  type GalaxyParams,
  type SimulationParams,
  type StarData,
} from '@/core/GalaxyGenerator';

type SimStatus = 'idle' | 'running' | 'paused' | 'finished';

type WorkerMsg =
  | { type: 'frame'; positions: Float32Array; velocities: Float32Array; elapsed: number }
  | { type: 'finished' };

const defaultGalaxyA: GalaxyParams = {
  starCount: 250,
  morphology: 'spiral',
  rotation: 'ccw',
};
const defaultGalaxyB: GalaxyParams = {
  starCount: 250,
  morphology: 'elliptical',
  rotation: 'cw',
};
const defaultSimParams: SimulationParams = {
  collisionAngle: 45,
  relativeSpeed: 100,
};

export const App: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneManager | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const starsRef = useRef<StarData[]>([]);

  const [galaxyA, setGalaxyA] = useState<GalaxyParams>(defaultGalaxyA);
  const [galaxyB, setGalaxyB] = useState<GalaxyParams>(defaultGalaxyB);
  const [simParams, setSimParams] = useState<SimulationParams>(defaultSimParams);
  const [simStatus, setSimStatus] = useState<SimStatus>('idle');
  const [trailMode, setTrailMode] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const regenerate = useCallback((a: GalaxyParams, b: GalaxyParams, s: SimulationParams) => {
    const stars = generateGalaxies(a, b, s);
    starsRef.current = stars;
    if (sceneRef.current) sceneRef.current.buildStars(stars);
    if (workerRef.current) {
      workerRef.current.postMessage({ type: 'init', stars, params: s });
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;
    const scene = new SceneManager(canvasRef.current);
    sceneRef.current = scene;

    const worker = new Worker(
      new URL('@/core/CollisionSimulator.ts', import.meta.url),
      { type: 'module' }
    );
    workerRef.current = worker;

    worker.onmessage = (e: MessageEvent<WorkerMsg>) => {
      const msg = e.data;
      if (msg.type === 'frame') {
        if (sceneRef.current) {
          sceneRef.current.updatePositions(msg.positions, msg.velocities);
        }
        setElapsed(msg.elapsed);
      } else if (msg.type === 'finished') {
        setSimStatus('finished');
      }
    };

    regenerate(defaultGalaxyA, defaultGalaxyB, defaultSimParams);

    return () => {
      worker.postMessage({ type: 'pause' });
      worker.terminate();
      workerRef.current = null;
      scene.dispose();
      sceneRef.current = null;
    };
  }, [regenerate]);

  const handleGalaxyAChange = (p: Partial<GalaxyParams>) => {
    const next = { ...galaxyA, ...p };
    setGalaxyA(next);
    if (simStatus !== 'running') regenerate(next, galaxyB, simParams);
  };
  const handleGalaxyBChange = (p: Partial<GalaxyParams>) => {
    const next = { ...galaxyB, ...p };
    setGalaxyB(next);
    if (simStatus !== 'running') regenerate(galaxyA, next, simParams);
  };
  const handleSimParamsChange = (p: Partial<SimulationParams>) => {
    const next = { ...simParams, ...p };
    setSimParams(next);
    if (simStatus !== 'running') regenerate(galaxyA, galaxyB, next);
  };

  const handleStart = () => {
    if (simStatus === 'idle' || simStatus === 'finished') {
      regenerate(galaxyA, galaxyB, simParams);
      setElapsed(0);
    }
    workerRef.current?.postMessage({ type: 'start' });
    setSimStatus('running');
  };
  const handlePause = () => {
    workerRef.current?.postMessage({ type: 'pause' });
    setSimStatus('paused');
  };
  const handleReset = () => {
    workerRef.current?.postMessage({ type: 'pause' });
    regenerate(galaxyA, galaxyB, simParams);
    setElapsed(0);
    setSimStatus('idle');
  };
  const handleResetCamera = () => sceneRef.current?.resetCamera();
  const handleToggleTrail = () => {
    const next = !trailMode;
    setTrailMode(next);
    sceneRef.current?.setTrailMode(next);
  };

  return (
    <div className="app-container">
      <div ref={canvasRef} className="canvas-container" />
      <ControlPanel
        galaxyA={galaxyA}
        galaxyB={galaxyB}
        simParams={simParams}
        simStatus={simStatus}
        trailMode={trailMode}
        elapsed={elapsed}
        onGalaxyAChange={handleGalaxyAChange}
        onGalaxyBChange={handleGalaxyBChange}
        onSimParamsChange={handleSimParamsChange}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onResetCamera={handleResetCamera}
        onToggleTrail={handleToggleTrail}
      />
    </div>
  );
};
