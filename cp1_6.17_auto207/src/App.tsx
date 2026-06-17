import { useEffect, useRef, useState } from 'react';
import { GameCore } from './game/GameCore';
import { HUD } from './ui/HUD';
import { MenuScreen } from './ui/MenuScreen';
import { useGameStore } from './store/gameStore';
import { LEVELS } from './data/levels';

function App() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameCoreRef = useRef<GameCore | null>(null);
  const [canvasSize, setCanvasSize] = useState({ width: 480, height: 640 });
  const { gameState, setGameState, setCurrentLevel, resetGame } = useGameStore();

  useEffect(() => {
    if (!canvasRef.current) return;
    const gameCore = new GameCore();
    gameCore.init(canvasRef.current);
    gameCoreRef.current = gameCore;
    setCanvasSize({ width: gameCore.getCanvasWidth(), height: gameCore.getCanvasHeight() });
    const handleResize = () => {
      gameCore.resize();
      setCanvasSize({ width: gameCore.getCanvasWidth(), height: gameCore.getCanvasHeight() });
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      gameCore.destroy();
    };
  }, []);

  const handleStartLevel = async (levelId: number) => {
    const level = LEVELS.find(l => l.id === levelId);
    if (!level || !gameCoreRef.current) return;
    resetGame();
    setCurrentLevel(level);
    setGameState('playing');
    await gameCoreRef.current.startLevel(level.beatTimestamps, level.bpm);
  };

  const handleCanvasTouch = (e: React.TouchEvent<HTMLCanvasElement> | React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || !gameCoreRef.current || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    let clientX: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
    } else {
      clientX = e.clientX;
    }
    const x = clientX - rect.left;
    const centerX = rect.width / 2;
    if (x < centerX) {
      gameCoreRef.current.handleInput('jump');
    } else {
      gameCoreRef.current.handleInput('slide');
    }
  };

  const handleBackToMenu = () => {
    if (gameCoreRef.current) {
      gameCoreRef.current.stop();
    }
    resetGame();
    setCurrentLevel(null);
    setGameState('menu');
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      background: '#0A0A16',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden'
    }}>
      {gameState === 'menu' || gameState === 'result' ? (
        <MenuScreen onStartLevel={handleStartLevel} />
      ) : (
        <div style={{
          position: 'relative',
          width: canvasSize.width,
          height: canvasSize.height,
          overflow: 'hidden',
          borderRadius: 0,
          boxShadow: '0 0 30px rgba(0, 212, 255, 0.3)'
        }}>
          <canvas
            ref={canvasRef}
            onTouchStart={handleCanvasTouch}
            onClick={handleCanvasTouch}
            style={{
              display: 'block',
              touchAction: 'none',
              imageRendering: 'pixelated' as const
            }}
          />
          <HUD canvasWidth={canvasSize.width} />
          {gameState === 'playing' && (
            <div style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '50%',
              height: '100%',
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                bottom: 80,
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.15)',
                fontSize: 12,
                fontFamily: 'Courier New, monospace'
              }}>
                点击跳跃 ↑
              </div>
            </div>
          )}
          {gameState === 'playing' && (
            <div style={{
              position: 'absolute',
              top: 0,
              right: 0,
              width: '50%',
              height: '100%',
              pointerEvents: 'none'
            }}>
              <div style={{
                position: 'absolute',
                bottom: 80,
                left: '50%',
                transform: 'translateX(-50%)',
                color: 'rgba(255,255,255,0.15)',
                fontSize: 12,
                fontFamily: 'Courier New, monospace'
              }}>
                点击滑铲 ↓
              </div>
            </div>
          )}
          <button
            onClick={handleBackToMenu}
            style={{
              position: 'absolute',
              top: 58,
              left: 10,
              background: 'rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 4,
              color: 'rgba(255,255,255,0.6)',
              padding: '4px 10px',
              fontSize: 10,
              fontFamily: 'Courier New, monospace',
              cursor: 'pointer',
              zIndex: 20
            }}
          >
            ← 菜单
          </button>
        </div>
      )}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 4,
        background: 'linear-gradient(90deg, transparent 0%, #00D4FF 50%, transparent 100%)',
        boxShadow: '0 0 15px #00D4FF',
        animation: 'neonFlow 2s linear infinite'
      }} />
      <style>{`
        @keyframes neonFlow {
          0% { opacity: 0.5; }
          50% { opacity: 1; }
          100% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default App;
