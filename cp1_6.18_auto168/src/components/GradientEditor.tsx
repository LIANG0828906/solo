import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useGradientStore } from '../stores/gradientStore';
import { formatGradientCSS, hslToString, HSL } from '../engine/gradientEngine';

const PRESET_COLORS: HSL[] = [
  { h: 0, s: 80, l: 50 },
  { h: 15, s: 85, l: 55 },
  { h: 30, s: 90, l: 50 },
  { h: 45, s: 95, l: 55 },
  { h: 60, s: 80, l: 50 },
  { h: 90, s: 70, l: 45 },
  { h: 120, s: 65, l: 40 },
  { h: 150, s: 70, l: 45 },
  { h: 180, s: 75, l: 50 },
  { h: 200, s: 80, l: 50 },
  { h: 220, s: 75, l: 55 },
  { h: 240, s: 70, l: 50 },
  { h: 260, s: 75, l: 55 },
  { h: 280, s: 70, l: 50 },
  { h: 300, s: 75, l: 55 },
  { h: 320, s: 80, l: 50 },
  { h: 340, s: 85, l: 55 },
  { h: 0, s: 0, l: 100 },
  { h: 0, s: 0, l: 80 },
  { h: 0, s: 0, l: 60 },
  { h: 0, s: 0, l: 40 },
  { h: 0, s: 0, l: 20 },
  { h: 0, s: 0, l: 0 },
  { h: 210, s: 50, l: 50 },
];

const ColorPickerPanel: React.FC<{
  color: HSL;
  onChange: (h: number, s: number, l: number) => void;
  onClose: () => void;
}> = ({ color, onChange, onClose }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    setTimeout(() => document.addEventListener('mousedown', handler), 0);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const sliders = [
    {
      label: 'H',
      value: color.h,
      max: 360,
      bg: `linear-gradient(to right, hsl(0,${color.s}%,${color.l}%), hsl(60,${color.s}%,${color.l}%), hsl(120,${color.s}%,${color.l}%), hsl(180,${color.s}%,${color.l}%), hsl(240,${color.s}%,${color.l}%), hsl(300,${color.s}%,${color.l}%), hsl(360,${color.s}%,${color.l}%))`,
    },
    {
      label: 'S',
      value: color.s,
      max: 100,
      bg: `linear-gradient(to right, hsl(${color.h},0%,${color.l}%), hsl(${color.h},100%,${color.l}%))`,
    },
    {
      label: 'L',
      value: color.l,
      max: 100,
      bg: `linear-gradient(to right, hsl(${color.h},${color.s}%,0%), hsl(${color.h},${color.s}%,50%), hsl(${color.h},${color.s}%,100%))`,
    },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        top: '100%',
        left: 0,
        marginTop: 10,
        background: 'rgba(45,45,68,0.95)',
        backdropFilter: 'blur(8px)',
        borderRadius: 12,
        padding: 16,
        zIndex: 100,
        width: 280,
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 24px)',
          gap: 4,
          marginBottom: 16,
          justifyContent: 'center',
        }}
      >
        {PRESET_COLORS.map((c, i) => {
          const isSelected =
            Math.abs(c.h - color.h) < 3 &&
            Math.abs(c.s - color.s) < 3 &&
            Math.abs(c.l - color.l) < 3;
          return (
            <div
              key={i}
              onClick={() => onChange(c.h, c.s, c.l)}
              style={{
                width: 24,
                height: 24,
                borderRadius: 4,
                background: hslToString(c),
                cursor: 'pointer',
                transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
                border: isSelected
                  ? '2px solid #FFFFFF'
                  : '2px solid rgba(255,255,255,0.1)',
                boxShadow: isSelected
                  ? '0 0 0 1px rgba(255,255,255,0.3)'
                  : 'none',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.15)';
                e.currentTarget.style.boxShadow =
                  '0 2px 8px rgba(0,0,0,0.3)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.boxShadow = isSelected
                  ? '0 0 0 1px rgba(255,255,255,0.3)'
                  : 'none';
              }}
            />
          );
        })}
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 12 }}>
        {sliders.map(({ label, value, max, bg }) => (
          <div
            key={label}
            style={{
              marginBottom: 10,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
            }}
          >
            <span
              style={{
                width: 16,
                fontSize: 12,
                fontWeight: 600,
                color: '#999',
                textAlign: 'center',
              }}
            >
              {label}
            </span>
            <input
              type="range"
              min={0}
              max={max}
              value={value}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (label === 'H') onChange(v, color.s, color.l);
                else if (label === 'S') onChange(color.h, v, color.l);
                else onChange(color.h, color.s, v);
              }}
              style={{
                flex: 1,
                background,
              }}
            />
            <span
              style={{
                width: 32,
                fontSize: 11,
                color: '#999',
                textAlign: 'right',
                fontFamily: 'monospace',
              }}
            >
              {Math.round(value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const GradientEditor: React.FC = () => {
  const {
    stops,
    activeStopId,
    setStopColor,
    setStopPosition,
    setActiveStop,
    hueIncrement,
    setHueIncrement,
    generateSeries,
  } = useGradientStore();

  const [dragging, setDragging] = useState<string | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragging(id);
      setActiveStop(id);
    },
    [setActiveStop]
  );

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!barRef.current) return;
      const rect = barRef.current.getBoundingClientRect();
      const position = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      setStopPosition(dragging, position);
    };

    const handleMouseUp = () => {
      setDragging(null);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragging, setStopPosition]);

  const gradientCSS = formatGradientCSS(stops);
  const activeStop = stops.find((s) => s.id === activeStopId);

  return (
    <div>
      <div
        style={{
          background: 'rgba(45,45,68,0.8)',
          backdropFilter: 'blur(8px)',
          borderRadius: 16,
          padding: 28,
        }}
      >
        <h2
          style={{
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 20,
            color: '#E0E0E0',
          }}
        >
          渐变编辑器
        </h2>

        <div style={{ position: 'relative', marginBottom: 24 }}>
          <div
            ref={barRef}
            style={{
              width: 600,
              height: 30,
              borderRadius: 6,
              background: gradientCSS,
              position: 'relative',
              cursor: 'crosshair',
              boxShadow: '0 2px 12px rgba(0,0,0,0.3)',
            }}
          >
            {stops.map((stop) => {
              const isActive = stop.id === activeStopId;
              const isDragging = stop.id === dragging;
              return (
                <div
                  key={stop.id}
                  className="stop-handle"
                  onMouseDown={(e) => handleMouseDown(stop.id, e)}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveStop(isActive ? null : stop.id);
                  }}
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${stop.position * 100}%`,
                    transform: `translate(-50%, -50%) scale(${isDragging ? 1.25 : 1})`,
                    width: 16,
                    height: 16,
                    borderRadius: '50%',
                    background: hslToString(stop.color),
                    border: '2px solid rgba(255,255,255,0.9)',
                    zIndex: isActive ? 10 : 5,
                    boxShadow: isActive
                      ? '0 0 0 3px rgba(255,255,255,0.3), 0 2px 8px rgba(0,0,0,0.4)'
                      : '0 2px 6px rgba(0,0,0,0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: '#FFFFFF',
                    }}
                  />
                </div>
              );
            })}
          </div>

          {activeStop && (
            <ColorPickerPanel
              color={activeStop.color}
              onChange={(h, s, l) => setStopColor(activeStop.id, h, s, l)}
              onClose={() => setActiveStop(null)}
            />
          )}
        </div>

        <div
          style={{
            width: 600,
            height: 120,
            borderRadius: 12,
            background: gradientCSS,
            boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
            marginBottom: 16,
          }}
        />

        <div
          style={{
            background: 'rgba(30,30,50,0.6)',
            borderRadius: 8,
            padding: '10px 14px',
            fontFamily: 'monospace',
            fontSize: 12,
            color: '#A0A0B8',
            wordBreak: 'break-all',
            marginBottom: 24,
            lineHeight: 1.6,
          }}
        >
          {gradientCSS}
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 20,
          }}
        >
          <span style={{ fontSize: 13, color: '#A0A0B8', whiteSpace: 'nowrap' }}>
            色相旋转增量
          </span>
          <input
            type="range"
            min={5}
            max={90}
            step={5}
            value={hueIncrement}
            onChange={(e) => setHueIncrement(Number(e.target.value))}
            style={{
              flex: 1,
              background: `linear-gradient(to right, #3E3E5E, #4CAF50)`,
            }}
          />
          <span
            style={{
              fontSize: 13,
              color: '#4CAF50',
              fontWeight: 600,
              width: 36,
              textAlign: 'right',
              fontFamily: 'monospace',
            }}
          >
            {hueIncrement}°
          </span>
        </div>

        <button
          onClick={generateSeries}
          style={{
            width: '100%',
            padding: '12px 0',
            background: '#4CAF50',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            fontSize: 15,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background-color 0.2s ease-out, transform 0.15s ease, box-shadow 0.2s ease-out',
            boxShadow: '0 4px 12px rgba(76,175,80,0.3)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#5CBF60';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(76,175,80,0.4)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = '#4CAF50';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(76,175,80,0.3)';
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.transform = 'scale(0.97)';
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          生成系列变体
        </button>
      </div>
    </div>
  );
};
