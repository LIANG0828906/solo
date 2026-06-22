import React, { useState, useEffect, useRef, useCallback } from 'react';
import { EcoEngine, DEFAULT_PARAMS } from './engine/EcoEngine';
import { GridWorld } from './components/GridWorld';
import { DataPanel } from './components/DataPanel';
import { SettingsModal } from './components/SettingsModal';
import { Snapshot, HistoryPoint, AllSpeciesParams, SpeciesType } from './types';

const MAX_HISTORY_POINTS = 1000;

const App: React.FC = () => {
  const engineRef = useRef<EcoEngine>(new EcoEngine());
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [history, setHistory] = useState<HistoryPoint[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [params, setParams] = useState<AllSpeciesParams>(DEFAULT_PARAMS);
  const [isMobile, setIsMobile] = useState(false);
  const tickIntervalRef = useRef<number | null>(null);
  const lastHistoryGenRef = useRef(-1);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 900);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const runTick = useCallback(() => {
    const engine = engineRef.current;
    engine.tick();
    const snap = engine.getSnapshot();
    setSnapshot(snap);

    if (snap.generation % 5 === 0 && snap.generation !== lastHistoryGenRef.current) {
      lastHistoryGenRef.current = snap.generation;
      setHistory(prev => {
        const newPoint: HistoryPoint = {
          generation: snap.generation,
          plant: snap.counts[SpeciesType.PLANT],
          herbivore: snap.counts[SpeciesType.HERBIVORE],
          carnivore: snap.counts[SpeciesType.CARNIVORE],
        };
        const next = [...prev, newPoint];
        if (next.length > MAX_HISTORY_POINTS) {
          return next.slice(next.length - MAX_HISTORY_POINTS);
        }
        return next;
      });
    }
  }, []);

  useEffect(() => {
    if (isPaused) {
      if (tickIntervalRef.current !== null) {
        window.clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
      return;
    }

    const baseInterval = 50;
    const actualInterval = baseInterval / speed;

    if (tickIntervalRef.current !== null) {
      window.clearInterval(tickIntervalRef.current);
    }

    tickIntervalRef.current = window.setInterval(runTick, actualInterval);

    return () => {
      if (tickIntervalRef.current !== null) {
        window.clearInterval(tickIntervalRef.current);
        tickIntervalRef.current = null;
      }
    };
  }, [isPaused, speed, runTick]);

  useEffect(() => {
    runTick();
  }, [runTick]);

  const handleTogglePause = () => setIsPaused(p => !p);

  const handleSpeedChange = (newSpeed: number) => setSpeed(newSpeed);

  const handlePerturbation = () => {
    engineRef.current.addPerturbation();
  };

  const handleSaveParams = (newParams: AllSpeciesParams) => {
    setParams(newParams);
    engineRef.current.setParams(newParams, true);
    setHistory([]);
    lastHistoryGenRef.current = -1;
    setSnapshot(engineRef.current.getSnapshot());
  };

  const containerStyle: React.CSSProperties = isMobile
    ? {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        backgroundColor: '#0D1B2A',
      }
    : {
        display: 'flex',
        flexDirection: 'row',
        width: '100%',
        height: '100%',
        backgroundColor: '#0D1B2A',
      };

  return (
    <div style={containerStyle}>
      <div
        style={{
          flex: 1,
          minWidth: 0,
          minHeight: 0,
          position: 'relative',
        }}
      >
        <GridWorld snapshot={snapshot} />
      </div>

      <div
        style={{
          padding: isMobile ? 12 : 20,
          display: 'flex',
          justifyContent: isMobile ? 'center' : 'flex-start',
          alignItems: isMobile ? 'flex-start' : 'stretch',
        }}
      >
        <DataPanel
          snapshot={snapshot}
          history={history}
          isPaused={isPaused}
          speed={speed}
          onTogglePause={handleTogglePause}
          onSpeedChange={handleSpeedChange}
          onPerturbation={handlePerturbation}
          onOpenSettings={() => setSettingsOpen(true)}
          params={params}
        />
      </div>

      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        params={params}
        onSave={handleSaveParams}
      />
    </div>
  );
};

export default App;
