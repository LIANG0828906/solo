import React, { useState, useEffect, useRef } from 'react';
import { useLightStore } from '@/store/useLightStore';

const PerformanceMonitor: React.FC = () => {
  const [fps, setFps] = useState<number>(0);
  const particleCount = useLightStore((state) => state.particleCount);

  const frameCountRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const updateFps = () => {
      frameCountRef.current += 1;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const currentFps = Math.round(
          (frameCountRef.current * 1000) / delta
        );
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(updateFps);
    };

    animationFrameRef.current = requestAnimationFrame(updateFps);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <div
      className="fixed top-4 left-4 z-20 flex flex-col gap-2"
      style={{ fontFamily: 'monospace' }}
    >
      <div
        className="px-3 py-2 rounded-md text-white text-sm"
        style={{
          background: '#00000080',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '14px',
        }}
      >
        <span className="text-[var(--text-secondary)]">FPS: </span>
        <span
          className="font-mono font-bold"
          style={{
            color: fps >= 50 ? 'var(--accent-green)' : fps >= 30 ? '#ECC94B' : '#FC8181',
          }}
        >
          {fps}
        </span>
      </div>
      <div
        className="px-3 py-2 rounded-md text-white text-sm"
        style={{
          background: '#00000080',
          borderRadius: '4px',
          padding: '8px 12px',
          fontSize: '14px',
        }}
      >
        <span className="text-[var(--text-secondary)]">Particles: </span>
        <span className="font-mono font-bold text-[var(--accent-cyan)]">
          {particleCount.toLocaleString()}
        </span>
      </div>
    </div>
  );
};

export default PerformanceMonitor;
