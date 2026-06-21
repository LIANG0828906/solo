import React, { createContext, useContext, useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { TerrainState, TerrainContextType, ErosionParams, LandformType, GRID_SIZE } from './types';
import { ErosionEngine } from './engine/ErosionEngine';
import TerrainRenderer from './components/TerrainRenderer';
import ControlPanel from './components/ControlPanel';

const TerrainContext = createContext<TerrainContextType | undefined>(undefined);

export const useTerrainContext = () => {
  const context = useContext(TerrainContext);
  if (!context) throw new Error('useTerrainContext must be used within TerrainProvider');
  return context;
};

const App: React.FC = () => {
  const engineRef = useRef<ErosionEngine>(new ErosionEngine(GRID_SIZE));
  const initialHeightMapRef = useRef<number[][]>([]);
  const animationRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(0);

  const [terrainState, setTerrainState] = useState<TerrainState>(() => {
    const engine = engineRef.current;
    const initialMap = engine.generateHeightMap('mountain');
    initialHeightMapRef.current = initialMap.map((row) => [...row]);
    const totalHeight = engine.calculateTotalHeight(initialMap);
    return {
      heightMap: initialMap,
      landform: 'mountain',
      iteration: 0,
      initialTotalHeight: totalHeight,
      currentTotalHeight: totalHeight,
    };
  });

  const [erosionParams, setErosionParams] = useState<ErosionParams>({
    windStrength: 30,
    waterStrength: 40,
    glacierStrength: 20,
  });

  const [isPlaying, setIsPlaying] = useState(false);

  const setLandform = useCallback((landform: LandformType) => {
    const engine = engineRef.current;
    const newMap = engine.generateHeightMap(landform);
    initialHeightMapRef.current = newMap.map((row) => [...row]);
    const totalHeight = engine.calculateTotalHeight(newMap);
    setTerrainState({
      heightMap: newMap.map((r) => [...r]),
      landform,
      iteration: 0,
      initialTotalHeight: totalHeight,
      currentTotalHeight: totalHeight,
    });
    setIsPlaying(false);
  }, []);

  const resetTerrain = useCallback(() => {
    const resetMap = initialHeightMapRef.current.map((row) => [...row]);
    const totalHeight = engineRef.current.calculateTotalHeight(resetMap);
    setTerrainState((prev) => ({
      ...prev,
      heightMap: resetMap,
      iteration: 0,
      currentTotalHeight: totalHeight,
    }));
    setIsPlaying(false);
  }, []);

  const togglePlay = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  useEffect(() => {
    if (!isPlaying) {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      return;
    }

    const FPS = 2;
    const INTERVAL = 1000 / FPS;

    const animate = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current >= INTERVAL) {
        lastUpdateRef.current = timestamp;
        setTerrainState((prev) => {
          const engine = engineRef.current;
          const newMap = engine.erode(
            prev.heightMap,
            erosionParams.windStrength,
            erosionParams.waterStrength,
            erosionParams.glacierStrength
          );
          const newTotal = engine.calculateTotalHeight(newMap);
          return {
            ...prev,
            heightMap: newMap,
            iteration: prev.iteration + 1,
            currentTotalHeight: newTotal,
          };
        });
      }
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, [isPlaying, erosionParams]);

  const contextValue = useMemo<TerrainContextType>(
    () => ({
      terrainState,
      erosionParams,
      isPlaying,
      setErosionParams,
      setLandform,
      togglePlay,
      resetTerrain,
    }),
    [terrainState, erosionParams, isPlaying, setLandform, togglePlay, resetTerrain]
  );

  const heightChangePercent = terrainState.initialTotalHeight > 0
    ? ((terrainState.currentTotalHeight - terrainState.initialTotalHeight) / terrainState.initialTotalHeight) * 100
    : 0;

  return (
    <TerrainContext.Provider value={contextValue}>
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          background: '#1a1a2e',
          position: 'relative',
        }}
      >
        <ControlPanel
          iteration={terrainState.iteration}
          heightChangePercent={heightChangePercent}
        />
        <div
          style={{
            flex: 1,
            width: '85%',
            height: '100%',
            position: 'relative',
          }}
        >
          <TerrainRenderer heightMap={terrainState.heightMap} landform={terrainState.landform} />
        </div>
      </div>
    </TerrainContext.Provider>
  );
};

export default App;
