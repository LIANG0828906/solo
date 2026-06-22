import { useState, useEffect, useRef } from 'react';

export function FPSCounter() {
  const [fps, setFps] = useState(60);
  const framesRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const loop = () => {
      framesRef.current++;
      const now = performance.now();
      if (now - lastTimeRef.current >= 1000) {
        setFps(framesRef.current);
        framesRef.current = 0;
        lastTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, []);

  const color = fps >= 50 ? '#00FF00' : fps >= 30 ? '#FFEB3B' : '#FF5252';

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 20,
        zIndex: 100,
        fontFamily: 'monospace',
        fontSize: 12,
        color,
        background: 'rgba(0,0,0,0.5)',
        padding: '4px 10px',
        borderRadius: 4,
        textShadow: '0 0 6px rgba(0,255,0,0.5)',
        letterSpacing: 1,
        pointerEvents: 'none',
      }}
    >
      {'FPS: ' + fps}
    </div>
  );
}
