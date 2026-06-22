import React, { useCallback, useMemo, useRef } from 'react';
import { TimeRange, formatYear } from '../types';

interface TimelineProps {
  fullRange: TimeRange;
  onTimeChange: (range: TimeRange) => void;
}

export default function Timeline({ fullRange, onTimeChange }: TimelineProps) {
  const minRef = useRef(fullRange.min);
  const maxRef = useRef(fullRange.max);
  const frameRef = useRef<number | null>(null);

  const range = maxRef.current - minRef.current;

  const handleMinChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        onTimeChange({
          min: val,
          max: Math.max(maxRef.current, val + 1),
        });
      });
    },
    [onTimeChange]
  );

  const handleMaxChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = parseInt(e.target.value, 10);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => {
        onTimeChange({
          min: Math.min(minRef.current, val - 1),
          max: val,
        });
      });
    },
    [onTimeChange]
  );

  return (
    <div
      style={{
        background: '#16213e',
        borderTop: '1px solid #0f3460',
        padding: '12px 20px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        minHeight: '64px',
      }}
    >
      <span
        style={{
          fontSize: '13px',
          color: '#8892b0',
          whiteSpace: 'nowrap',
          minWidth: '80px',
          textAlign: 'center',
          fontWeight: 600,
        }}
      >
        {formatYear(fullRange.min)}
      </span>
      <input
        type="range"
        min={fullRange.min}
        max={fullRange.max}
        defaultValue={fullRange.min}
        onChange={handleMinChange}
        style={{
          flex: 1,
          accentColor: '#0fbcf9',
          cursor: 'pointer',
        }}
      />
      <span
        style={{
          fontSize: '13px',
          color: '#ccd6f6',
          fontWeight: 700,
          whiteSpace: 'nowrap',
          minWidth: '80px',
          textAlign: 'center',
        }}
      >
        ↕ 时间范围
      </span>
      <input
        type="range"
        min={fullRange.min}
        max={fullRange.max}
        defaultValue={fullRange.max}
        onChange={handleMaxChange}
        style={{
          flex: 1,
          accentColor: '#e94560',
          cursor: 'pointer',
        }}
      />
      <span
        style={{
          fontSize: '13px',
          color: '#8892b0',
          whiteSpace: 'nowrap',
          minWidth: '80px',
          textAlign: 'center',
          fontWeight: 600,
        }}
      >
        {formatYear(fullRange.max)}
      </span>
    </div>
  );
}
