import { useState, useEffect, useRef } from 'react';

interface PerformanceMetrics {
  fps: number;
  memory?: number;
  avgFps: number;
}

interface PerformanceMonitorProps {
  show?: boolean;
}

function PerformanceMonitor({ show = false }: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 0,
    avgFps: 0,
  });
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const fpsHistoryRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!show) {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
      return;
    }

    const measure = () => {
      frameCountRef.current++;
      const now = performance.now();
      const delta = now - lastTimeRef.current;

      if (delta >= 1000) {
        const fps = Math.round((frameCountRef.current * 1000) / delta);
        fpsHistoryRef.current.push(fps);
        if (fpsHistoryRef.current.length > 60) {
          fpsHistoryRef.current.shift();
        }

        const avgFps = Math.round(
          fpsHistoryRef.current.reduce((a, b) => a + b, 0) / fpsHistoryRef.current.length
        );

        let memory: number | undefined;
        if ((performance as any).memory) {
          memory = Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
        }

        setMetrics({ fps, avgFps, memory });

        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      rafRef.current = requestAnimationFrame(measure);
    };

    rafRef.current = requestAnimationFrame(measure);

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [show]);

  if (!show) return null;

  const getFpsColor = (fps: number) => {
    if (fps >= 50) return '#00d4aa';
    if (fps >= 30) return '#ffc107';
    return '#ff6b6b';
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        background: 'rgba(0, 0, 0, 0.7)',
        color: '#fff',
        padding: '10px 16px',
        borderRadius: 8,
        fontSize: 12,
        fontFamily: 'monospace',
        zIndex: 9999,
        pointerEvents: 'none',
        backdropFilter: 'blur(8px)',
        border: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <div style={{ marginBottom: 4, color: '#8892a0', fontSize: 10 }}>PERFORMANCE</div>
      <div>
        FPS:{' '}
        <span style={{ color: getFpsColor(metrics.fps), fontWeight: 'bold' }}>
          {metrics.fps}
        </span>
        <span style={{ color: '#8892a0' }}> (avg {metrics.avgFps})</span>
      </div>
      {metrics.memory !== undefined && (
        <div>
          Memory:{' '}
          <span style={{ color: metrics.memory < 150 ? '#00d4aa' : '#ffc107', fontWeight: 'bold' }}>
            {metrics.memory} MB
          </span>
        </div>
      )}
    </div>
  );
}

export default PerformanceMonitor;
