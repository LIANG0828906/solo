import React, { useState, useEffect, useRef, useCallback } from 'react';
import SkylineCanvas from './components/SkylineCanvas';
import ControlPanel from './components/ControlPanel';
import type { Building, MaterialType } from './utils/buildingData';
import {
  createBuilding,
  addBuilding,
  removeBuilding,
  updateBuilding,
} from './utils/buildingData';

const PLAYBACK_SPEED = 5;
const MS_PER_MINUTE = 1000 / 60;

const App: React.FC = () => {
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [timeMinutes, setTimeMinutes] = useState<number>(600);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState<boolean>(window.innerWidth < 1000);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 650 });

  const lastTimeRef = useRef<number>(performance.now());
  const accumulatorRef = useRef<number>(0);

  useEffect(() => {
    const handleResize = () => {
      const narrow = window.innerWidth < 1000;
      setIsNarrow(narrow);
      if (narrow) {
        const w = Math.min(window.innerWidth - 32, 900);
        const h = Math.min(window.innerHeight - 280, 650);
        setCanvasSize({ width: Math.max(600, w), height: Math.max(400, h) });
      } else {
        const availW = window.innerWidth - 280 - 48;
        const availH = window.innerHeight - 48;
        setCanvasSize({
          width: Math.min(900, Math.max(600, availW)),
          height: Math.min(650, Math.max(400, availH)),
        });
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      accumulatorRef.current = 0;
      return;
    }

    let rafId: number;
    lastTimeRef.current = performance.now();

    const tick = (now: number) => {
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;
      accumulatorRef.current += delta * PLAYBACK_SPEED;

      while (accumulatorRef.current >= MS_PER_MINUTE) {
        accumulatorRef.current -= MS_PER_MINUTE;
        setTimeMinutes((prev) => {
          const next = prev + 1;
          if (next > 1080) return 480;
          return next;
        });
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying]);

  const handleCanvasClick = useCallback((worldX: number, worldZ: number) => {
    const newBuilding = createBuilding(worldX, worldZ);
    setBuildings((prev) => addBuilding(prev, newBuilding));
    setSelectedBuildingId(newBuilding.id);
  }, []);

  const handleSelectBuilding = useCallback((id: string | null) => {
    setSelectedBuildingId(id);
  }, []);

  const handleTimeChange = useCallback((minutes: number) => {
    setTimeMinutes(minutes);
  }, []);

  const handleTogglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const handleDeleteBuilding = useCallback((id: string) => {
    setBuildings((prev) => removeBuilding(prev, id));
    setSelectedBuildingId((cur) => (cur === id ? null : cur));
  }, []);

  const handleUpdateBuilding = useCallback(
    (id: string, height?: number, material?: MaterialType) => {
      setBuildings((prev) => updateBuilding(prev, id, { height, material }));
    },
    [],
  );

  const layoutStyle: React.CSSProperties = isNarrow
    ? {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        padding: '16px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        backgroundColor: '#1E1E2E',
      }
    : {
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: '16px',
        padding: '24px',
        minHeight: '100vh',
        boxSizing: 'border-box',
        backgroundColor: '#1E1E2E',
      };

  const panelWrapperStyle: React.CSSProperties = isNarrow
    ? { width: '100%', maxWidth: canvasSize.width }
    : {};

  return (
    <div style={layoutStyle}>
      <div style={{ position: 'relative' }}>
        <SkylineCanvas
          buildings={buildings}
          timeMinutes={timeMinutes}
          selectedBuildingId={selectedBuildingId}
          onCanvasClick={handleCanvasClick}
          onSelectBuilding={handleSelectBuilding}
          canvasWidth={canvasSize.width}
          canvasHeight={canvasSize.height}
        />
      </div>
      <div style={panelWrapperStyle}>
        <ControlPanel
          buildings={buildings}
          timeMinutes={timeMinutes}
          isPlaying={isPlaying}
          selectedBuildingId={selectedBuildingId}
          onTimeChange={handleTimeChange}
          onTogglePlay={handleTogglePlay}
          onDeleteBuilding={handleDeleteBuilding}
          onUpdateBuilding={handleUpdateBuilding}
          onSelectBuilding={handleSelectBuilding}
        />
      </div>
    </div>
  );
};

export default App;
