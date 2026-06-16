import React from 'react';
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

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 320,
    background: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 16,
    padding: collapsed ? '12px 16px' : '16px 20px',
    color: '#E0E0E0',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'all 0.3s cubic-bezier(0.68, -0.55, 0.27, 1.55)',
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
    transition: 'transform 0.3s ease',
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

  const selectStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    background: 'rgba(255,255,255,0.08)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    color: '#E0E0E0',
    fontFamily: 'Courier New',
    fontSize: 14,
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s ease',
  };

  const sliderStyle: React.CSSProperties = {
    width: '100%',
    height: 6,
    borderRadius: 3,
    background: 'rgba(255,255,255,0.1)',
    outline: 'none',
    cursor: 'pointer',
    appearance: 'none',
    WebkitAppearance: 'none',
  };

  const checkboxStyle: React.CSSProperties = {
    width: 18,
    height: 18,
    cursor: 'pointer',
    accentColor: '#3B82F6',
  };

  return (
    <>
      <div style={panelStyle}>
        <div style={headerStyle} onClick={onToggleCollapse}>
          <div style={{ fontSize: 16, fontWeight: 600, color: '#ffffff' }}>
            光学控制面板
          </div>
          <span style={arrowStyle}>▼</span>
        </div>

        {!collapsed && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>介质组合</div>
              <select
                style={selectStyle}
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

            <div style={{ marginBottom: 16 }}>
              <div style={labelStyle}>入射角 θ₁ ({incidentAngle.toFixed(1)}°)</div>
              <input
                type="range"
                min="0"
                max="89"
                step="0.5"
                value={incidentAngle}
                onChange={(e) => onAngleChange(parseFloat(e.target.value))}
                style={sliderStyle}
              />
            </div>

            <div style={{ ...rowStyle, display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <label style={{ ...labelStyle, marginBottom: 0, flex: 1, cursor: 'pointer' }}>
                色散模式
              </label>
              <input
                type="checkbox"
                checked={dispersionMode}
                onChange={(e) => onDispersionModeChange(e.target.checked)}
                style={checkboxStyle}
              />
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                padding: 14,
                marginBottom: 14,
              }}
            >
              <div style={{ ...labelStyle, marginBottom: 10, color: '#818CF8', fontWeight: 600 }}>
                介质信息
              </div>

              <div style={rowStyle}>
                <div style={labelStyle}>光疏介质</div>
                <div style={valueStyle}>
                  {medium1.name} (n₁ = {medium1.refractiveIndex.toFixed(2)})
                </div>
              </div>

              <div style={rowStyle}>
                <div style={labelStyle}>光密介质</div>
                <div style={valueStyle}>
                  {medium2.name} (n₂ = {medium2.refractiveIndex.toFixed(2)})
                </div>
              </div>

              {criticalAngle !== null && (
                <div style={rowStyle}>
                  <div style={labelStyle}>临界角</div>
                  <div style={{ ...valueStyle, color: '#FBBF24' }}>
                    {radToDeg(criticalAngle).toFixed(1)}°
                  </div>
                </div>
              )}
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div style={{ ...labelStyle, marginBottom: 10, color: '#34D399', fontWeight: 600 }}>
                角度数据
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
                <div style={{ ...valueStyle, color: physics.isTotalReflection ? '#FBBF24' : '#F87171' }}>
                  {physics.isTotalReflection
                    ? '全反射'
                    : physics.refractionAngle !== null
                    ? `${radToDeg(physics.refractionAngle).toFixed(1)}°`
                    : '-'}
                </div>
              </div>

              <div style={rowStyle}>
                <div style={labelStyle}>斯涅尔定律</div>
                <div style={valueStyle}>
                  n₁sinθ₁ = {(medium1.refractiveIndex * Math.sin(incidentAngleRad)).toFixed(3)}
                </div>
              </div>
            </div>

            <div
              style={{
                marginTop: 14,
                padding: '10px 14px',
                background: 'rgba(59, 130, 246, 0.1)',
                borderRadius: 8,
                border: '1px solid rgba(59, 130, 246, 0.2)',
              }}
            >
              <div
                style={{
                  fontFamily: 'Courier New',
                  fontSize: 12,
                  color: '#93C5FD',
                  lineHeight: 1.5,
                }}
              >
                💡 提示：拖拽场景左侧的光源点可以改变入射角
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
            border-radius: 16px 16px 0 0 !important;
          }
        }
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
          transition: transform 0.2s cubic-bezier(0.68, -0.55, 0.27, 1.55);
        }
        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
        input[type="range"]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #3B82F6;
          cursor: pointer;
          border: none;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }
        select:hover {
          background: rgba(255,255,255,0.12) !important;
          border-color: rgba(59, 130, 246, 0.4) !important;
        }
      `}</style>
    </>
  );
}

export default Panel;
