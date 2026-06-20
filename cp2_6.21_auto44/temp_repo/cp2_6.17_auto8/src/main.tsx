import React, { useEffect, useRef, useState, useCallback } from 'react';
import ReactDOM from 'react-dom/client';
import { GameEngine } from './game/gameEngine';

const Game: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameEngineRef = useRef<GameEngine | null>(null);
  const [showGameOver, setShowGameOver] = useState(false);
  const [restartButtonHover, setRestartButtonHover] = useState(false);

  const handleRestart = useCallback(() => {
    if (gameEngineRef.current) {
      gameEngineRef.current.restart();
      setShowGameOver(false);
    }
  }, []);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GameEngine(canvasRef.current);
    gameEngineRef.current = engine;

    engine.setOnGameOverCallback(() => {
      setShowGameOver(true);
    });

    engine.setOnRestartCallback(() => {
      setShowGameOver(false);
    });

    engine.start();

    const handleResize = () => {
      engine.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      engine.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (showGameOver && gameEngineRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 120;
      
      const buttonWidth = 200;
      const buttonHeight = 50;
      
      if (
        x >= centerX - buttonWidth / 2 &&
        x <= centerX + buttonWidth / 2 &&
        y >= centerY - buttonHeight / 2 &&
        y <= centerY + buttonHeight / 2
      ) {
        handleRestart();
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (showGameOver && gameEngineRef.current) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2 + 120;
      
      const buttonWidth = 200;
      const buttonHeight = 50;
      
      const isHovering = 
        x >= centerX - buttonWidth / 2 &&
        x <= centerX + buttonWidth / 2 &&
        y >= centerY - buttonHeight / 2 &&
        y <= centerY + buttonHeight / 2;
      
      setRestartButtonHover(isHovering);
    }
  };

  return (
    <div className="game-container">
      <h1 className="title">GEMJAM</h1>
      <canvas
        ref={canvasRef}
        className="game-canvas"
        onClick={handleCanvasClick}
        onMouseMove={handleMouseMove}
      />
      
      {showGameOver && gameEngineRef.current && (
        <div
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, calc(-50% + 120px))',
            zIndex: 100,
            pointerEvents: 'none'
          }}
        >
          <button
            onClick={handleRestart}
            onMouseEnter={() => setRestartButtonHover(true)}
            onMouseLeave={() => setRestartButtonHover(false)}
            style={{
              padding: '12px 40px',
              fontSize: '18px',
              fontWeight: 'bold',
              fontFamily: 'Cinzel, serif',
              color: '#FFF8DC',
              backgroundColor: restartButtonHover ? '#FF8C00' : '#8B4513',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              boxShadow: restartButtonHover 
                ? '0 4px 15px rgba(255, 140, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.2)'
                : '0 2px 8px rgba(0, 0, 0, 0.5), inset 0 2px 4px rgba(255, 255, 255, 0.1)',
              transition: 'all 0.2s ease',
              letterSpacing: '2px',
              pointerEvents: 'auto'
            }}
          >
            点击重新开始
          </button>
        </div>
      )}
      
      <div className="mobile-hint">
        <span>💎 拖拽晶体到网格中 | 🔗 连接4个以上同色晶体消除 | ⛏️ 连续消除激活矿脉</span>
      </div>
    </div>
  );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);
root.render(
  <React.StrictMode>
    <Game />
  </React.StrictMode>
);
