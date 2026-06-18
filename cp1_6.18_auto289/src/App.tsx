import { useEffect, useRef, useState, useMemo } from 'react';
import EarthquakeScene from './EarthquakeScene';
import DataPanel from './DataPanel';
import { useEarthquakeStore } from './earthquakeStore';
import {
  TIMELINE_START,
  TIMELINE_END,
  DAY_MS,
  formatDate,
} from './utils';

function AnimatedCounter({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const animRef = useRef<number | null>(null);
  const startRef = useRef(0);
  const startTimeRef = useRef(0);
  const duration = 1000;

  useEffect(() => {
    startRef.current = display;
    startTimeRef.current = performance.now();

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

    const animate = (now: number) => {
      const elapsed = now - startTimeRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const value = Math.round(startRef.current + (target - startRef.current) * eased);
      setDisplay(value);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      if (animRef.current !== null) {
        cancelAnimationFrame(animRef.current);
      }
    };
  }, [target]);

  return <span>{display.toLocaleString()}</span>;
}

function TimelineSlider() {
  const { startTime, endTime, setTimeRange } = useEarthquakeStore();
  const [isDragging, setIsDragging] = useState<'start' | 'end' | null>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  const totalDays = Math.floor((TIMELINE_END - TIMELINE_START) / DAY_MS);
  const startDay = Math.floor((startTime - TIMELINE_START) / DAY_MS);
  const endDay = Math.floor((endTime - TIMELINE_START) / DAY_MS);

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clickX / rect.width;
    const clickedDay = Math.round(ratio * totalDays);

    const distToStart = Math.abs(clickedDay - startDay);
    const distToEnd = Math.abs(clickedDay - endDay);

    if (distToStart < distToEnd) {
      updateStart(clickedDay);
    } else {
      updateEnd(clickedDay);
    }
  };

  const updateStart = (day: number) => {
    const clamped = Math.max(0, Math.min(day, endDay - 1));
    const newStart = TIMELINE_START + clamped * DAY_MS;
    setTimeRange(newStart, endTime);
  };

  const updateEnd = (day: number) => {
    const clamped = Math.min(totalDays, Math.max(day, startDay + 1));
    const newEnd = TIMELINE_START + clamped * DAY_MS;
    setTimeRange(startTime, newEnd);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, x / rect.width));
    const day = Math.round(ratio * totalDays);

    if (isDragging === 'start') {
      updateStart(day);
    } else {
      updateEnd(day);
    }
  };

  const handleMouseUp = () => {
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, startDay, endDay]);

  const startPercent = (startDay / totalDays) * 100;
  const endPercent = (endDay / totalDays) * 100;
  const rangePercent = endPercent - startPercent;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '40px',
        right: '40px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        gap: '12px',
      }}
    >
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '13px',
          color: '#E0E0E0',
          letterSpacing: '0.5px',
        }}
      >
        {formatDate(startTime)} — {formatDate(endTime)}
      </div>

      <div
        ref={trackRef}
        onClick={handleTrackClick}
        style={{
          position: 'relative',
          width: '250px',
          height: '6px',
          background: '#333',
          borderRadius: '3px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            left: `${startPercent}%`,
            width: `${rangePercent}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #FFD700, #FFA500)',
            borderRadius: '3px',
            pointerEvents: 'none',
          }}
        />

        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDragging('start');
          }}
          style={{
            position: 'absolute',
            left: `${startPercent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#FFD700',
            cursor: isDragging === 'start' ? 'grabbing' : 'grab',
            boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              (e.currentTarget as HTMLDivElement).style.background = '#FFA500';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              (e.currentTarget as HTMLDivElement).style.background = '#FFD700';
            }
          }}
        />

        <div
          onMouseDown={(e) => {
            e.stopPropagation();
            setIsDragging('end');
          }}
          style={{
            position: 'absolute',
            left: `${endPercent}%`,
            top: '50%',
            transform: 'translate(-50%, -50%)',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            background: '#FFD700',
            cursor: isDragging === 'end' ? 'grabbing' : 'grab',
            boxShadow: '0 2px 8px rgba(255, 215, 0, 0.4)',
            transition: 'background 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={(e) => {
            if (!isDragging) {
              (e.currentTarget as HTMLDivElement).style.background = '#FFA500';
            }
          }}
          onMouseLeave={(e) => {
            if (!isDragging) {
              (e.currentTarget as HTMLDivElement).style.background = '#FFD700';
            }
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          width: '250px',
          fontFamily: 'monospace',
          fontSize: '10px',
          color: '#555',
        }}
      >
        <span>2020</span>
        <span>2022</span>
        <span>2024</span>
      </div>
    </div>
  );
}

function CounterDisplay() {
  const { getFilteredEarthquakes } = useEarthquakeStore();
  const [count, setCount] = useState(0);
  const { startTime, endTime, earthquakes } = useEarthquakeStore();

  const filteredCount = useMemo(() => {
    return earthquakes.filter(
      (eq) => eq.timestamp >= startTime && eq.timestamp <= endTime
    ).length;
  }, [earthquakes, startTime, endTime]);

  useEffect(() => {
    setCount(getFilteredEarthquakes().length);
  }, [filteredCount, getFilteredEarthquakes]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '32px',
        left: '32px',
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}
    >
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '12px',
          color: '#888',
          letterSpacing: '2px',
          textTransform: 'uppercase',
        }}
      >
        地震事件
      </div>
      <div
        style={{
          fontSize: '24px',
          fontWeight: 700,
          color: '#FFD700',
          fontFamily: 'monospace',
          textShadow: '0 0 20px rgba(255, 215, 0, 0.5), 0 2px 4px rgba(0,0,0,0.5)',
          lineHeight: 1,
        }}
      >
        <AnimatedCounter target={count} />
      </div>
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: '11px',
          color: '#555',
          marginTop: '4px',
        }}
      >
        / 共 500 条记录
      </div>
    </div>
  );
}

export default function App() {
  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <EarthquakeScene />
      <CounterDisplay />
      <TimelineSlider />
      <DataPanel />
    </div>
  );
}
