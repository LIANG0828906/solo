import React, { useCallback, useRef, useEffect, useState } from 'react';

interface EnergyKnobProps {
  value: number;
  min?: number;
  max?: number;
  onChange: (value: number) => void;
  systemColor: string;
  label: string;
  disabled?: boolean;
}

const KNOB_SIZE = 50;
const MAX_ROTATION = 300;
const MIN_ROTATION = 0;

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const EnergyKnob: React.FC<EnergyKnobProps> = ({
  value,
  min = 10,
  max = 70,
  onChange,
  systemColor,
  label,
  disabled = false,
}) => {
  const knobRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startAngleRef = useRef(0);
  const startValueRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const [visualValue, setVisualValue] = useState(value);

  useEffect(() => {
    setVisualValue(value);
  }, [value]);

  const range = max - min;
  const rotation = ((visualValue - min) / range) * MAX_ROTATION;
  const normalized = (visualValue - min) / range;
  const hue = normalized * 120;
  const bgGradient = hslToHex(hue, 75, 50);

  const getAngleFromPointer = useCallback((clientX: number, clientY: number) => {
    if (!knobRef.current) return 0;
    const rect = knobRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = clientX - cx;
    const dy = clientY - cy;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    angle = (angle + 450) % 360;
    return angle;
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (disabled) return;
    e.preventDefault();
    isDragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    startAngleRef.current = getAngleFromPointer(e.clientX, e.clientY);
    startValueRef.current = value;
  }, [disabled, value, getAngleFromPointer]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current || disabled) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);

    rafRef.current = requestAnimationFrame(() => {
      const currentAngle = getAngleFromPointer(e.clientX, e.clientY);
      let deltaAngle = currentAngle - startAngleRef.current;
      if (deltaAngle > 180) deltaAngle -= 360;
      if (deltaAngle < -180) deltaAngle += 360;

      const deltaValue = (deltaAngle / MAX_ROTATION) * range;
      let newValue = Math.round(startValueRef.current + deltaValue);
      newValue = Math.max(min, Math.min(max, newValue));

      setVisualValue(newValue);
    });
  }, [disabled, getAngleFromPointer, range, min, max]);

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    onChange(visualValue);
  }, [onChange, visualValue]);

  useEffect(() => {
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const indicatorRadius = KNOB_SIZE / 2 - 6;
  const angleRad = ((rotation - 135) * Math.PI) / 180;
  const indicatorX = KNOB_SIZE / 2 + indicatorRadius * Math.cos(angleRad);
  const indicatorY = KNOB_SIZE / 2 + indicatorRadius * Math.sin(angleRad);

  const arcStart = -135;
  const arcEnd = arcStart + MAX_ROTATION * normalized;
  const toRadians = (deg: number) => (deg * Math.PI) / 180;
  const r = KNOB_SIZE / 2 - 3;
  const cx = KNOB_SIZE / 2;
  const cy = KNOB_SIZE / 2;
  const x1 = cx + r * Math.cos(toRadians(arcStart));
  const y1 = cy + r * Math.sin(toRadians(arcStart));
  const x2 = cx + r * Math.cos(toRadians(arcEnd));
  const y2 = cy + r * Math.sin(toRadians(arcEnd));
  const largeArc = MAX_ROTATION * normalized > 180 ? 1 : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div
        ref={knobRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: 'relative',
          width: KNOB_SIZE,
          height: KNOB_SIZE,
          cursor: disabled ? 'not-allowed' : 'grab',
          touchAction: 'none',
          userSelect: 'none',
          opacity: disabled ? 0.5 : 1,
        }}
      >
        <svg width={KNOB_SIZE} height={KNOB_SIZE} style={{ position: 'absolute', top: 0, left: 0 }}>
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth={3}
            strokeDasharray={`${2 * Math.PI * r * (MAX_ROTATION / 360)} ${2 * Math.PI * r}`}
            strokeDashoffset={-2 * Math.PI * r * ((360 - MAX_ROTATION) / 2) / 360}
            transform={`rotate(-135 ${cx} ${cy})`}
            strokeLinecap="round"
          />
          {normalized > 0.01 && (
            <path
              d={`M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`}
              fill="none"
              stroke={bgGradient}
              strokeWidth={3}
              strokeLinecap="round"
              style={{ transition: 'stroke 0.2s ease-out' }}
            />
          )}
          <circle
            cx={cx}
            cy={cy}
            r={KNOB_SIZE / 2 - 9}
            fill="#0B0C10"
            stroke={systemColor}
            strokeWidth={1}
            style={{ filter: `drop-shadow(0 0 6px ${systemColor}40)` }}
          />
          <circle
            cx={indicatorX}
            cy={indicatorY}
            r={3.5}
            fill={systemColor}
            style={{
              filter: `drop-shadow(0 0 4px ${systemColor})`,
            }}
          />
        </svg>
      </div>
      <div style={{
        fontSize: 11,
        color: systemColor,
        fontWeight: 600,
        letterSpacing: 0.5,
        textShadow: `0 0 6px ${systemColor}80`,
      }}>
        {label}
      </div>
      <div style={{
        fontSize: 14,
        fontWeight: 700,
        color: '#fff',
        minWidth: 40,
        textAlign: 'center',
      }}>
        {visualValue}
      </div>
    </div>
  );
};

export default EnergyKnob;
