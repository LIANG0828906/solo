import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from './state/StateManager';
import { PlayerController } from './game/PlayerController';
import { TerrainGenerator } from './game/TerrainGenerator';
import { CreatureManager } from './game/CreatureManager';
import { GameRenderer } from './render/GameRenderer';
import UIPanel from './ui/UIPanel';
import GameOverPanel from './ui/GameOverPanel';

const GAME_DURATION = 180;
const DIFFICULTY_INTERVAL = 30;
const TIDE_INTERVAL = 60;
const TIDE_DARKEN_DURATION = 2000;
const TIDE_EFFECT_DURATION = 5000;

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerControllerRef = useRef<PlayerController | null>(null);
  const terrainGeneratorRef = useRef<TerrainGenerator | null>(null);
  const creatureManagerRef = useRef<CreatureManager | null>(null);
  const gameRendererRef = useRef<GameRenderer | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const timerAccumulatorRef = useRef<number>(0);
  const difficultyTimerRef = useRef<number>(0);
  const tideTimerRef = useRef<number>(0);
  const [, forceUpdate] = useState(0);

  const initializeGame = React.useCallback(() => {
    const store = useGameStore.getState();

    if (!playerControllerRef.current) {
      playerControllerRef.current = new PlayerController();
      playerControllerRef.current.init();
    }

    if (!terrainGeneratorRef.current) {
      terrainGeneratorRef.current = new TerrainGenerator();
    }
    const terrain = terrainGeneratorRef.current.generate(1);
    store.setTerrain(terrain);

    if (!creatureManagerRef.current) {
      creatureManagerRef.current = new CreatureManager();
    }
    creatureManagerRef.current.init(100, 3);

    store.setPlayerPosition({ x: 400, y: 300 });
    store.setTimeRemaining(GAME_DURATION);
    store.setGamePhase('playing');

    timerAccumulatorRef.current = 0;
    difficultyTimerRef.current = 0;
    tideTimerRef.current = 0;
    lastTimeRef.current = 0;

    forceUpdate((n) => n + 1);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    gameRendererRef.current = new GameRenderer(canvas);
    initializeGame();

    const handleRestart = () => {
      initializeGame();
    };
    window.addEventListener('gameRestart', handleRestart);

    const handleTerrainChanged = () => {
      if (creatureManagerRef.current) {
        const store = useGameStore.getState();
        const difficultyLevel = store.game.difficultyLevel;
        const planktonCount = Math.floor(100 * Math.max(0.7, 1 - difficultyLevel * 0.1));
        const predatorCount = Math.min(5, 3 + difficultyLevel);
        creatureManagerRef.current.init(planktonCount, predatorCount);
      }
    };
    useGameStore.getState().on('terrainChanged', handleTerrainChanged);

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = Math.min((timestamp - lastTimeRef.current) / 1000, 0.1);
      lastTimeRef.current = timestamp;

      const store = useGameStore.getState();

      if (store.game.phase === 'playing') {
        playerControllerRef.current?.update(deltaTime, timestamp);
        terrainGeneratorRef.current?.update(deltaTime);
        creatureManagerRef.current?.update(deltaTime, timestamp);

        timerAccumulatorRef.current += deltaTime;
        if (timerAccumulatorRef.current >= 1) {
          timerAccumulatorRef.current -= 1;
          const newTime = Math.max(0, store.game.timeRemaining - 1);
          store.setTimeRemaining(newTime);

          if (newTime <= 0 || store.player.health <= 0) {
            store.setGamePhase('gameover');
          }
        }

        difficultyTimerRef.current += deltaTime;
        if (difficultyTimerRef.current >= DIFFICULTY_INTERVAL) {
          difficultyTimerRef.current -= DIFFICULTY_INTERVAL;
          store.setDifficultyLevel(store.game.difficultyLevel + 1);
        }

        tideTimerRef.current += deltaTime;
        if (tideTimerRef.current >= TIDE_INTERVAL && !store.game.tideActive) {
          tideTimerRef.current = 0;
          store.setDarkenScreen(0.7);
          setTimeout(() => {
            store.setDarkenScreen(0);
            store.setTideActive(true, timestamp + TIDE_EFFECT_DURATION);
          }, TIDE_DARKEN_DURATION);
        }

        if (store.game.tideActive && timestamp > store.game.tideEnd) {
          store.setTideActive(false, 0);
        }

        if (store.player.health <= 0) {
          store.setGamePhase('gameover');
        }
      }

      gameRendererRef.current?.render(deltaTime, timestamp);

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      window.removeEventListener('gameRestart', handleRestart);
      useGameStore.getState().off('terrainChanged', handleTerrainChanged);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      playerControllerRef.current?.destroy();
      gameRendererRef.current?.destroy();
    };
  }, [initializeGame]);

  const game = useGameStore((s) => s.game);

  return (
    <div style={containerStyle}>
      <div style={gameWrapperStyle}>
        <canvas
          ref={canvasRef}
          style={canvasStyle}
        />
        {game.phase === 'playing' && <UIPanel />}
      </div>
      {game.phase === 'gameover' && <GameOverPanel />}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes scoreFlash {
          0% { color: #00FF88; }
          50% { color: #FFFFFF; }
          100% { color: #00FF88; }
        }
      `}</style>
    </div>
  );
};

const containerStyle: React.CSSProperties = {
  minHeight: '100vh',
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  padding: '20px',
  fontFamily: '"Courier New", monospace',
};

const gameWrapperStyle: React.CSSProperties = {
  position: 'relative',
  width: '800px',
  height: '600px',
};

const canvasStyle: React.CSSProperties = {
  display: 'block',
  borderRadius: '8px',
  boxShadow: '0 0 40px rgba(0, 255, 136, 0.1), 0 8px 32px rgba(0, 0, 0, 0.6)',
  border: '2px solid rgba(0, 255, 136, 0.2)',
};

export default App;
