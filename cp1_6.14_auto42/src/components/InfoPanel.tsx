import React from 'react';
import { useStarContext } from '../context/StarContext';

const InfoPanel: React.FC = () => {
  const {
    selectedBody,
    setSelectedBody,
    showOrbits,
    setShowOrbits,
    showAtmosphere,
    setShowAtmosphere,
  } = useStarContext();

  const isEmpty = selectedBody === null;

  const formatTemp = (t: number) => {
    if (t >= 1000) {
      return (t / 1000).toFixed(1) + ',000 K';
    }
    return t.toLocaleString() + ' K';
  };

  const bodyColor = selectedBody
    ? selectedBody.type === 'star'
      ? selectedBody.data.color
      : selectedBody.data.color
    : '#00d4ff';

  const hasAtmosphere = selectedBody?.type === 'planet' && selectedBody.data.hasAtmosphere;

  return (
    <aside className={`info-panel ${isEmpty ? 'empty' : ''}`}>
      {selectedBody && (
        <>
          <div className="info-panel-header">
            <div className="info-panel-body-type">
              {selectedBody.type === 'star' ? '恒星数据' : '行星档案'}
            </div>
            <div
              className="info-panel-body-name"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  background: bodyColor,
                  boxShadow: `0 0 12px ${bodyColor}, 0 0 24px ${bodyColor}55`,
                  flexShrink: 0,
                }}
              />
              {selectedBody.type === 'star'
                ? selectedBody.data.name
                : selectedBody.data.name}
            </div>
            {selectedBody.type === 'planet' && (
              <div className="info-panel-body-parent">
                隶属系统：<span>{selectedBody.parentStar.name}</span>
              </div>
            )}
          </div>

          {selectedBody.type === 'star' ? (
            <>
              <div className="info-panel-section">
                <div className="info-panel-section-title">基本参数</div>
                <div className="info-panel-param-row">
                  <span className="info-panel-param-label">光谱类型</span>
                  <span className="info-panel-param-value">{selectedBody.data.starType}</span>
                </div>
                <div className="info-panel-param-row">
                  <span className="info-panel-param-label">表面温度</span>
                  <span className="info-panel-param-value">
                    {selectedBody.data.temperature.toLocaleString()} K
                  </span>
                </div>
                <div className="info-panel-param-row">
                  <span className="info-panel-param-label">质量 (M☉)</span>
                  <span className="info-panel-param-value">
                    {selectedBody.data.mass.toFixed(3)}
                  </span>
                </div>
                <div className="info-panel-param-row">
                  <span className="info-panel-param-label">光度 (L☉)</span>
                  <span className="info-panel-param-value">
                    {selectedBody.data.luminosity.toLocaleString()}
                  </span>
                </div>
                <div className="info-panel-param-row">
                  <span className="info-panel-param-label">行星数量</span>
                  <span className="info-panel-param-value">
                    {selectedBody.data.planets.length} 颗
                  </span>
                </div>
                <div className="info-panel-param-row">
                  <span className="info-panel-param-label">坐标</span>
                  <span className="info-panel-param-value">
                    [{selectedBody.data.coordinates.x.toFixed(1)},{' '}
                    {selectedBody.data.coordinates.y.toFixed(1)},{' '}
                    {selectedBody.data.coordinates.z.toFixed(1)}]
                  </span>
                </div>
              </div>

              <div className="info-panel-section">
                <div className="info-panel-section-title">色指数</div>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: 8,
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: `radial-gradient(circle, ${selectedBody.data.color} 0%, ${selectedBody.data.color}88 60%, transparent 100%)`,
                      boxShadow: `0 0 20px ${selectedBody.data.color}`,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 12,
                        color: 'var(--color-text-secondary)',
                        marginBottom: 4,
                      }}
                    >
                      恒星颜色
                    </div>
                    <div
                      style={{
                        fontFamily: "'Courier New', monospace",
                        fontSize: 13,
                        color: 'var(--color-neon-cyan)',
                        fontWeight: 600,
                      }}
                    >
                      {selectedBody.data.color.toUpperCase()}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="info-panel-section">
                <div className="info-panel-section-title">基本参数</div>
                <div className="info-panel-param-row">
                  <span className="info-panel-param-label">行星类型</span>
                  <span className="info-panel-param-value">{selectedBody.data.type}</span>
                </div>
                <div className="info-panel-param-row">
                  <span className="info-panel-param-label">半径 (R⊕)</span>
                  <span className="info-panel-param-value">
                    {selectedBody.data.radius.toFixed(2)}
                  </span>
                </div>
                <div className="info-panel-param-row">
                  <span className="info-panel-param-label">轨道半径</span>
                  <span className="info-panel-param-value">
                    {selectedBody.data.orbitRadius.toFixed(1)} AU
                  </span>
                </div>
                <div className="info-panel-param-row">
                  <span className="info-panel-param-label">卫星数量</span>
                  <span className="info-panel-param-value">
                    {selectedBody.data.moons} 颗
                  </span>
                </div>
                <div className="info-panel-param-row">
                  <span className="info-panel-param-label">大气圈</span>
                  <span className="info-panel-param-value">
                    {selectedBody.data.hasAtmosphere ? '存在' : '无'}
                  </span>
                </div>
              </div>

              <div className="info-panel-section">
                <div className="info-panel-section-title">殖民评估</div>
                <div
                  className={`info-panel-badge ${
                    selectedBody.data.habitable ? 'habitable' : 'not-habitable'
                  }`}
                  style={{ marginBottom: 10 }}
                >
                  <span className="info-panel-badge-dot" />
                  {selectedBody.data.habitable ? '宜居 · 推荐殖民' : '不宜居 · 环境恶劣'}
                </div>
                {selectedBody.data.habitable && (
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--color-text-secondary)',
                      lineHeight: 1.6,
                      padding: '8px 12px',
                      background: 'rgba(34,197,94,0.05)',
                      borderRadius: 6,
                      borderLeft: '2px solid #4ade80',
                    }}
                  >
                    ⚡ 宜居带内 · 温度适宜 · 建议派遣科考队进行大气采样和地质分析
                  </div>
                )}
              </div>
            </>
          )}

          <div className="info-panel-section">
            <div className="info-panel-section-title">星体描述</div>
            <div className="info-panel-description">
              {selectedBody.type === 'star'
                ? selectedBody.data.description
                : selectedBody.data.description}
            </div>
          </div>

          <div className="info-panel-section">
            <div className="info-panel-section-title">视觉特效</div>
            <div className="info-panel-toggles">
              <button
                className="toggle-btn"
                onClick={() => setShowOrbits(!showOrbits)}
              >
                <span className="toggle-btn-label">
                  <span className="toggle-btn-icon">🪐</span>
                  <span>显示轨道网络</span>
                </span>
                <div className={`toggle-switch ${showOrbits ? 'active' : ''}`}>
                  <div className="toggle-switch-knob" />
                </div>
              </button>

              <button
                className="toggle-btn"
                onClick={() => setShowAtmosphere(!showAtmosphere)}
                disabled={!hasAtmosphere && selectedBody.type === 'planet'}
                style={{
                  opacity:
                    !hasAtmosphere && selectedBody.type === 'planet' ? 0.4 : 1,
                  cursor:
                    !hasAtmosphere && selectedBody.type === 'planet'
                      ? 'not-allowed'
                      : 'pointer',
                }}
                title={
                  !hasAtmosphere && selectedBody.type === 'planet'
                    ? '该行星无大气层'
                    : ''
                }
              >
                <span className="toggle-btn-label">
                  <span className="toggle-btn-icon">🌫️</span>
                  <span>大气辉光效果</span>
                </span>
                <div
                  className={`toggle-switch ${showAtmosphere ? 'active' : ''}`}
                >
                  <div className="toggle-switch-knob" />
                </div>
              </button>
            </div>
          </div>

          <button
            onClick={() => setSelectedBody(null)}
            style={{
              width: '100%',
              marginTop: 4,
              padding: '10px 16px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 8,
              color: 'var(--color-text-muted)',
              fontSize: 12,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = 'var(--color-text-muted)';
            }}
          >
            ✕ 取消选中 · 自由视角
          </button>
        </>
      )}
    </aside>
  );
};

export default InfoPanel;
