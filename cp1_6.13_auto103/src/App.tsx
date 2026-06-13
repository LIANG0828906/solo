import React, { useEffect, useRef, useState, useCallback } from 'react';
import { GameEngine } from './game/GameEngine';
import { MazeRenderer } from './renderer/MazeRenderer';
import { GamePanel } from './ui/GamePanel';
import type { GameState, Direction, GameAction } from './game/types';

const App: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const rendererRef = useRef<MazeRenderer | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const prevPositionsRef = useRef<Record<string, { x: number; y: number }>>({
    blue: { x: 1, y: 1 },
    red: { x: 1, y: 1 },
  });

  useEffect(() => {
    const engine = new GameEngine();
    engineRef.current = engine;

    setGameState(engine.getState());

    const unsubscribe = engine.subscribe((state) => {
      for (const id of ['blue', 'red'] as const) {
        const prev = prevPositionsRef.current[id];
        const curr = state.players[id].position;
        if (prev.x !== curr.x || prev.y !== curr.y) {
          rendererRef.current?.triggerMoveAnimation(id);
        }
        prevPositionsRef.current[id] = { ...curr };
      }

      setGameState({ ...state });
      rendererRef.current?.updateState(state);
    });

    return () => {
      unsubscribe();
      engine.destroy();
    };
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const renderer = new MazeRenderer(canvasRef.current);
    rendererRef.current = renderer;

    if (engineRef.current) {
      renderer.updateState(engineRef.current.getState());
    }
    renderer.start();

    return () => {
      renderer.destroy();
      rendererRef.current = null;
    };
  }, []);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const engine = engineRef.current;
    if (!engine || !gameState) return;
    if (gameState.phase !== 'playing') return;

    const currentPlayer = gameState.currentPlayer;
    let action: GameAction | null = null;

    if (currentPlayer === 'blue') {
      switch (e.key.toLowerCase()) {
        case 'w':
          action = { type: 'move', playerId: 'blue', direction: 'up' as Direction };
          break;
        case 's':
          action = { type: 'move', playerId: 'blue', direction: 'down' as Direction };
          break;
        case 'a':
          action = { type: 'move', playerId: 'blue', direction: 'left' as Direction };
          break;
        case 'd':
          action = { type: 'move', playerId: 'blue', direction: 'right' as Direction };
          break;
      }
    } else {
      switch (e.key) {
        case 'ArrowUp':
          action = { type: 'move', playerId: 'red', direction: 'up' as Direction };
          break;
        case 'ArrowDown':
          action = { type: 'move', playerId: 'red', direction: 'down' as Direction };
          break;
        case 'ArrowLeft':
          action = { type: 'move', playerId: 'red', direction: 'left' as Direction };
          break;
        case 'ArrowRight':
          action = { type: 'move', playerId: 'red', direction: 'right' as Direction };
          break;
      }
    }

    if (e.key.toLowerCase() === 't') {
      action = { type: 'trap', playerId: currentPlayer };
    }

    if (action) {
      e.preventDefault();
      engine.handleAction(action);
    }
  }, [gameState]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleStartGame = useCallback(() => {
    engineRef.current?.startGame();
  }, []);

  const handlePlaceTrap = useCallback(() => {
    if (!engineRef.current || !gameState) return;
    engineRef.current.handleAction({
      type: 'trap',
      playerId: gameState.currentPlayer,
    });
  }, [gameState]);

  const handleNextRound = useCallback(() => {
    prevPositionsRef.current = {
      blue: { x: 1, y: 1 },
      red: { x: 1, y: 1 },
    };
    engineRef.current?.nextRound();
  }, []);

  const handleRestart = useCallback(() => {
    prevPositionsRef.current = {
      blue: { x: 1, y: 1 },
      red: { x: 1, y: 1 },
    };
    engineRef.current?.restartMatch();
  }, []);

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    width: '100%',
    height: '100%',
    padding: '20px',
    gap: '20px',
    boxSizing: 'border-box',
    backgroundColor: '#1a1a2e',
    flexWrap: window.innerWidth < 768 ? 'wrap' : 'nowrap',
  };

  const mazeAreaStyle: React.CSSProperties = {
    flex: window.innerWidth < 768 ? '0 0 100%' : '0 0 70%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: window.innerWidth < 768 ? '50vh' : '0',
    overflow: 'auto',
  };

  const panelAreaStyle: React.CSSProperties = {
    flex: 1,
    minWidth: window.innerWidth < 768 ? '100%' : '320px',
    maxWidth: window.innerWidth < 768 ? '100%' : '400px',
    height: window.innerWidth < 768 ? 'auto' : '100%',
    minHeight: window.innerWidth < 768 ? '40vh' : '0',
  };

  if (!gameState) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%', color: '#fff' }}>
        加载中...
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={mazeAreaStyle}>
        <canvas ref={canvasRef} style={{ display: 'block', borderRadius: '8px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
      </div>
      <div style={panelAreaStyle}>
        <GamePanel
          gameState={gameState}
          onPlaceTrap={handlePlaceTrap}
          onStartGame={handleStartGame}
          onNextRound={handleNextRound}
          onRestart={handleRestart}
        />
      </div>
    </div>
  );
};

export default App;
