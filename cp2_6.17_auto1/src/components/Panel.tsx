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

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
}

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
  const transitionDuration = 550;

  useEffect(() => {
    if (prevMedium2 !== preset.medium2) {
      setPrevMedium2(preset.medium2);
      transitionStartRef.current = performance.now();
      setIconTransition(0);
      const animate = (now: number) => {
        const elapsed = now - transitionStartRef.current;
        const t = Math.min(1, elapsed / transitionDuration);
        const eased = easeInOutCubic(t);
        setIconTransition(eased);
        if (t < 1) {
          rafRef.current = requestAnimationFrame(animate);
        } else {
          rafRef.current = null;
        }
      };
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(animate);
    }
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
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
    const color = MEDIA[mediumKey]?.color || '#60A5FA';
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 58,
          height: 58,
          borderRadius: 14,
          background: `linear-gradient(145deg, ${color}55 0%, ${color}22 45%, rgba(0,0,0,0.25) 100%)`,
          border: `1px solid ${color}88`,
          transition: 'all 0.28s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
          opacity,
          transform: `scale(${scale})`,
          position: 'relative',
          overflow: 'hidden',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.15), 0 4px 18px ${color}30, 0 0 24px ${color}20`,
          backdropFilter: 'blur(4px)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '40%',
            background: `linear-gradient(180deg, ${color}33 0%, transparent 100%)`,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            fontSize: 30,
            filter: `drop-shadow(0 0 10px ${color}AA) drop-shadow(0 2px 4px rgba(0,0,0,0.5))`,
            zIndex: 1,
          }}
        >
          {info.icon}
        </div>
        <div
          style={{
            position: 'absolute',
            bottom: 3,
            right: 5,
            fontSize: 9,
            fontFamily: 'Courier New',
            color: '#E2E8F0',
            opacity: 0.75,
            fontWeight: 600,
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
            letterSpacing: -0.3,
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
    width: 350,
    background: 'rgba(12, 14, 28, 0.72)',
    borderRadius: 18,
    padding: collapsed ? '12px 18px' : '18px 22px',
    color: '#E0E0E0',
    backdropFilter: 'blur(16px) saturate(1.3)',
    WebkitBackdropFilter: 'blur(16px) saturate(1.3)',
    boxShadow:
      '0 10px 40px rgba(0, 0, 0, 0.55), inset 0 1px 0 rgba(255,255,255,0.08), inset 0 -1px 0 rgba(0,0,0,0.4)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    transition: 'all 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    zIndex: 100,
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: collapsed ? 0 : 18,
    cursor: 'pointer',
    userSelect: 'none',
  };

  const arrowStyle: React.CSSProperties = {
    fontSize: 16,
    transition: 'transform 0.35s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
    transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
    color: '#718096',
    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
  };

  const labelStyle: React.CSSProperties = {
    fontFamily: 'Courier New',
    fontSize: 14,
    color: '#8B95A9',
    marginBottom: 6,
    letterSpacing: 0.2,
  };

  const valueStyle: React.CSSProperties = {
    fontFamily: 'Courier New',
    fontSize: 14,
    color: '#E2E8F0',
  };

  const rowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '9px 0',
    borderBottom: '1px solid rgba(255,255,255,0.04)',
  };

  return (
    <>
      <div style={panelStyle}>
        <div style={headerStyle} onClick={onToggleCollapse}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 22, filter: 'drop-shadow(0 0 8px rgba(96,165,250,0.5))' }}>🔬</span>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#F7FAFC', letterSpacing: 0.3 }}>
              光学控制面板
            </div>
          </div>
          <span style={arrowStyle}>▼</span>
        </div>

        {!collapsed && (
          <div>
            <div style={{ marginBottom: 20 }}>
              <div style={labelStyle}>介质组合</div>
              <select
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.12)',
                  borderRadius: 12,
                  color: '#E2E8F0',
                  fontFamily: 'Courier New',
                  fontSize: 14,
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'all 0.25s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.05)',
                }}
                value={preset.id}
                onChange={(e) => onPresetChange(e.target.value)}
              >
                {PRESETS.map((p) => (
                  <option key={p.id} value={p.id} style={{ background: '#0F111E', color: '#E2E8F0' }}>
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
                gap: 16,
                marginBottom: 20,
                padding: '16px 12px',
                background:
                  'linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(59,130,246,0.04) 50%, rgba(236,72,153,0.06) 100%)',
                borderRadius: 14,
                border: '1px solid rgba(99,102,241,0.12)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div style={{ textAlign: 'center' }}>
                <MediumIconComponent mediumKey={preset.medium1} opacity={1} scale={1} />
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: 'Courier New',
                    fontSize: 11,
                    color: '#818CF8',
                    fontWeight: 600,
                    letterSpacing: 0.3,
                  }}
                >
                  {medium1.name} · 光疏
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 5,
                  color: '#60A5FA',
                  fontSize: 14,
                  padding: '0 6px',
                }}
              >
                <div
                  style={{
                    transform: 'rotate(-90deg)',
                    filter: 'drop-shadow(0 0 6px rgba(96,165,250,0.6))',
                  }}
                >
                  ➜
                </div>
                <div
                  style={{
                    fontFamily: 'Courier New',
                    fontSize: 10,
                    color: '#4A5568',
                    fontWeight: 600,
                    letterSpacing: 0.5,
                  }}
                >
                  n₁ → n₂
                </div>
              </div>

              <div style={{ textAlign: 'center', position: 'relative', width: 58, height: 78 }}>
                <div
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                  }}
                >
                  <MediumIconComponent
                    mediumKey={preset.medium2}
                    opacity={iconTransition}
                    scale={0.55 + 0.45 * iconTransition}
                  />
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontFamily: 'Courier New',
                    fontSize: 11,
                    color: '#F472B6',
                    fontWeight: 600,
                    letterSpacing: 0.3,
                    opacity: iconTransition,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {medium2.name} · 光密
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                  marginBottom: 10,
                }}
              >
                <div style={labelStyle}>入射角 θ₁</div>
                <div
                  style={{
                    fontFamily: 'Courier New',
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#FBBF24',
                    textShadow: '0 0 10px rgba(251, 191, 36, 0.35)',
                    letterSpacing: 0.5,
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
                  height: 7,
                  borderRadius: 4,
                  background: `linear-gradient(to right, #3B82F6 0%, #8B5CF6 ${(incidentAngle / 89) * 100}%, rgba(255,255,255,0.07) ${(incidentAngle / 89) * 100}%, rgba(255,255,255,0.07) 100%)`,
                  outline: 'none',
                  cursor: 'pointer',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.3)',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginTop: 6,
                  fontFamily: 'Courier New',
                  fontSize: 10,
                  color: '#4A5568',
                  fontWeight: 500,
                }}
              >
                <span>0°</span>
                {criticalAngle !== null && (
                  <span style={{ color: '#FBBF24', fontWeight: 700 }}>
                    临界角: {radToDeg(criticalAngle).toFixed(1)}°
                  </span>
                )}
                <span>89°</span>
              </div>
            </div>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 20,
                padding: '14px 16px',
                background: dispersionMode
                  ? 'linear-gradient(90deg, rgba(239,68,68,0.14), rgba(245,158,11,0.12), rgba(16,185,129,0.12), rgba(59,130,246,0.12), rgba(139,92,246,0.14))'
                  : 'rgba(255,255,255,0.035)',
                borderRadius: 12,
                border: `1px solid ${dispersionMode ? 'rgba(168, 85, 247, 0.35)' : 'rgba(255,255,255,0.06)'}`,
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                boxShadow: dispersionMode ? '0 0 24px rgba(168,85,247,0.15)' : 'none',
              }}
              onClick={() => onDispersionModeChange(!dispersionMode)}
            >
              <div
                style={{
                  width: 44,
                  height: 26,
                  borderRadius: 13,
                  background: dispersionMode
                    ? 'linear-gradient(90deg, #EF4444, #F59E0B, #10B981, #3B82F6, #8B5CF6)'
                    : 'rgba(255,255,255,0.12)',
                  position: 'relative',
                  transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                  boxShadow: dispersionMode
                    ? '0 0 16px rgba(168,85,247,0.5), inset 0 1px 0 rgba(255,255,255,0.25)'
                    : 'inset 0 1px 3px rgba(0,0,0,0.3)',
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: 2,
                    left: dispersionMode ? 20 : 2,
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #FFFFFF 0%, #E2E8F0 100%)',
                    boxShadow:
                      '0 2px 8px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.8)',
                    transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
                  }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontFamily: 'Courier New',
                    fontSize: 13,
                    color: dispersionMode ? '#D6BCFA' : '#8B95A9',
                    fontWeight: dispersionMode ? 700 : 500,
                    transition: 'color 0.3s',
                    letterSpacing: 0.2,
                  }}
                >
                  {dispersionMode ? '🌈 色散模式 · 已开启' : '色散模式'}
                </div>
                <div
                  style={{
                    fontFamily: 'Courier New',
                    fontSize: 10,
                    color: '#4A5568',
                    marginTop: 3,
                    letterSpacing: 0.2,
                  }}
                >
                  柯西色散公式 · 7色光谱分解
                </div>
              </div>
            </div>

            <div
              style={{
                background:
                  'linear-gradient(180deg, rgba(129,140,248,0.06) 0%, rgba(255,255,255,0.025) 100%)',
                borderRadius: 14,
                padding: '14px 16px',
                marginBottom: 16,
                border: '1px solid rgba(129,140,248,0.12)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div
                style={{
                  ...labelStyle,
                  marginBottom: 14,
                  color: '#A5B4FC',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  letterSpacing: 0.3,
                }}
              >
                <span style={{ fontSize: 16 }}>📊</span> 介质信息
              </div>

              <div style={rowStyle}>
                <div style={labelStyle}>光疏介质 n₁</div>
                <div style={valueStyle}>
                  {medium1.name} ({medium1.refractiveIndex.toFixed(2)})
                </div>
              </div>

              <div style={rowStyle}>
                <div style={labelStyle}>光密介质 n₂</div>
                <div style={{ ...valueStyle, color: '#F9A8D4', fontWeight: 600 }}>
                  {medium2.name} ({medium2.refractiveIndex.toFixed(2)})
                </div>
              </div>

              {criticalAngle !== null && (
                <div style={{ ...rowStyle, borderBottom: 'none' }}>
                  <div style={{ ...labelStyle, color: '#FBBF24', fontWeight: 600 }}>⚠ 临界角 θc</div>
                  <div
                    style={{
                      ...valueStyle,
                      color: '#FBBF24',
                      fontWeight: 700,
                      textShadow: '0 0 8px rgba(251, 191, 36, 0.35)',
                    }}
                  >
                    {radToDeg(criticalAngle).toFixed(1)}°
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                background:
                  'linear-gradient(180deg, rgba(52,211,153,0.06) 0%, rgba(255,255,255,0.025) 100%)',
                borderRadius: 14,
                padding: '14px 16px',
                border: '1px solid rgba(52,211,153,0.1)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
              }}
            >
              <div
                style={{
                  ...labelStyle,
                  marginBottom: 14,
                  color: '#6EE7B7',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  letterSpacing: 0.3,
                }}
              >
                <span style={{ fontSize: 16 }}>📐</span> 角度数据
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
                    fontWeight: physics.isTotalReflection ? 700 : 500,
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
                <div style={{ ...valueStyle, color: '#6EE7B7', fontWeight: 600 }}>
                  = {(medium1.refractiveIndex * Math.sin(incidentAngleRad)).toFixed(4)}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 16,
                padding: '13px 16px',
                background:
                  'linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(139, 92, 246, 0.08) 100%)',
                borderRadius: 12,
                border: '1px solid rgba(59, 130, 246, 0.25)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.06)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Courier New',
                  fontSize: 12,
                  color: '#93C5FD',
                  lineHeight: 1.65,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 8,
                }}
              >
                <span style={{ fontSize: 15, marginTop: 1 }}>💡</span>
                <span>
                  拖拽场景左侧的发光圆点光源可改变入射角。<br />
                  当入射角超过临界角时发生全反射！
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
            border-radius: 22px 22px 0 0 !important;
            max-height: 58vh;
            overflow-y: auto;
          }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(145deg, #93C5FD 0%, #3B82F6 60%, #2563EB 100%);
          cursor: grab;
          box-shadow:
            0 0 14px rgba(59, 130, 246, 0.7),
            inset 0 1px 0 rgba(255,255,255,0.45),
            0 3px 8px rgba(0,0,0,0.4);
          transition: transform 0.25s cubic-bezier(0.68, -0.55, 0.27, 1.55), box-shadow 0.2s;
          border: 2px solid rgba(255,255,255,0.22);
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.22);
          box-shadow:
            0 0 22px rgba(59, 130, 246, 0.9),
            inset 0 1px 0 rgba(255,255,255,0.55),
            0 4px 12px rgba(0,0,0,0.45);
          cursor: grabbing;
        }
        input[type="range"]::-webkit-slider-thumb:active {
          transform: scale(0.94);
        }
        input[type="range"]::-moz-range-thumb {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: linear-gradient(145deg, #93C5FD 0%, #3B82F6 60%, #2563EB 100%);
          cursor: grab;
          border: 2px solid rgba(255,255,255,0.22);
          box-shadow: 0 0 14px rgba(59, 130, 246, 0.7);
        }
        select:hover {
          background: rgba(255,255,255,0.1) !important;
          border-color: rgba(99,102,241,0.45) !important;
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(59, 130, 246, 0.18), inset 0 1px 0 rgba(255,255,255,0.08);
        }
        select:focus {
          border-color: rgba(99,102,241,0.65) !important;
          box-shadow: 0 0 0 4px rgba(99,102,241,0.18), inset 0 1px 0 rgba(255,255,255,0.08);
        }
      `}</style>
    </>
  );
}

export default Panel;
