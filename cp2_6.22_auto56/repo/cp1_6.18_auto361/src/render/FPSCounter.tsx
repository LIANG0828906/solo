import React, { useState, useEffect, useRef } from 'react';
import { useMineralStore } from '../store/mineralStore';

interface FPSCounterProps {}

const FPSCounter: React.FC<FPSCounterProps> = () => {
  const [fps, setFps] = useState(0);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const rafId = useRef<number | null>(null);
  const setStoreFps = useMineralStore((state) => state.setFps);

  useEffect(() => {
    const loop = () => {
      frameCount.current++;
      const now = performance.now();
      const elapsed = now - lastTime.current;

      if (elapsed >= 1000) {
        const calculatedFps = Math.round((frameCount.current * 1000) / elapsed);
        setFps(calculatedFps);
        setStoreFps(calculatedFps);
        frameCount.current = 0;
        lastTime.current = now;
      }

      rafId.current = requestAnimationFrame(loop);
    };

    rafId.current = requestAnimationFrame(loop);

    return () => {
      if (rafId.current !== null) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [setStoreFps]);

  const getFpsColor = () => {
    if (fps >= 45) return 'rgba(76, 175, 80, 0.9)';
    if (fps >= 30) return 'rgba(255, 193, 7, 0.9)';
    return 'rgba(244, 67, 54, 0.9)';
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        fontSize: '12px',
        color: 'rgba(255, 255, 255, 0.85)',
        fontFamily: 'Monaco, Consolas, monospace',
        padding: '6px 10px',
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
        borderRadius: '4px',
        backdropFilter: 'blur(4px)',
        zIndex: 50,
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div
        style={{
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          backgroundColor: getFpsColor(),
          boxShadow: `0 0 6px ${getFpsColor()}`,
        }}
      />
      <span>FPS:</span>
      <span
        style={{
          fontWeight: '600',
          color: getFpsColor(),
          minWidth: '32px',
          textAlign: 'right',
        }}
      >
        {fps}
      </span>
    </div>
  );
};

export default FPSCounter;
