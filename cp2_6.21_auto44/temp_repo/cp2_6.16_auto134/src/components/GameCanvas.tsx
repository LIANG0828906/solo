import React, { useRef, useEffect, useState, useCallback } from 'react';
import { GameEngine } from '../engine/GameEngine';
import { useGameStore } from '../store/useGameStore';
import { ShipBuild } from '../types';
import GameOver from './GameOver';

interface GameCanvasProps {
  build: ShipBuild;
}

const GameCanvas: React.FC<GameCanvasProps> = ({ build }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const [gameState, setGameState] = useState({
    score: 0,
    wave: 1,
    lives: 3,
    isGameOver: false,
    killsThisGame: 0,
    bossKilled: false,
  });
  
  const { setScene, setScore, setWave, setLives, unlockAchievement, addKills, addCredits, totalKills } = useGameStore();
  const [showGameOver, setShowGameOver] = useState(false);
  const [finalStats, setFinalStats] = useState({ score: 0, wave: 1, kills: 0 });

  const handleGameOver = useCallback((score: number, wave: number, kills: number) => {
    setShowGameOver(true);
    setFinalStats({ score, wave, kills });
    
    addKills(kills);
    addCredits(Math.floor(score / 10));
    
    if (wave >= 1) unlockAchievement('first_wave');
    if (wave >= 10) unlockAchievement('survivor');
    if (totalKills + kills >= 100) unlockAchievement('hundred_kills');
    if (gameState.bossKilled) unlockAchievement('boss_slayer');
  }, [addKills, addCredits, unlockAchievement, totalKills, gameState.bossKilled]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const resizeCanvas = () => {
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
      
      if (engineRef.current) {
        engineRef.current.resize(rect.width, rect.height);
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const engine = new GameEngine(canvas, build);
    engineRef.current = engine;

    engine.setOnStateChange(state => {
      setGameState(state);
      setScore(state.score);
      setWave(state.wave);
      setLives(state.lives);
    });

    engine.setOnGameOver(handleGameOver);

    engine.start();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      engine.destroy();
      engineRef.current = null;
    };
  }, [build, handleGameOver, setScore, setWave, setLives]);

  const handleRestart = () => {
    setShowGameOver(false);
    if (engineRef.current) {
      engineRef.current.restart();
    }
  };

  const handleTouchStart = (direction: 'left' | 'right' | 'fire') => {
    if (!engineRef.current) return;
    if (direction === 'left') {
      engineRef.current.setTouchInput({ left: true, right: false, fire: false });
    } else if (direction === 'right') {
      engineRef.current.setTouchInput({ left: false, right: true, fire: false });
    }
  };

  const handleTouchEnd = () => {
    if (!engineRef.current) return;
    engineRef.current.setTouchInput({ left: false, right: false, fire: false });
  };

  return (
    <div ref={containerRef} className="game-container">
      <canvas ref={canvasRef} className="game-canvas" />
      
      <div className="hud">
        <div className="hud-item">
          <span className="text-gray-400">生命:</span>
          <div className="lives-container">
            {[...Array(3)].map((_, i) => (
              <span
                key={i}
                className={`heart text-lg ${i < gameState.lives ? '' : 'empty'}`}
              >
                ❤
              </span>
            ))}
          </div>
        </div>
        
        <div className="hud-item">
          <span className="text-yellow-400 font-bold text-lg">{gameState.score}</span>
        </div>
        
        <div className="hud-item">
          <span className="text-gray-400">波数:</span>
          <span className="text-blue-400 font-bold">{gameState.wave}</span>
        </div>
      </div>

      <div className="touch-controls">
        <div className="touch-direction">
          <button
            className="touch-btn"
            onTouchStart={() => handleTouchStart('left')}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart('left')}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            ◀
          </button>
          <button
            className="touch-btn"
            onTouchStart={() => handleTouchStart('right')}
            onTouchEnd={handleTouchEnd}
            onMouseDown={() => handleTouchStart('right')}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
          >
            ▶
          </button>
        </div>
        <button
          className="touch-btn touch-fire"
          onTouchStart={() => handleTouchStart('fire')}
          onTouchEnd={handleTouchEnd}
        >
          🔥
        </button>
      </div>

      <button
        className="absolute top-4 right-4 z-20 px-4 py-2 bg-black/50 rounded-lg text-white text-sm hover:bg-black/70 transition-all"
        onClick={() => setScene('menu')}
      >
        暂停
      </button>

      {showGameOver && (
        <GameOver
          score={finalStats.score}
          wave={finalStats.wave}
          kills={finalStats.kills}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
};

export default GameCanvas;
