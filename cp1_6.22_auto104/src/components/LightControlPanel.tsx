import React, { useRef, useEffect, useCallback } from 'react';
import { LightSourceData, LightType } from '@/scene/LightSource';

interface Props {
  lights: LightSourceData[];
  selectedLightId: string | null;
  onAdd: (type: LightType) => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<LightSourceData>) => void;
  onSelect: (id: string | null) => void;
}

function hexToHSL(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return { h: 0, s: 0, l };
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * Math.max(0, Math.min(1, color)))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

const HueWheel: React.FC<{
  color: string;
  onChange: (color: string) => void;
}> = ({ color, onChange }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const size = 80;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, size, size);
    const cx = size / 2, cy = size / 2;
    const outerR = size / 2 - 4;
    const innerR = outerR - 14;

    for (let angle = 0; angle < 360; angle++) {
      const startA = ((angle - 1) * Math.PI) / 180;
      const endA = ((angle + 1) * Math.PI) / 180;
      ctx.beginPath();
      ctx.arc(cx, cy, outerR, startA, endA);
      ctx.arc(cx, cy, innerR, endA, startA, true);
      ctx.closePath();
      ctx.fillStyle = `hsl(${angle}, 100%, 50%)`;
      ctx.fill();
    }

    const hsl = hexToHSL(color);
    const selAngle = ((hsl.h - 90) * Math.PI) / 180;
    const midR = (outerR + innerR) / 2;
    const sx = cx + midR * Math.cos(selAngle);
    const sy = cy + midR * Math.sin(selAngle);
    ctx.beginPath();
    ctx.arc(sx, sy, 6, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  }, [color]);

  const handleInteraction = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      let angle = (Math.atan2(y, x) * 180) / Math.PI + 90;
      if (angle < 0) angle += 360;
      onChange(hslToHex(angle, 100, 50));
    },
    [onChange]
  );

  return (
    <canvas
      ref={canvasRef}
      width={size}
      height={size}
      onMouseDown={handleInteraction}
      onMouseMove={(e) => e.buttons === 1 && handleInteraction(e)}
      style={{ cursor: 'pointer', flexShrink: 0 }}
    />
  );
};

const MiniGrid: React.FC<{
  position: [number, number, number];
  onChange: (pos: [number, number, number]) => void;
  isSelected: boolean;
}> = ({ position, onChange, isSelected }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const w = 200, h = 160;
  const scaleX = w / 10;
  const scaleZ = h / 8;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#1e1e1e';
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 0.5;
    for (let i = 1; i < 10; i++) {
      ctx.beginPath();
      ctx.moveTo(i * scaleX, 0);
      ctx.lineTo(i * scaleX, h);
      ctx.stroke();
    }
    for (let i = 1; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * scaleZ);
      ctx.lineTo(w, i * scaleZ);
      ctx.stroke();
    }

    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(1, 1, w - 2, h - 2);

    const winX1 = ((-1 + 5) * scaleX);
    const winX2 = ((1 + 5) * scaleX);
    ctx.strokeStyle = '#4A90D9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(winX1, 0);
    ctx.lineTo(winX2, 0);
    ctx.stroke();

    const lx = (position[0] + 5) * scaleX;
    const lz = (position[2] + 4) * scaleZ;
    ctx.beginPath();
    ctx.arc(lx, lz, isSelected ? 7 : 5, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#4A90D9' : '#ffdd00';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }, [position, isSelected]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isSelected) return;
      e.preventDefault();
      const handleMove = (me: MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const cx = me.clientX - rect.left;
        const cz = me.clientY - rect.top;
        const x = Math.max(-4.5, Math.min(4.5, cx / scaleX - 5));
        const z = Math.max(-3.5, Math.min(3.5, cz / scaleZ - 4));
        onChange([Math.round(x * 10) / 10, position[1], Math.round(z * 10) / 10]);
      };
      const handleUp = () => {
        window.removeEventListener('mousemove', handleMove);
        window.removeEventListener('mouseup', handleUp);
      };
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleUp);
    },
    [isSelected, onChange, position, scaleX, scaleZ]
  );

  return (
    <canvas
      ref={canvasRef}
      width={w}
      height={h}
      onMouseDown={handleMouseDown}
      style={{
        cursor: isSelected ? 'grab' : 'default',
        border: '1px solid #444',
        borderRadius: 4,
        width: '100%',
        height: 'auto',
      }}
    />
  );
};

const typeLabels: Record<LightType, string> = {
  point: '点光源',
  spot: '聚光灯',
  directional: '平行光',
};

const LightControlPanel: React.FC<Props> = ({
  lights,
  selectedLightId,
  onAdd,
  onDelete,
  onUpdate,
  onSelect,
}) => {
  const selected = lights.find((l) => l.id === selectedLightId);

  return (
    <div
      style={{
        width: 280,
        minWidth: 280,
        height: '100%',
        background: '#2C2C2C',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        fontSize: 13,
        userSelect: 'none',
      }}
    >
      <div
        style={{
          padding: '14px 16px 10px',
          borderBottom: '1px solid #444',
          fontWeight: 600,
          fontSize: 15,
          letterSpacing: 0.5,
        }}
      >
        光源控制
      </div>

      <div style={{ padding: '10px 16px', borderBottom: '1px solid #3a3a3a' }}>
        <div style={{ marginBottom: 6, color: '#aaa', fontSize: 11 }}>添加光源</div>
        <div style={{ display: 'flex', gap: 6 }}>
          {(['point', 'spot', 'directional'] as LightType[]).map((t) => (
            <button
              key={t}
              onClick={() => lights.length < 6 && onAdd(t)}
              disabled={lights.length >= 6}
              style={{
                flex: 1,
                padding: '6px 0',
                background: lights.length >= 6 ? '#333' : '#4A90D9',
                color: lights.length >= 6 ? '#666' : '#fff',
                borderRadius: 4,
                fontSize: 11,
                transition: 'all 0.2s ease',
                opacity: lights.length >= 6 ? 0.5 : 1,
              }}
            >
              {typeLabels[t]}
            </button>
          ))}
        </div>
        <div style={{ marginTop: 4, color: '#666', fontSize: 10 }}>
          {lights.length}/6 光源
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {lights.map((light) => {
          const isSelected = light.id === selectedLightId;
          return (
            <div
              key={light.id}
              onClick={() => onSelect(isSelected ? null : light.id)}
              style={{
                margin: '4px 12px',
                padding: 10,
                borderRadius: 6,
                background: isSelected
                  ? 'rgba(74,144,217,0.15)'
                  : 'rgba(255,255,255,0.03)',
                border: isSelected
                  ? '1px solid rgba(74,144,217,0.5)'
                  : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: '50%',
                      background: light.color,
                      boxShadow: `0 0 6px ${light.color}`,
                      transition: 'all 0.2s ease',
                    }}
                  />
                  <span style={{ fontSize: 12 }}>{typeLabels[light.type]}</span>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(light.id);
                  }}
                  style={{
                    background: 'transparent',
                    color: '#888',
                    fontSize: 16,
                    padding: '0 4px',
                    lineHeight: 1,
                    transition: 'color 0.2s ease',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = '#e55')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = '#888')
                  }
                >
                  ×
                </button>
              </div>

              {isSelected && (
                <div
                  style={{ marginTop: 8 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      marginBottom: 8,
                    }}
                  >
                    <HueWheel
                      color={light.color}
                      onChange={(c) => onUpdate(light.id, { color: c })}
                    />
                    <div style={{ flex: 1 }}>
                      <div style={{ color: '#999', fontSize: 10, marginBottom: 4 }}>
                        颜色预览
                      </div>
                      <div
                        style={{
                          width: '100%',
                          height: 28,
                          borderRadius: 4,
                          background: light.color,
                          border: '1px solid #555',
                          transition: 'background 0.2s ease',
                          boxShadow: `0 0 12px ${light.color}44`,
                        }}
                      />
                      <div
                        style={{
                          color: '#aaa',
                          fontSize: 10,
                          marginTop: 2,
                          fontFamily: 'monospace',
                        }}
                      >
                        {light.color}
                      </div>
                    </div>
                  </div>

                  <SliderRow
                    label="强度"
                    value={light.intensity}
                    min={0.1}
                    max={2.0}
                    step={0.05}
                    active={isSelected}
                    onChange={(v) => onUpdate(light.id, { intensity: v })}
                  />

                  <div style={{ marginBottom: 8 }}>
                    <div
                      style={{
                        color: '#999',
                        fontSize: 10,
                        marginBottom: 4,
                      }}
                    >
                      XZ 位置
                    </div>
                    <MiniGrid
                      position={light.position}
                      onChange={(pos) => onUpdate(light.id, { position: pos })}
                      isSelected={isSelected}
                    />
                  </div>

                  <SliderRow
                    label="Y 高度"
                    value={light.position[1]}
                    min={0.5}
                    max={2.5}
                    step={0.1}
                    active={isSelected}
                    onChange={(v) =>
                      onUpdate(light.id, {
                        position: [light.position[0], v, light.position[2]],
                      })
                    }
                  />

                  {(light.type === 'point' || light.type === 'spot') && (
                    <SliderRow
                      label="衰减范围"
                      value={light.decay}
                      min={1}
                      max={10}
                      step={0.5}
                      active={isSelected}
                      onChange={(v) => onUpdate(light.id, { decay: v })}
                    />
                  )}

                  {light.type === 'spot' && (
                    <>
                      <SliderRow
                        label="锥角"
                        value={light.spotAngle}
                        min={0.1}
                        max={1.4}
                        step={0.05}
                        active={isSelected}
                        onChange={(v) => onUpdate(light.id, { spotAngle: v })}
                      />
                      <SliderRow
                        label="边缘柔化"
                        value={light.spotPenumbra}
                        min={0}
                        max={1}
                        step={0.05}
                        active={isSelected}
                        onChange={(v) =>
                          onUpdate(light.id, { spotPenumbra: v })
                        }
                      />
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {lights.length === 0 && (
          <div
            style={{
              textAlign: 'center',
              color: '#666',
              padding: 30,
              fontSize: 12,
            }}
          >
            点击上方按钮添加光源
          </div>
        )}
      </div>
    </div>
  );
};

const SliderRow: React.FC<{
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  active: boolean;
  onChange: (v: number) => void;
}> = ({ label, value, min, max, step, active, onChange }) => (
  <div style={{ marginBottom: 8 }}>
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        color: '#999',
        fontSize: 10,
        marginBottom: 2,
      }}
    >
      <span>{label}</span>
      <span style={{ color: active ? '#4A90D9' : '#ccc', fontFamily: 'monospace' }}>
        {value.toFixed(2)}
      </span>
    </div>
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={value}
      className={active ? 'active-slider' : ''}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      style={{ width: '100%' }}
    />
  </div>
);

export default LightControlPanel;
