import React, { createContext, useContext, useRef, useState, useEffect, useCallback } from 'react';
import type { Building, Resources, SandstormState, SaveData } from '../types';
import { INITIAL_RESOURCES } from '../utils/constants';
import { Builder } from '../game/builder';
import { SurvivalSimulator } from '../game/survival';

interface GameContextValue {
  buildings: Building[];
  resources: Resources;
  survivalDays: number;
  sandstorm: SandstormState;
  gameOver: boolean;
  builder: Builder | null;
  simulator: SurvivalSimulator | null;
  placeBuilding: (type: any, gridX: number, gridY: number) => { success: boolean; reason?: string };
  resetGame: () => void;
  loadSave: (data: SaveData) => void;
  showFlash: boolean;
}

const GameContext = createContext<GameContextValue | null>(null);

export const useGame = () => {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used within GameProvider');
  return ctx;
};

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const builderRef = useRef<Builder | null>(null);
  const simulatorRef = useRef<SurvivalSimulator | null>(null);
  const simLoopRef = useRef<number | null>(null);

  const [buildings, setBuildings] = useState<Building[]>([]);
  const [resources, setResources] = useState<Resources>({ ...INITIAL_RESOURCES });
  const [survivalDays, setSurvivalDays] = useState(0);
  const [sandstorm, setSandstorm] = useState<SandstormState>({ active: false, startTime: 0, duration: 0, multiplier: 1 });
  const [gameOver, setGameOver] = useState(false);
  const [showFlash, setShowFlash] = useState(false);
  const [, setTick_] = useState(0);

  if (!builderRef.current) {
    builderRef.current = new Builder();
  }

  if (!simulatorRef.current) {
    simulatorRef.current = new SurvivalSimulator({
      onSurvivalDay: (days) => setSurvivalDays(days),
      onSandstormChange: (s) => setSandstorm({ ...s }),
      onGameOver: () => setGameOver(true),
      onResourcesUpdate: () => {},
      onSandstormEnd: () => {
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 1000);
      },
    });
  }

  const runSimStep = useCallback(() => {
    if (!builderRef.current || !simulatorRef.current) return;
    const result = simulatorRef.current.step(builderRef.current.getBuildings(), resources);
    if (result) {
      setResources(result.resources);
      if (result.gameOver) {
        simulatorRef.current.stop();
      }
    }
    setTick_(t => (t + 1) % 1000000);
  }, [resources]);

  useEffect(() => {
    if (gameOver) return;
    const id = window.setInterval(runSimStep, 100);
    simLoopRef.current = id as unknown as number;
    return () => {
      if (simLoopRef.current) clearInterval(simLoopRef.current);
    };
  }, [runSimStep, gameOver]);

  const placeBuilding = useCallback(
    (type: any, gridX: number, gridY: number) => {
      if (!builderRef.current) return { success: false, reason: '系统未就绪' };
      const result = builderRef.current.placeBuilding(type, gridX, gridY, resources);
      if (result.success && result.cost) {
        setResources((prev) => ({
          ...prev,
          oxygen: Math.max(0, prev.oxygen - (result.cost as any).oxygen),
          energy: Math.max(0, prev.energy - (result.cost as any).energy),
          metal: Math.max(0, prev.metal - (result.cost as any).metal),
        }));
        setBuildings(builderRef.current.getBuildings());
        return { success: true };
      }
      return { success: false, reason: result.reason };
    },
    [resources]
  );

  const resetGame = useCallback(() => {
    if (builderRef.current) builderRef.current.reset();
    if (simulatorRef.current) {
      simulatorRef.current.reset();
      simulatorRef.current.setDays(0);
    }
    setBuildings([]);
    setResources({ ...INITIAL_RESOURCES });
    setSurvivalDays(0);
    setSandstorm({ active: false, startTime: 0, duration: 0, multiplier: 1 });
    setGameOver(false);
  }, []);

  const loadSave = useCallback((data: SaveData) => {
    if (builderRef.current) {
      builderRef.current.setBuildingsFromLoad(data.buildings);
      setBuildings(builderRef.current.getBuildings());
    }
    if (simulatorRef.current) {
      simulatorRef.current.reset();
      simulatorRef.current.setDays(data.survivalDays);
    }
    setResources(data.resources);
    setSurvivalDays(data.survivalDays);
    setGameOver(false);
    setSandstorm({ active: false, startTime: 0, duration: 0, multiplier: 1 });
  }, []);

  const value: GameContextValue = {
    buildings,
    resources,
    survivalDays,
    sandstorm,
    gameOver,
    builder: builderRef.current,
    simulator: simulatorRef.current,
    placeBuilding,
    resetGame,
    loadSave,
    showFlash,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};
