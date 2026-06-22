import React, { useEffect, useRef, useState } from 'react';

const FPSDisplay: React.FC = () => {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const update = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;
      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }
      rafRef.current = requestAnimationFrame(update);
    };
    rafRef.current = requestAnimationFrame(update);
    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        right: 16,
        bottom: 16,
        color: '#00FF00',
        fontSize: 14,
        fontFamily: 'Consolas, "Courier New", monospace',
        fontWeight: 600,
        textShadow: '0 0 4px rgba(0, 255, 0, 0.5)',
        zIndex: 10,
        background: 'rgba(0, 0, 0, 0.4)',
        padding: '4px 10px',
        borderRadius: 4,
      }}
    >
      FPS: {fps}
    </div>
  );
};

export default FPSDisplay;
