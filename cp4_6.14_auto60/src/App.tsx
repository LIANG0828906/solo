import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { RoadNetwork } from '@/components/RoadNetwork';
import { TimeSlider } from '@/components/TimeSlider';
import { InfoPanel } from '@/components/InfoPanel';
import { getRoadNetwork, getSnapshot, getRandomSnapshot } from '@/utils/trafficData';
import type { RoadNetworkData, TrafficSnapshot } from '@/types';

export default function App() {
  const network: RoadNetworkData = useMemo(() => getRoadNetwork(), []);

  const [currentTime, setCurrentTime] = useState<number>(8.5);
  const [snapshot, setSnapshot] = useState<TrafficSnapshot>(() => getSnapshot(8.5));
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [updateCount, setUpdateCount] = useState<number>(0);
  const [isDraggingSlider, setIsDraggingSlider] = useState<boolean>(false);

  const timerRef = useRef<number | null>(null);
  const rafThrottleRef = useRef<number | null>(null);
  const lastSliderTimeRef = useRef<number>(0);

  const applySnapshot = useCallback((timeHour: number) => {
    setSnapshot(getSnapshot(timeHour));
  }, []);

  const applyRandomSnapshot = useCallback((timeHour: number) => {
    setSnapshot(getRandomSnapshot(timeHour, 12));
    setUpdateCount(prev => prev + 1);
  }, []);

  useEffect(() => {
    if (!isPlaying || isDraggingSlider) {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    const tick = () => {
      setCurrentTime(prev => {
        const next = prev + 0.25;
        if (next >= 24) return 0;
        return next;
      });
    };

    tick();
    applyRandomSnapshot(currentTime);
    setUpdateCount(prev => prev + 1);

    timerRef.current = window.setInterval(() => {
      tick();
    }, 2000);

    return () => {
      if (timerRef.current !== null) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isPlaying, isDraggingSlider]);

  useEffect(() => {
    if (isPlaying && !isDraggingSlider) {
      applyRandomSnapshot(currentTime);
    }
  }, [currentTime, isPlaying, isDraggingSlider, applyRandomSnapshot]);

  const handleTimeChange = useCallback((newTime: number) => {
    if (rafThrottleRef.current !== null) {
      cancelAnimationFrame(rafThrottleRef.current);
    }

    const now = performance.now();
    const elapsed = now - lastSliderTimeRef.current;

    const apply = () => {
      setCurrentTime(newTime);
      applySnapshot(newTime);
      lastSliderTimeRef.current = performance.now();
    };

    if (elapsed > 16) {
      apply();
    } else {
      rafThrottleRef.current = requestAnimationFrame(() => {
        apply();
        rafThrottleRef.current = null;
      });
    }
  }, [applySnapshot]);

  const handleDragStart = useCallback(() => {
    setIsDraggingSlider(true);
  }, []);

  const handleDragEnd = useCallback(() => {
    setIsDraggingSlider(false);
  }, []);

  useEffect(() => {
    return () => {
      if (rafThrottleRef.current !== null) {
        cancelAnimationFrame(rafThrottleRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === 'Space') {
        e.preventDefault();
        setIsPlaying(prev => !prev);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setCurrentTime(8.5);
        setUpdateCount(0);
        applySnapshot(8.5);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [applySnapshot]);

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
      position: 'relative',
      background: '#0f172a',
      fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    }}>
      <RoadNetwork
        network={network}
        snapshot={snapshot}
        isPlaying={isPlaying}
      />

      <InfoPanel
        simTime={currentTime}
        averageFlow={snapshot.averageFlow}
        roadCount={network.roads.length}
        intersectionCount={network.intersections.length}
        updateCount={updateCount}
        isPlaying={isPlaying}
      />

      <TimeSlider
        currentTime={currentTime}
        averageFlow={snapshot.averageFlow}
        onTimeChange={handleTimeChange}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />

      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        zIndex: 30,
        pointerEvents: 'auto',
      }}>
        <button
          onClick={() => setIsPlaying(prev => !prev)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            padding: '10px 16px',
            borderRadius: '10px',
            border: '1px solid rgba(148,163,184,0.15)',
            background: isPlaying
              ? 'linear-gradient(135deg, rgba(239,68,68,0.9), rgba(249,115,22,0.9))'
              : 'linear-gradient(135deg, rgba(34,197,94,0.9), rgba(16,185,129,0.9))',
            color: '#ffffff',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: isPlaying
              ? '0 4px 16px rgba(239,68,68,0.3)'
              : '0 4px 16px rgba(34,197,94,0.3)',
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease-out',
            letterSpacing: '0.02em',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px) scale(1.02)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0) scale(1)';
          }}
        >
          {isPlaying ? '⏸ 暂停模拟' : '▶ 继续模拟'}
        </button>

        <div style={{
          background: 'rgba(30,41,59,0.85)',
          backdropFilter: 'blur(12px)',
          borderRadius: '10px',
          border: '1px solid rgba(148,163,184,0.12)',
          padding: '12px 14px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
        }}>
          <div style={{
            fontSize: '10px',
            color: '#64748b',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: '8px',
          }}>
            操作说明
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              ['🖱️ 左键', '旋转视角'],
              ['🖱️ 滚轮', '缩放场景'],
              ['🖱️ 右键', '平移场景'],
              ['⌨️ ←/→', '调整15分钟'],
              ['⌨️ 空格', '暂停/继续'],
            ].map(([key, val], i) => (
              <div key={i} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: '14px',
              }}>
                <span style={{
                  fontSize: '11px',
                  color: '#cbd5e1',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  padding: '2px 7px',
                  background: 'rgba(15,23,42,0.6)',
                  borderRadius: '4px',
                  border: '1px solid rgba(148,163,184,0.1)',
                }}>
                  {key}
                </span>
                <span style={{
                  fontSize: '11px',
                  color: '#94a3b8',
                }}>
                  {val}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
