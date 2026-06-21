import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EcoCanvas } from './components/EcoCanvas';
import { ControlPanel } from './components/ControlPanel';
import { MonitorPanel } from './components/MonitorPanel';
import { Ecosystem } from './ecosystem';
import {
  EcoState,
  CreatureType,
  TankConfig,
  HistoryPoint,
} from './types';

const CANVAS_WIDTH = 900;
const CANVAS_HEIGHT = 600;

const App: React.FC = () => {
  const [ecoState, setEcoState] = useState<EcoState | null>(null);
  const [selectedCreature, setSelectedCreature] = useState<CreatureType | null>(null);
  const [speed, setSpeed] = useState(1);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [interpolationProgress, setInterpolationProgress] = useState(0);

  const ecosystemRef = useRef<Ecosystem | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastHistoryUpdateRef = useRef<number>(0);

  useEffect(() => {
    const config: TankConfig = {
      width: CANVAS_WIDTH,
      height: CANVAS_HEIGHT,
      frameInterval: 500,
      speedMultiplier: 1,
      resourceUpdateInterval: 10,
    };

    ecosystemRef.current = new Ecosystem(config);

    const unsubscribe = ecosystemRef.current.subscribe((state) => {
      setEcoState(state);

      if (state.frameCount - lastHistoryUpdateRef.current >= 5) {
        lastHistoryUpdateRef.current = state.frameCount;
        setHistory((prev) => {
          const newPoint: HistoryPoint = {
            frame: state.frameCount,
            population: { ...state.population },
          };
          const newHistory = [...prev, newPoint];
          if (newHistory.length > 100) {
            return newHistory.slice(-100);
          }
          return newHistory;
        });
      }
    });

    (window as any).ecosystem = ecosystemRef.current;

    return () => {
      unsubscribe();
      ecosystemRef.current?.destroy();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      delete (window as any).ecosystem;
    };
  }, []);

  useEffect(() => {
    if (!ecoState?.isRunning) return;

    const startTime = performance.now();
    const effectiveInterval = 500 / speed;

    const updateInterpolation = (timestamp: number) => {
      const elapsed = timestamp - startTime;
      const progress = Math.min(1, (elapsed % effectiveInterval) / effectiveInterval);
      setInterpolationProgress(progress);
      animationFrameRef.current = requestAnimationFrame(updateInterpolation);
    };

    animationFrameRef.current = requestAnimationFrame(updateInterpolation);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [ecoState?.isRunning, speed]);

  const handleStart = useCallback(() => {
    ecosystemRef.current?.start();
  }, []);

  const handlePause = useCallback(() => {
    ecosystemRef.current?.pause();
    setInterpolationProgress(0);
  }, []);

  const handleReset = useCallback(() => {
    ecosystemRef.current?.reset();
    setHistory([]);
    lastHistoryUpdateRef.current = 0;
    setInterpolationProgress(0);
  }, []);

  const handleStep = useCallback(() => {
    ecosystemRef.current?.step(10);
    setInterpolationProgress(1);
    setTimeout(() => setInterpolationProgress(0), 100);
  }, []);

  const handleSpeedChange = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    ecosystemRef.current?.setSpeed(newSpeed);
  }, []);

  const handleCanvasClick = useCallback(
    (x: number, y: number) => {
      if (selectedCreature && ecosystemRef.current) {
        ecosystemRef.current.addCreature(selectedCreature, x, y);
      }
    },
    [selectedCreature]
  );

  if (!ecoState) {
    return (
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'radial-gradient(circle at 50% 50%, #0a2463 0%, #1e3f20 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#E2E8F0',
          fontFamily: 'monospace',
          fontSize: 18,
        }}
      >
        加载中...
      </div>
    );
  }

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        background: 'radial-gradient(circle at 50% 50%, #0a2463 0%, #1e3f20 100%)',
        overflow: 'hidden',
      }}
    >
      <ControlPanel
        isRunning={ecoState.isRunning}
        speed={speed}
        selectedCreature={selectedCreature}
        onStart={handleStart}
        onPause={handlePause}
        onReset={handleReset}
        onStep={handleStep}
        onSpeedChange={handleSpeedChange}
        onSelectCreature={setSelectedCreature}
      />

      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 20,
        }}
      >
        <EcoCanvas
          state={ecoState}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          selectedCreature={selectedCreature}
          onCanvasClick={handleCanvasClick}
          interpolationProgress={ecoState.isRunning ? interpolationProgress : 1}
        />
      </div>

      <MonitorPanel state={ecoState} history={history} />
    </div>
  );
};

export default App;
