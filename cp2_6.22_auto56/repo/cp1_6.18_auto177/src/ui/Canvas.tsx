import React, { useEffect, useRef } from 'react';
import { useBoardStore } from '../stores/boardStore';

export const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { initBoardEngine } = useBoardStore();

  useEffect(() => {
    if (!canvasRef.current) return;
    initBoardEngine(canvasRef.current);
  }, [initBoardEngine]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        left: 0,
        top: 0,
        width: '100vw',
        height: '100vh',
        display: 'block',
        cursor: 'crosshair',
        touchAction: 'none',
      }}
    />
  );
};
