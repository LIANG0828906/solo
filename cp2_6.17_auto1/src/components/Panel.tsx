import React, { useState, useEffect, useRef } from 'react';
import {
  PRESETS,
  MEDIA,
  snellLaw,
  totalReflection,
  degToRad,
  radToDeg,
} from '@/utils/physics';

interface PanelProps {
  preset: { id: string; medium1: string; medium2: string; label: string };
  medium1: { name: string; refractiveIndex: number; color: string };
  medium2: { name: string; refractiveIndex: number; color: string };
  incidentAngle: number;
  onPresetChange: (id: string) => void;
  onAngleChange: (angle: number) => void;
  dispersionMode: boolean;
  onDispersionModeChange: (value: boolean) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const MEDIUM_ICONS: Record<string, { icon: string; shape: string; label: string }> = {
  air: { icon: '☁️', shape: 'circle', label: '空气' },
  water: { icon: '💧', shape: 'circle', label: '水' },
  glass: { icon: '🪟', shape: 'square', label: '玻璃' },
  diamond: { icon: '💎', shape: 'diamond', label: '钻石' },
};

function Panel({
  preset,
  medium1,
  medium2,
  incidentAngle,
  onPresetChange,
  onAngleChange,
  dispersionMode,
  onDispersionModeChange,
  collapsed,
  onToggleCollapse,
}: PanelProps) {
  const incidentAngleRad = degToRad(incidentAngle);
  const physics = snellLaw(incidentAngleRad, medium1.refractiveIndex, medium2.refractiveIndex);
  const criticalAngle = totalReflection(medium1.refractiveIndex, medium2.refractiveIndex);

  const [prevMedium2, setPrevMedium2] = useState(preset.medium2);
  const [iconTransition, setIconTransition] = useState(1);
  const rafRef = useRef<number | null>(null);
  const transitionStartRef = useRef<number>(0);
  const transitionDuration = 600;

  useEffect(() => {
    if (prevMedium2 !== preset.medium2) {
      setPrevMedium2(preset.medium2);
      transitionStartRef.current = performance.now();
      setIconTransition(0);
      const animate = (now: number) => {
        const elapsed = now - transitionStartRef.current;
        const t = Math.min(1, elapsed / transitionDuration);
        const eased =
          t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        setIconTransition(eased);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate);
        }
      };
      rafRef.current = requestAnimationFrame(animate);
      return () => {
        if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      };
    }
  }, [preset.medium2, prevMedium2]);

  const MediumIconComponent = ({
    mediumKey,
    opacity,
    scale,
  }: {
    mediumKey: string;
    opacity: number;
    scale: number;
  }) => {
    const info = MEDIUM_ICONS[mediumKey] || MEDIUM_ICONS.air;
    const color = MEDIA[mediumKey]?.color || '#ffffff';
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 52,
          height: 52,
          borderRadius: 12,
          background: `linear-gradient(135deg, ${color}33, ${color}11)`,
          border: `1px solid ${color}66`,
          transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
          opacity,
          transform: `scale(${scale})`,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div style={{ fontSize: 26, filter: `drop-shadow(0 0 6px ${color}88)` }}>
          {info.icon}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 2,
            right: 4,
            fontSize: 9,
            fontFamily: 'Courier New',
            color: '#E0E0E0',
            opacity: 0.7,
          }}
        >
          n={MEDIA[mediumKey]?.refractiveIndex.toFixed(2)}
        </div>
      </div>
    );
  };

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 340,
    background: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: collapsed ? '12px 16px' : '16px 20px',
    color: '#E0E0E0',
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
    border: '1px solid rgba(255, 255, 255, 0.12)',
    transition: 'all 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    zIndex: 100,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: collapsed ? 0 : 16,
    cursor: 'pointer',
    userSelect: 'none',
  };

  const arrowStyle: React.CSSProperties = {
    fontSize: 16,
    transition: 'transform 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
    color: '#A0AEC0',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Courier New',
    fontSize: 14,
    color: '#A0AEC0',
    marginBottom: 6,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: 'Courier New',
    fontSize: 14,
    color: '#E0E0E0',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid rgba(255,255,255,0.05)',
  };

  return (
    <>
      <div style={panelStyle}>
        <div style={headerStyle} onClick={onToggleCollapse}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 20 }}>🔬</span>
            <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>
              光学控制面板
            </div>
          </div>
          <span style={arrowStyle}>▼</span>
        </div>

        {!collapsed && (
          <div>
            <div style={{ marginBottom: 18 }}>
              <div style={labelStyle}>介质组合</div>
              <select
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  color: '#E0E0E0',
                  fontFamily: 'Courier New',
                  fontSize: 14,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.25s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                }}
                value={preset.id}
                onChange={(e) => onPresetChange(e.target.value)}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: '#1A1A2E' }}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 14,
                marginBottom: 18,
                padding: '14px 10px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                border: '1px solid rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <MediumIconComponent mediumKey={preset.medium1} opacity={1} scale={1} />
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: 'Courier New',
                    fontSize: 11,
                    color: '#818CF8',
                  }}
                >
                  {medium1.name} (光疏)
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 4,
                  color: '#3B82F6',
                  fontSize: 14,
                }}
              >
                <div style={{ transform: 'rotate(-90deg)' }}>➜</div>
                <div
                  style={{
                    fontFamily: 'Courier New',
                    fontSize: 10,
                    color: '#A0AEC0',
                  }}
                >
                  n₁→n₂
                </div>
              </div>

              <div style={{ textAlign: 'center', position: 'relative', width: 52 }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    transition: 'all 0.3s ease',
                  }}
                >
                  <MediumIconComponent
                    mediumKey={preset.medium2}
                    opacity={iconTransition}
                    scale={0.6 + 0.4 * iconTransition}
                  />
                </div>
                <MediumIconComponent mediumKey={preset.medium2} opacity={0} scale={1} />
                <div
                  style={{
                    marginTop: 6,
                    fontFamily: 'Courier New',
                    fontSize: 11,
                    color: '#F472B6',
                    opacity: iconTransition,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {medium2.name} (光密)
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 18 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <div style={labelStyle}>入射角 θ₁</div>
                <div
                  style={{
                    fontFamily: 'Courier New',
                    fontSize: 16,
                    fontWeight: 'bold',
                    color: '#FBBF24',
                    textShadow: '0 0 8px rgba(251, 191, 36, 0.3)',
                  }}
                >
                  {incidentAngle.toFixed(1)}°
                </div>
              </div>
              <input
                type="range"
                min="0"
                max="89"
                step="0.5"
                value={incidentAngle}
                onChange={(e) => onAngleChange(parseFloat(e.target.value))}
                style={{
                  width: '100%',
                  height: 6,
                  borderRadius: 3,
                  background: `linear-gradient(to right, #3B82F6 0%, #8B5CF6 ${(incidentAngle / 89) * 100}%, rgba(255,255,255,0.1) ${(incidentAngle / 89) * 100}%, rgba(255,255,255,0.1) 100%)`,
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 4,
                  fontFamily: 'Courier New',
                  fontSize: 10,
                  color: '#718096',
                }}
              >
                <span>0°</span>
                {criticalAngle !== null && (
                  <span style={{ color: '#FBBF24' }}>
                    临界: {radToDeg(criticalAngle).toFixed(1)}°
                  </span>
                )}
                <span>89°</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginBottom: 18,
                padding: '12px 14px',
                background: dispersionMode
                  ? 'linear-gradient(90deg, rgba(255,0,0,0.08), rgba(255,127,0,0.08), rgba(255,255,0,0.08), rgba(0,255,0,0.08), rgba(0,0,255,0.08), rgba(75,0,130,0.08), rgba(148,0,211,0.08))'
                  : 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                border: `1px solid ${dispersionMode ? 'rgba(168, 85, 247, 0.3)' : 'rgba(255,255,255,0.05)'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
              }}
              onClick={() => onDispersionModeChange(!dispersionMode)}
            >
              <div
                style={{
                  width: 40,
                  height: 24,
                  borderRadius: 12,
                  background: dispersionMode
                    ? 'linear-gradient(90deg, #EF4444, #F59E0B, #10B981, #3B82F6, #8B5CF6)'
                    : 'rgba(255,255,255,0.1)',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: dispersionMode ? 18 : 2,
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: '#ffffff',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                    transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'Courier New',
                    fontSize: 13,
                    color: dispersionMode ? '#C084FC' : '#A0AEC0',
                    fontWeight: dispersionMode ? 600 : 400,
                    transition: 'color 0.3s',
                  }}
                >
                  {dispersionMode ? '🌈 色散模式 已开启' : '色散模式'}
                </div>
                <div
                  style={{
                    fontFamily: 'Courier New',
                    fontSize: 10,
                    color: '#718096',
                    marginTop: 2,
                  }}
                >
                  7色光谱分解效果
                </div>
              </div>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  ...labelStyle,
                  marginBottom: 12,
                  color: '#818CF8',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>📊</span> 介质信息
              </div>

              <div style={rowStyle}>
                <div style={labelStyle}>光疏介质 n₁</div>
                <div style={valueStyle}>
                  {medium1.name} ({medium1.refractiveIndex.toFixed(2)})
                </div>
              </div>

              <div style={rowStyle}>
                <div style={labelStyle}>光密介质 n₂</div>
                <div style={{ ...valueStyle, color: '#F472B6' }}>
                  {medium2.name} ({medium2.refractiveIndex.toFixed(2)})
                </div>
              </div>

              {criticalAngle !== null && (
                <div style={{ ...rowStyle, borderBottom: 'none' }}>
                  <div style={{ ...labelStyle, color: '#FBBF24' }}>⚠ 临界角 θc</div>
                  <div style={{ ...valueStyle, color: '#FBBF24', fontWeight: 'bold' }}>
                    {radToDeg(criticalAngle).toFixed(1)}°
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 12,
                padding: 14,
              }}
            >
              <div
                style={{
                  ...labelStyle,
                  marginBottom: 12,
                  color: '#34D399',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>📐</span> 角度数据
              </div>

              <div style={rowStyle}>
                <div style={labelStyle}>入射角 θ₁</div>
                <div style={valueStyle}>{incidentAngle.toFixed(1)}°</div>
              </div>

              <div style={rowStyle}>
                <div style={{ ...labelStyle, color: '#60A5FA' }}>反射角 θᵣ</div>
                <div style={{ ...valueStyle, color: '#60A5FA' }}>
                  {radToDeg(physics.reflectionAngle).toFixed(1)}°
                </div>
              </div>

              <div style={rowStyle}>
                <div style={{ ...labelStyle, color: '#F87171' }}>折射角 θ₂</div>
                <div
                  style={{
                    ...valueStyle,
                    color: physics.isTotalReflection ? '#FBBF24' : '#F87171',
                    fontWeight: physics.isTotalReflection ? 'bold' : 'normal',
                  }}
                >
                  {physics.isTotalReflection
                    ? '⚡ 全反射'
                    : physics.refractionAngle !== null
                    ? `${radToDeg(physics.refractionAngle).toFixed(1)}°`
                    : '-'}
                </div>
              </div>

              <div style={{ ...rowStyle, borderBottom: 'none' }}>
                <div style={labelStyle}>n₁·sin(θ₁)</div>
                <div style={{ ...valueStyle, color: '#34D399' }}>
                  = {(medium1.refractiveIndex * Math.sin(incidentAngleRad)).toFixed(4)}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: '12px 14px',
                background: 'rgba(59, 130, 246, 0.08)',
                borderRadius: 10,
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Courier New',
                  fontSize: 12,
                  color: '#93C5FD',
                  lineHeight: 1.6,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 14 }}>💡</span>
                <span>
                  拖拽场景左侧的发光圆点光源可改变入射角。<br />
                  超过临界角后发生全反射现象！
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          div[style*="position: absolute"] {
            top: auto !important;
            bottom: 0 !important;
            right: 0 !important;
            left: 0 !important;
            width: 100% !important;
            border-radius: 20px 20px 0 0 !important;
            max-height: 55vh;
            overflow-y: auto;
          }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #60A5FA, #3B82F6);
          cursor: grab;
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.6), inset 0 1px 0 rgba(255,255,255,0.3);
          transition: transform 0.25s cubic-bezier(0.68, -0.55, 0.27, 1.55), box-shadow 0.2s;
          border: 2px solid rgba(255,255,255,0.2);
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.18);
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.8), inset 0 1px 0 rgba(255,255,255,0.4);
          cursor: grabbing;
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #60A5FA, #3B82F6);
          cursor: grab;
          border: 2px solid rgba(255,255,255,0.2);
          box-shadow: 0 0 12px rgba(59, 130, 246, 0.6);
        }
        select:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(59, 130, 246, 0.4) !important;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
        }
        select:focus {
          border-color: rgba(59, 130, 246, 0.6) !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.15);
        }
      `}</style>
    </>
  );
}

export default Panel;
