import { useEffect, useRef } from 'react';
import { gameEngine } from '../engine/GameEngine';
import { useGameStore } from '../store/gameStore';

export function GameUI() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { isGameOver, isWin } = useGameStore();

  useEffect(() => {
    if (!canvasRef.current) return;

    gameEngine.init(canvasRef.current);
    gameEngine.start();

    return () => {
      gameEngine.destroy();
    };
  }, []);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    gameEngine.handleClick(x, y);
  };

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '16px',
    }}>
      <h1 style={{
        color: '#f1f5f9',
        fontFamily: "'Courier New', monospace",
        fontSize: '24px',
        letterSpacing: '2px',
        textShadow: '2px 2px 0 #0f172a',
        marginTop: '16px',
      }}>
        ⛏ 像素矿工探险 ⛏
      </h1>
      
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        style={{
          imageRendering: 'pixelated',
          imageRendering: 'crisp-edges',
          cursor: 'pointer',
          borderRadius: '8px',
          boxShadow: '0 0 30px rgba(6, 182, 212, 0.2)',
        }}
      />
      
      <div style={{
        color: '#64748b',
        fontFamily: "'Courier New', monospace",
        fontSize: '12px',
        textAlign: 'center',
        marginBottom: '16px',
      }}>
        <p>WASD / 方向键 移动和挖掘</p>
        <p>点击底部装备栏升级装备</p>
        <p>目标：挖到右下角出口 🚪</p>
      </div>
    </div>
  );
}
