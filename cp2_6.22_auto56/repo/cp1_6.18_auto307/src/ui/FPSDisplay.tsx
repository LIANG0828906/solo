import React, { useEffect, useRef, useState } from 'react';
import { useSceneStore } from '../store/sceneStore';

const FPSDisplay: React.FC = () => {
  const [fps, setFps] = useState(60);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const setFpsStore = useSceneStore((state) => state.setFps);
  const setParticleDegraded = useSceneStore((state) => state.setParticleDegraded);

  useEffect(() => {
    let animationId: number;

    const tick = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastTimeRef.current;

      if (elapsed >= 500) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        setFpsStore(currentFps);

        if (currentFps < 30) {
          setParticleDegraded(true);
        } else {
          setParticleDegraded(false);
        }

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationId = requestAnimationFrame(tick);
    };

    animationId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [setFpsStore, setParticleDegraded]);

  const fpsColor = fps >= 50 ? '#69F0AE' : fps >= 30 ? '#FFB74D' : '#FF4081';

  return (
    <div style={styles.container}>
      <span style={{ ...styles.label, color: '#80CBC4' }}>FPS</span>
      <span style={{ ...styles.value, color: fpsColor }}>{fps}</span>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    top: 16,
    left: 16,
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: '6px 14px',
    borderRadius: 6,
    zIndex: 1000,
    border: '1px solid rgba(0, 188, 212, 0.2)',
  },
  label: {
    fontSize: 14,
    fontFamily: "'Orbitron', monospace",
    letterSpacing: 1,
  },
  value: {
    fontSize: 14,
    fontFamily: "'Orbitron', monospace",
    fontWeight: 700,
    minWidth: 28,
    textAlign: 'right',
  },
};

export default FPSDisplay;
