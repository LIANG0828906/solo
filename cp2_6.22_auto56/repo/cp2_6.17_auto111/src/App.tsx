import React, { useEffect, useRef } from 'react';
import { SimulationEngine } from './engine/SimulationEngine';
import { Scene } from './components/Scene';
import { ControlPanel } from './components/ControlPanel';
import {
  useGridConfig,
  useGreenDuration,
  useSimulationActions
} from './store/useSimulationStore';

const App: React.FC = () => {
  const engineRef = useRef<SimulationEngine | null>(null);
  const animationFrameRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const gridConfig = useGridConfig();
  const greenDuration = useGreenDuration();
  const { setVehicles, setStatistics } = useSimulationActions();

  useEffect(() => {
    const engine = new SimulationEngine(gridConfig, greenDuration);
    engineRef.current = engine;

    engine.setOnVehiclesUpdate((vehicles) => {
      setVehicles(vehicles);
    });

    engine.setOnStatsUpdate((stats) => {
      setStatistics(stats);
    });

    const animate = (currentTime: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = currentTime;
      const deltaTime = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      if (engineRef.current) {
        engineRef.current.update(deltaTime);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.setGreenDuration(greenDuration);
    }
  }, [greenDuration]);

  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.regenerateGrid(gridConfig);
      const stats = engineRef.current.calculateStatistics();
      setStatistics(stats);
    }
  }, [gridConfig, setStatistics]);

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Scene engineRef={engineRef} />
      <ControlPanel />
    </div>
  );
};

export default App;
