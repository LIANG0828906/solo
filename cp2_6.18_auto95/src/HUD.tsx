import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useGameStore } from './gameStore';
import { startLoop, endGame, resetGame, isGameRunning } from './gameLoop';
import { handlePlayerTurn } from './snakeLogic';
import { initRenderer, setScaleFactor, forceRender } from './renderer';
import type { Direction } from './types';
import { CANVAS_SIZE } from './types';

const HUD: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { snakes, foods, gameStage, winnerId, resetGame: resetStore } = useGameStore();
  const [viewportSize, setViewportSize] = useState({ width: window.innerWidth, height: window.innerHeight });

  const playerSnake = snakes.find(s => s.isPlayer);
  const sortedSnakes = [...snakes].sort((a, b) => b.score - a.score);
  const aliveSnakes = snakes.filter(s => s.alive);
  const deadSnakes = snakes.filter(s => !s.alive);
  const winner = winnerId ? snakes.find(s => s.id === winnerId) : null;

  const canvasSize = viewportSize.height < 900 ? 600 : 800;
  const scaleFactor = canvasSize / CANVAS_SIZE;

  useEffect(() => {
    setScaleFactor(scaleFactor);
  }, [scaleFactor]);

  useEffect(() => {
    const handleResize = () => {
      setViewportSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    initRenderer();
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      canvas.width = CANVAS_SIZE;
      canvas.height = CANVAS_SIZE;
      canvas.style.width = `${canvasSize}px`;
      canvas.style.height = `${canvasSize}px`;
      forceRender(canvas);
    }
  }, [canvasSize]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameStage !== 'playing') return;

      const keyMap: Record<string, Direction> = {
        ArrowUp: 'up',
        ArrowDown: 'down',
        ArrowLeft: 'left',
        ArrowRight: 'right',
        w: 'up',
        s: 'down',
        a: 'left',
        d: 'right',
        W: 'up',
        S: 'down',
        A: 'left',
        D: 'right',
      };

      const direction = keyMap[e.key];
      if (direction) {
        e.preventDefault();
        handlePlayerTurn(direction);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStage]);

  const handleStartGame = useCallback(() => {
    startLoop(canvasRef.current);
  }, []);

  const handleEndGame = useCallback(() => {
    endGame();
  }, []);

  const handleResetGame = useCallback(() => {
    resetStore();
    if (canvasRef.current) {
      forceRender(canvasRef.current);
    }
  }, [resetStore]);

  const getGameStageText = () => {
    switch (gameStage) {
      case 'waiting': return '等待中';
      case 'playing': return '进行中';
      case 'ended': return '已结束';
    }
  };

  const isMobile = viewportSize.width < 1100;

  return (
    <div className="w-full h-full flex flex-col items-center justify-start pt-4 overflow-auto" style={{ backgroundColor: '#0A0A0A' }}>
      <h1
        className="game-title text-center mb-4"
        style={{
          color: '#FFFFFF',
          fontSize: viewportSize.width < 1100 ? '24px' : '32px',
          textShadow: '0 2px 8px rgba(255,255,255,0.2)',
        }}
      >
        SlitherArena
      </h1>

      <div className={`flex ${isMobile ? 'flex-col items-center' : 'flex-row items-start justify-center'} gap-4 px-4 w-full max-w-[1400px]`}>
        <div
          className="flex flex-col gap-4"
          style={{ width: isMobile ? `${canvasSize}px` : '200px' }}
        >
          <div
            className="p-4 rounded-xl"
            style={{
              backgroundColor: '#111827',
              border: '1px solid #2A2A3F',
              borderRadius: '12px',
            }}
          >
            <h2 className="text-sm font-bold mb-3" style={{ color: '#FFFFFF', fontSize: '14px' }}>
              玩家榜
            </h2>
            <div className="flex flex-col gap-2">
              {sortedSnakes.map((snake, index) => (
                <div
                  key={snake.id}
                  className="player-row flex justify-between items-center"
                  style={{ fontSize: '14px' }}
                >
                  <span style={{ color: snake.alive ? '#00FF00' : '#FF4444' }}>
                    {index + 1}. {snake.name}
                  </span>
                  <span style={{ color: snake.alive ? '#FFFFFF' : '#888888' }}>
                    {snake.score}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {!isMobile && deadSnakes.length > 0 && (
            <div
              className="p-4 rounded-xl"
              style={{
                backgroundColor: '#111827',
                border: '1px solid #2A2A3F',
                borderRadius: '12px',
              }}
            >
              <h2 className="text-sm font-bold mb-3" style={{ color: '#FF4444', fontSize: '14px' }}>
                已淘汰
              </h2>
              <div className="flex flex-col gap-1">
                {deadSnakes.map((snake) => (
                  <div
                    key={snake.id}
                    className="player-row text-right"
                    style={{ color: '#FF4444', fontSize: '12px' }}
                  >
                    {snake.name}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative">
          <div
            className="absolute top-2 right-2 z-10 flex items-center gap-2"
          >
            <span
              className="px-3 py-1 rounded text-xs"
              style={{
                backgroundColor: '#111827',
                color: gameStage === 'playing' ? '#00FF00' : gameStage === 'ended' ? '#FF4444' : '#FFFFFF',
                fontSize: '12px',
              }}
            >
              {getGameStageText()}
            </span>
            {gameStage === 'waiting' && (
              <button
                onClick={handleStartGame}
                className="px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '44px',
                  minHeight: '44px',
                }}
              >
                开始游戏
              </button>
            )}
            {gameStage === 'playing' && (
              <button
                onClick={handleEndGame}
                className="px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: '#EF4444',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '44px',
                  minHeight: '44px',
                }}
              >
                结束游戏
              </button>
            )}
            {gameStage === 'ended' && (
              <button
                onClick={handleResetGame}
                className="px-4 py-2 rounded-lg transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: '#22C55E',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minWidth: '44px',
                  minHeight: '44px',
                }}
              >
                再来一局
              </button>
            )}
          </div>

          {gameStage === 'ended' && (
            <div
              className="absolute inset-0 flex flex-col items-center justify-center z-20"
              style={{ backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: '8px' }}
            >
              <div
                className="game-title text-center mb-4"
                style={{ color: '#FFFFFF', fontSize: '24px' }}
              >
                游戏结束
              </div>
              {winner && (
                <div
                  className="text-center"
                  style={{ color: winner.color, fontSize: '20px' }}
                >
                  🎉 {winner.name} 获胜！
                </div>
              )}
            </div>
          )}

          <canvas
            ref={canvasRef}
            style={{
              backgroundColor: '#1A1A2E',
              border: '1px solid #00FF00',
              borderRadius: '8px',
              boxShadow: '0 0 10px #00FF00',
              display: 'block',
            }}
          />

          <div
            className="text-center mt-4"
            style={{
              color: '#FFD700',
              fontSize: '24px',
              fontWeight: 'bold',
            }}
          >
            得分: {playerSnake?.score || 0}
          </div>
        </div>

        {!isMobile && (
          <div
            className="p-4 rounded-xl"
            style={{
              width: '200px',
              backgroundColor: '#111827',
              border: '1px solid #2A2A3F',
              borderRadius: '12px',
            }}
          >
            <h2 className="text-sm font-bold mb-3 text-right" style={{ color: '#FF4444', fontSize: '14px' }}>
              已淘汰
            </h2>
            <div className="flex flex-col gap-1">
              {deadSnakes.map((snake) => (
                <div
                  key={snake.id}
                  className="player-row text-right"
                  style={{ color: '#FF4444', fontSize: '12px' }}
                >
                  {snake.name} - {snake.score}分
                </div>
              ))}
              {deadSnakes.length === 0 && (
                <div className="text-right" style={{ color: '#666666', fontSize: '12px' }}>
                  暂无淘汰
                </div>
              )}
            </div>

            <div className="mt-4 pt-4" style={{ borderTop: '1px solid #2A2A3F' }}>
              <div className="text-right" style={{ color: '#888888', fontSize: '12px' }}>
                存活玩家: {aliveSnakes.length}/{snakes.length}
              </div>
            </div>
          </div>
        )}
      </div>

      {isMobile && (
        <div className="mt-4 px-4" style={{ width: `${canvasSize}px` }}>
          <div
            className="p-4 rounded-xl"
            style={{
              backgroundColor: '#111827',
              border: '1px solid #2A2A3F',
              borderRadius: '12px',
            }}
          >
            <div className="text-center" style={{ color: '#888888', fontSize: '12px' }}>
              存活玩家: {aliveSnakes.length}/{snakes.length}
            </div>
          </div>
        </div>
      )}

      <div className="mt-4 mb-4 text-center" style={{ color: '#666666', fontSize: '12px' }}>
        使用 ↑↓←→ 或 WASD 控制蛇的移动方向
      </div>
    </div>
  );
};

export default HUD;
