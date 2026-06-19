import React, { useCallback, useRef, useState } from 'react';
import { useStore } from '@/store';

interface KnobProps {
  label: string;
  value: number;
  param: string;
  size?: number;
}

const Knob: React.FC<KnobProps> = ({ label, value, param, size = 120 }) => {
  const changeKnob = useStore((s) => s.changeKnob);
  const knobRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const startAngleRef = useRef(0);
  const startValueRef = useRef(0);

  const angle = -135 + (value / 100) * 270;

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    const rect = knobRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    startAngleRef.current = Math.atan2(e.clientY - cy, e.clientX - cx);
    startValueRef.current = value;

    const handleMouseMove = (ev: MouseEvent) => {
      const r = knobRef.current?.getBoundingClientRect();
      if (!r) return;
      const cx2 = r.left + r.width / 2;
      const cy2 = r.top + r.height / 2;
      const currentAngle = Math.atan2(ev.clientY - cy2, ev.clientX - cx2);
      let delta = (currentAngle - startAngleRef.current) * (180 / Math.PI);
      if (delta > 180) delta -= 360;
      if (delta < -180) delta += 360;
      const newValue = Math.max(0, Math.min(100, startValueRef.current + delta * 100 / 270));
      changeKnob(param, newValue);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [value, param, changeKnob]);

  const radius = size / 2 - 10;
  const cx = size / 2;
  const cy = size / 2;

  const startA = (-135 * Math.PI) / 180;
  const endA = (135 * Math.PI) / 180;
  const arcX1 = cx + radius * Math.cos(startA);
  const arcY1 = cy + radius * Math.sin(startA);
  const arcX2 = cx + radius * Math.cos(endA);
  const arcY2 = cy + radius * Math.sin(endA);

  const tickCount = 11;
  const ticks: React.ReactNode[] = [];
  for (let i = 0; i <= tickCount - 1; i++) {
    const t = i / (tickCount - 1);
    const tickAngle = (-135 + t * 270) * (Math.PI / 180);
    const innerR = radius - 8;
    const outerR = radius - 2;
    ticks.push(
      <line
        key={i}
        x1={cx + innerR * Math.cos(tickAngle)}
        y1={cy + innerR * Math.sin(tickAngle)}
        x2={cx + outerR * Math.cos(tickAngle)}
        y2={cy + outerR * Math.sin(tickAngle)}
        stroke="#555"
        strokeWidth="1"
      />
    );
  }

  const pointerAngle = (angle * Math.PI) / 180;
  const pointerLen = radius - 4;

  return (
    <div className="knob-container">
      <div
        ref={knobRef}
        className="knob"
        style={{ width: size, height: size }}
        onMouseDown={handleMouseDown}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={cx} cy={cy} r={radius + 4} fill="#2A2A2A" />
          <circle cx={cx} cy={cy} r={radius - 1} fill="#1A1A1A" />
          <path
            d={`M ${arcX1} ${arcY1} A ${radius} ${radius} 0 1 1 ${arcX2} ${arcY2}`}
            fill="none"
            stroke="#444"
            strokeWidth="2"
            strokeLinecap="round"
          />
          {ticks}
          <line
            x1={cx}
            y1={cy}
            x2={cx + pointerLen * Math.cos(pointerAngle)}
            y2={cy + pointerLen * Math.sin(pointerAngle)}
            stroke="#00FF41"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <circle cx={cx} cy={cy} r="4" fill="#333" />
        </svg>
        {isDragging && (
          <div className="knob-glow" style={{
            width: size, height: size,
            boxShadow: '0 0 20px rgba(0, 255, 65, 0.15)',
          }} />
        )}
      </div>
      <div className="knob-label">{label}</div>
      <div className="knob-value">{value}</div>
      <style>{`
        .knob-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .knob {
          position: relative;
          cursor: grab;
          border-radius: 50%;
          user-select: none;
        }
        .knob:active {
          cursor: grabbing;
        }
        .knob-glow {
          position: absolute;
          top: 0;
          left: 0;
          border-radius: 50%;
          pointer-events: none;
        }
        .knob-label {
          color: #E0E0E0;
          font-family: 'Courier New', monospace;
          font-size: 14px;
          text-align: center;
        }
        .knob-value {
          color: #00FF41;
          font-family: 'Courier New', monospace;
          font-size: 12px;
          text-align: center;
        }
      `}</style>
    </div>
  );
};

const KnobPanel: React.FC = () => {
  const scanlineDensity = useStore((s) => s.scanlineDensity);
  const chromaAberration = useStore((s) => s.chromaAberration);
  const phosphorPersistence = useStore((s) => s.phosphorPersistence);

  return (
    <div className="knob-panel">
      <Knob label="扫描线密度" value={scanlineDensity} param="scanlineDensity" />
      <Knob label="色差强度" value={chromaAberration} param="chromaAberration" />
      <Knob label="余晖持续" value={phosphorPersistence} param="phosphorPersistence" />
      <style>{`
        .knob-panel {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          gap: 80px;
          padding: 20px 0;
        }
        @media (max-width: 768px) {
          .knob-panel {
            gap: 24px;
          }
        }
      `}</style>
    </div>
  );
};

export default KnobPanel;
