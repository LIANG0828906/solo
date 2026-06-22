import { useEffect, useRef, useState } from 'react';

const FPS_THRESHOLD = 55;
const UPDATE_INTERVAL_MS = 200;

export const FpsCounter = () => {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastUpdateRef = useRef(performance.now());
  const rafRef = useRef<number | null>(null);
  const warnedBelowRef = useRef(false);

  useEffect(() => {
    const tick = () => {
      frameCountRef.current++;
      const now = performance.now();
      const elapsed = now - lastUpdateRef.current;
      if (elapsed >= UPDATE_INTERVAL_MS) {
        const currentFps = Math.round((frameCountRef.current * 1000) / elapsed);
        setFps(currentFps);
        if (currentFps < FPS_THRESHOLD) {
          if (!warnedBelowRef.current) {
            console.warn(
              `[AuraCanvas] FPS dropped below ${FPS_THRESHOLD}: current=${currentFps}`,
            );
            warnedBelowRef.current = true;
          }
        } else {
          warnedBelowRef.current = false;
        }
        frameCountRef.current = 0;
        lastUpdateRef.current = now;
      }
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const color = fps >= FPS_THRESHOLD ? 'rgba(255,255,255,0.92)' : 'rgba(255,120,120,0.95)';

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        left: 20,
        fontSize: 14,
        color,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 10,
        padding: '6px 12px',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        boxShadow: 'inset 0 0 12px rgba(255,255,255,0.04)',
        zIndex: 20,
        letterSpacing: 0.5,
      }}
    >
      FPS {fps}
    </div>
  );
};

export default FpsCounter;
