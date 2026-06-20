import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameCanvas } from './components/GameCanvas';
import { UIPanel } from './components/UIPanel';
import { GameEngine } from './game/GameEngine';
import { GameState, BeeType, Position, Hive, Flower, Enemy } from './types';
import './styles/global.css';

const INITIAL_HIVE: Hive = {
  position: { x: 200, y: 300 },
  level: 1,
  maxLevel: 5,
  honey: 50,
  maxHoney: 500,
  shield: 500,
  maxShield: 500,
  beeSlots: 5,
  usedBeeSlots: 0,
  defenseTowers: 0,
  upgradeCosts: [100, 250, 500, 1000, 2000],
  glowRadius: 60,
  glowPhase: 0,
  upgradeAnimation: 0,
};

function App() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [selectedBeeType, setSelectedBeeType] = useState<BeeType | null>(null);
  const [tooltipFlower, setTooltipFlower] = useState<Flower | null>(null);
  const [tooltipEnemy, setTooltipEnemy] = useState<Enemy | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState<Position>({ x: 0, y: 0 });
  const [tooltipVisible, setTooltipVisible] = useState(false);
  
  const gameEngineRef = useRef<GameEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const engine = new GameEngine(INITIAL_HIVE);
    engine.setOnStateChange((state) => {
      setGameState(state);
    });
    gameEngineRef.current = engine;
    engine.start();

    return () => {
      engine.stop();
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!gameEngineRef.current) return;
      
      const engine = gameEngineRef.current;
      const phase = engine.getPhase();

      if (e.code === 'Space') {
        e.preventDefault();
        if (phase === 'playing') {
          engine.pauseGame();
        } else if (phase === 'paused') {
          engine.resumeGame();
        }
        return;
      }

      if (phase !== 'playing') return;

      switch (e.key.toUpperCase()) {
        case 'Q':
          setSelectedBeeType((prev) => (prev === 'collector' ? null : 'collector'));
          break;
        case 'W':
          setSelectedBeeType((prev) => (prev === 'scout' ? null : 'scout'));
          break;
        case 'E':
          setSelectedBeeType((prev) => (prev === 'guardian' ? null : 'guardian'));
          break;
        case 'ESCAPE':
          setSelectedBeeType(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCanvasClick = useCallback((position: Position) => {
    if (!gameEngineRef.current || !selectedBeeType) return;
    
    const engine = gameEngineRef.current;
    if (engine.getPhase() !== 'playing') return;

    engine.dispatchBee(selectedBeeType, position);
  }, [selectedBeeType]);

  const handleMouseMove = useCallback((position: Position) => {
    if (!gameState || !containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    
    setTooltipPosition({
      x: position.x * (containerRect.width / gameState.mapSize.width),
      y: position.y * (containerRect.height / gameState.mapSize.height),
    });

    let foundFlower: Flower | null = null;
    for (const flower of gameState.flowers) {
      const dist = Math.hypot(flower.position.x - position.x, flower.position.y - position.y);
      if (dist < 25) {
        const gridKey = `${Math.floor(flower.position.x / 40)},${Math.floor(flower.position.y / 40)}`;
        if (flower.discovered || gameState.discoveredAreas.has(gridKey)) {
          foundFlower = flower;
          break;
        }
      }
    }

    let foundEnemy: Enemy | null = null;
    for (const enemy of gameState.enemies) {
      const dist = Math.hypot(enemy.position.x - position.x, enemy.position.y - position.y);
      if (dist < 25) {
        foundEnemy = enemy;
        break;
      }
    }

    setTooltipFlower(foundFlower);
    setTooltipEnemy(foundEnemy);
    setTooltipVisible(!!foundFlower || !!foundEnemy);
  }, [gameState]);

  const handleMouseWheel = useCallback((delta: number, position: Position) => {
  }, []);

  const handleStartGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.startGame();
    }
  }, []);

  const handleResetGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resetGame();
      setSelectedBeeType(null);
    }
  }, []);

  const handlePauseGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.pauseGame();
    }
  }, []);

  const handleResumeGame = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.resumeGame();
    }
  }, []);

  const handleSelectBeeType = useCallback((type: BeeType | null) => {
    setSelectedBeeType(type);
  }, []);

  const handleUpgradeHive = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.upgradeHive();
    }
  }, []);

  if (!gameState) {
    return <div className="loading">加载中...</div>;
  }

  return (
    <div className="app-container" ref={containerRef}>
      <div className="game-wrapper">
        <GameCanvas
          gameState={gameState}
          onCanvasClick={handleCanvasClick}
          onMouseMove={handleMouseMove}
          onMouseWheel={handleMouseWheel}
          selectedBeeType={selectedBeeType}
        />
        <UIPanel
          gameState={gameState}
          selectedBeeType={selectedBeeType}
          onSelectBeeType={handleSelectBeeType}
          onUpgradeHive={handleUpgradeHive}
          onStartGame={handleStartGame}
          onResetGame={handleResetGame}
          onPauseGame={handlePauseGame}
          onResumeGame={handleResumeGame}
          tooltipFlower={tooltipFlower}
          tooltipEnemy={tooltipEnemy}
          tooltipPosition={tooltipPosition}
          tooltipVisible={tooltipVisible}
        />
      </div>
    </div>
  );
}

export default App;
