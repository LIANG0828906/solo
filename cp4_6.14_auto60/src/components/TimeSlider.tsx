import { useRef, useMemo, useState, useCallback, useEffect } from 'react';

interface TimeSliderProps {
  currentTime: number;
  averageFlow: number;
  onTimeChange: (time: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

const MIN_HOUR = 0;
const MAX_HOUR = 24;
const STEP_MINUTES = 15;
const STEP_HOURS = STEP_MINUTES / 60;
const TOTAL_STEPS = Math.round((MAX_HOUR - MIN_HOUR) / STEP_HOURS);

function formatTime(hoursFloat: number): string {
  const totalMinutes = Math.round(hoursFloat * 60);
  const h = Math.floor(totalMinutes / 60) % 24;
  const m = totalMinutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

function getFlowLabel(flow: number): string {
  if (flow < 30) return '畅通';
  if (flow < 60) return '缓行';
  if (flow < 80) return '拥堵';
  return '严重拥堵';
}

function getFlowColor(flow: number): string {
  if (flow < 30) return '#22c55e';
  if (flow < 60) return '#eab308';
  if (flow < 80) return '#f97316';
  return '#ef4444';
}

export function TimeSlider({
  currentTime,
  averageFlow,
  onTimeChange,
  onDragStart,
  onDragEnd,
}: TimeSliderProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);

  const steps = useMemo(() => {
    const arr: number[] = [];
    for (let i = 0; i <= TOTAL_STEPS; i++) {
      arr.push(MIN_HOUR + i * STEP_HOURS);
    }
    return arr;
  }, []);

  const majorTicks = useMemo(() => {
    return steps.filter((_, idx) => idx % 4 === 0);
  }, [steps]);

  const snapToStep = useCallback((rawValue: number): number => {
    const snapped = Math.round((rawValue - MIN_HOUR) / STEP_HOURS) * STEP_HOURS + MIN_HOUR;
    return Math.max(MIN_HOUR, Math.min(MAX_HOUR, snapped));
  }, []);

  const valueToPercent = useCallback((value: number): number => {
    return ((value - MIN_HOUR) / (MAX_HOUR - MIN_HOUR)) * 100;
  }, []);

  const percentToValue = useCallback((percent: number): number => {
    const raw = MIN_HOUR + (percent / 100) * (MAX_HOUR - MIN_HOUR);
    return snapToStep(raw);
  }, [snapToStep]);

  const handlePositionFromEvent = useCallback((clientX: number) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const percent = ((clientX - rect.left) / rect.width) * 100;
    const value = percentToValue(Math.max(0, Math.min(100, percent)));
    onTimeChange(value);
  }, [percentToValue, onTimeChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onDragStart?.();
    handlePositionFromEvent(e.clientX);

    const handleMouseMove = (ev: MouseEvent) => {
      handlePositionFromEvent(ev.clientX);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      onDragEnd?.();
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [handlePositionFromEvent, onDragStart, onDragEnd]);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 0) return;
    setIsDragging(true);
    onDragStart?.();
    handlePositionFromEvent(e.touches[0].clientX);

    const handleTouchMove = (ev: TouchEvent) => {
      if (ev.touches.length > 0) {
        handlePositionFromEvent(ev.touches[0].clientX);
      }
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
      onDragEnd?.();
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };

    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  }, [handlePositionFromEvent, onDragStart, onDragEnd]);

  const currentPercent = valueToPercent(currentTime);
  const hoverPercent = hoveredStep !== null ? valueToPercent(hoveredStep) : null;

  const flowColor = getFlowColor(averageFlow);
  const flowLabel = getFlowLabel(averageFlow);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onTimeChange(snapToStep(Math.max(MIN_HOUR, currentTime - STEP_HOURS)));
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        onTimeChange(snapToStep(Math.min(MAX_HOUR, currentTime + STEP_HOURS)));
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentTime, onTimeChange, snapToStep]);

  return (
    <div style={{
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      padding: '24px 48px 36px',
      pointerEvents: 'auto',
      zIndex: 20,
    }}>
      <div
        ref={trackRef}
        style={{
          position: 'relative',
          width: '100%',
          height: '80px',
          cursor: isDragging ? 'grabbing' : 'pointer',
          userSelect: 'none',
          touchAction: 'none',
        }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        onMouseMove={(e) => {
          if (!trackRef.current) return;
          const rect = trackRef.current.getBoundingClientRect();
          const percent = ((e.clientX - rect.left) / rect.width) * 100;
          const value = percentToValue(Math.max(0, Math.min(100, percent)));
          setHoveredStep(value);
        }}
        onMouseLeave={() => setHoveredStep(null)}
      >
        {hoverPercent !== null && hoveredStep !== null && !isDragging && (
          <div
            style={{
              position: 'absolute',
              bottom: '44px',
              left: `${hoverPercent}%`,
              transform: 'translateX(-50%)',
              background: 'rgba(30,41,59,0.9)',
              color: '#ffffff',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '12px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              whiteSpace: 'nowrap',
              pointerEvents: 'none',
              border: '1px solid rgba(148,163,184,0.2)',
              backdropFilter: 'blur(8px)',
            }}
          >
            {formatTime(hoveredStep)}
          </div>
        )}

        <div
          style={{
            position: 'absolute',
            bottom: '44px',
            left: `${currentPercent}%`,
            transform: 'translateX(-50%)',
            background: 'rgba(30,41,59,0.9)',
            borderRadius: '8px',
            padding: '10px 14px',
            color: '#ffffff',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            border: '1px solid rgba(148,163,184,0.25)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            zIndex: 5,
          }}
        >
          <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px', letterSpacing: '0.02em' }}>
            全城平均流量指数
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{
              fontSize: '22px',
              fontWeight: 700,
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              color: flowColor,
              textShadow: `0 0 12px ${flowColor}66`,
            }}>
              {averageFlow.toFixed(1)}
            </span>
            <span style={{
              fontSize: '12px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: `${flowColor}22`,
              color: flowColor,
              border: `1px solid ${flowColor}44`,
              fontWeight: 600,
            }}>
              {flowLabel}
            </span>
          </div>
        </div>

        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            height: '8px',
            borderRadius: '4px',
            background: 'rgba(30,41,59,0.85)',
            border: '1px solid rgba(148,163,184,0.15)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${currentPercent}%`,
              background: 'linear-gradient(90deg, #22c55e 0%, #eab308 50%, #ef4444 100%)',
              borderRadius: '4px',
              transition: isDragging ? 'none' : 'width 0.15s ease-out',
              boxShadow: '0 0 16px rgba(234,179,8,0.3)',
            }}
          />
        </div>

        {majorTicks.map((tick, idx) => {
          const pct = valueToPercent(tick);
          const isHour = (tick % 1 === 0);
          return (
            <div key={idx} style={{
              position: 'absolute',
              left: `${pct}%`,
              top: '50%',
              transform: 'translateX(-50%)',
              pointerEvents: 'none',
            }}>
              <div style={{
                width: isHour ? '2px' : '1px',
                height: isHour ? '18px' : '10px',
                background: 'rgba(148,163,184,0.5)',
                margin: '0 auto',
                position: 'relative',
                top: isHour ? '14px' : '10px',
              }} />
              {isHour && (
                <div style={{
                  position: 'absolute',
                  top: '34px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  color: 'rgba(203,213,225,0.85)',
                  fontSize: '11px',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontWeight: 500,
                  whiteSpace: 'nowrap',
                }}>
                  {formatTime(tick)}
                </div>
              )}
            </div>
          );
        })}

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${currentPercent}%`,
            transform: 'translate(-50%, -50%)',
            width: '22px',
            height: '22px',
            borderRadius: '50%',
            background: '#ffffff',
            border: '3px solid #64748b',
            boxShadow: isDragging
              ? '0 0 0 8px rgba(255,255,255,0.15), 0 4px 16px rgba(0,0,0,0.4)'
              : '0 0 0 4px rgba(255,255,255,0.1), 0 2px 8px rgba(0,0,0,0.3)',
            transition: isDragging ? 'none' : 'box-shadow 0.2s ease-out',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        />
      </div>

      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
        padding: '0 4px',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
        }}>
          <div style={{
            color: '#94a3b8',
            fontSize: '11px',
            letterSpacing: '0.04em',
          }}>
            当前模拟时刻
          </div>
          <div style={{
            fontSize: '20px',
            fontWeight: 700,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            color: '#e2e8f0',
            padding: '4px 12px',
            background: 'rgba(30,41,59,0.7)',
            borderRadius: '6px',
            border: '1px solid rgba(148,163,184,0.15)',
            letterSpacing: '0.08em',
          }}>
            {formatTime(currentTime)}
          </div>
        </div>

        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', borderRadius: '2px', background: '#22c55e' }} />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>畅通</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', borderRadius: '2px', background: '#eab308' }} />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>缓行</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '12px', height: '3px', borderRadius: '2px', background: '#ef4444' }} />
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>拥堵</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TimeSlider;
