import { useState } from 'react'
import { useStore, ColorTheme, colorPalettes } from '../store/useStore'

const themes: { id: ColorTheme; name: string; color: string }[] = [
  { id: 'aurora', name: '极光', color: '#00FF87' },
  { id: 'flame', name: '火焰', color: '#FF4500' },
  { id: 'ocean', name: '海洋', color: '#00BFFF' }
]

const particleTicks = [1000, 3000, 5000, 7000, 10000]
const PARTICLE_MIN = 1000
const PARTICLE_MAX = 10000

export default function ControlPanel() {
  const [isMinimized, setIsMinimized] = useState(false)

  const particleCount = useStore((state) => state.particleCount)
  const setParticleCount = useStore((state) => state.setParticleCount)
  const flowSpeed = useStore((state) => state.flowSpeed)
  const setFlowSpeed = useStore((state) => state.setFlowSpeed)
  const forceFieldStrength = useStore((state) => state.forceFieldStrength)
  const setForceFieldStrength = useStore((state) => state.setForceFieldStrength)
  const colorTheme = useStore((state) => state.colorTheme)
  const setColorTheme = useStore((state) => state.setColorTheme)

  const tickPercentages = particleTicks.map(
    (t) => ((t - PARTICLE_MIN) / (PARTICLE_MAX - PARTICLE_MIN)) * 100
  )

  const panelStyle: React.CSSProperties = isMinimized
    ? {
        position: 'fixed',
        top: 20,
        right: 20,
        width: 20,
        height: 20,
        borderRadius: '50%',
        background: 'rgba(15, 15, 35, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.15)',
        cursor: 'pointer',
        zIndex: 1000,
        transition: 'all 0.3s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.4)'
      }
    : {
        position: 'fixed',
        top: 20,
        right: 20,
        width: 220,
        padding: 20,
        background: 'rgba(15, 15, 35, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 12,
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 13,
        zIndex: 1000,
        userSelect: 'none',
        transition: 'all 0.3s ease-in-out',
        overflow: 'hidden'
      }

  return (
    <div style={panelStyle} onClick={isMinimized ? () => setIsMinimized(false) : undefined}>
      {isMinimized ? (
        <svg
          width="10"
          height="10"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"
            fill="url(#starGrad)"
          />
          <defs>
            <linearGradient id="starGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#00FF87" />
              <stop offset="100%" stopColor="#60EFFF" />
            </linearGradient>
          </defs>
        </svg>
      ) : (
        <>
          <button
            onClick={(e) => {
              e.stopPropagation()
              setIsMinimized(true)
            }}
            style={{
              position: 'absolute',
              top: 12,
              right: 12,
              width: 20,
              height: 20,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 14,
              lineHeight: 1,
              transition: 'all 0.2s ease-out',
              padding: 0
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.15)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.8)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            }}
            title="最小化"
          >
            ×
          </button>

          <h3
            style={{
              margin: 0,
              marginBottom: 16,
              fontSize: 16,
              fontWeight: 600,
              background: 'linear-gradient(90deg, #00FF87, #60EFFF)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            AuroraWave
          </h3>

          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                color: 'rgba(255,255,255,0.7)'
              }}
            >
              <span>粒子数量</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {particleCount}颗
              </span>
            </div>
            <div style={{ position: 'relative', paddingTop: 2, paddingBottom: 8 }}>
              <input
                type="range"
                min={PARTICLE_MIN}
                max={PARTICLE_MAX}
                step={100}
                value={particleCount}
                onChange={(e) => setParticleCount(Number(e.target.value))}
                style={{
                  width: '100%',
                  height: 4,
                  borderRadius: 2,
                  background: '#3D3D5C',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                  margin: 0
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  top: 2,
                  left: 0,
                  right: 0,
                  height: 4,
                  pointerEvents: 'none'
                }}
              >
                {tickPercentages.map((pct, i) => (
                  <div
                    key={particleTicks[i]}
                    style={{
                      position: 'absolute',
                      left: `${pct}%`,
                      top: -1,
                      width: 1,
                      height: 6,
                      background:
                        particleTicks[i] <= particleCount
                          ? 'rgba(0, 255, 135, 0.6)'
                          : 'rgba(255, 255, 255, 0.25)',
                      transform: 'translateX(-0.5px)'
                    }}
                  />
                ))}
              </div>
              <div
                style={{
                  position: 'absolute',
                  bottom: -4,
                  left: 0,
                  right: 0,
                  display: 'flex',
                  justifyContent: 'space-between',
                  pointerEvents: 'none',
                  fontSize: 9,
                  color: 'rgba(255,255,255,0.35)'
                }}
              >
                {particleTicks.map((tick) => (
                  <span key={tick} style={{ transform: 'translateX(-50%)' }}>
                    {tick >= 1000 ? `${tick / 1000}k` : tick}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 16, marginTop: 12 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                color: 'rgba(255,255,255,0.7)'
              }}
            >
              <span>流动速度</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {flowSpeed.toFixed(1)}单位/秒
              </span>
            </div>
            <input
              type="range"
              min={0.1}
              max={2}
              step={0.1}
              value={flowSpeed}
              onChange={(e) => setFlowSpeed(Number(e.target.value))}
              style={{
                width: '100%',
                height: 4,
                borderRadius: 2,
                background: '#3D3D5C',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 6,
                color: 'rgba(255,255,255,0.7)'
              }}
            >
              <span>力场强度</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>
                {forceFieldStrength}
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              step={1}
              value={forceFieldStrength}
              onChange={(e) => setForceFieldStrength(Number(e.target.value))}
              style={{
                width: '100%',
                height: 4,
                borderRadius: 2,
                background: '#3D3D5C',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                cursor: 'pointer'
              }}
            />
          </div>

          <div>
            <div style={{ marginBottom: 10, color: 'rgba(255,255,255,0.7)' }}>颜色主题</div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              {themes.map((theme) => {
                const isSelected = colorTheme === theme.id
                return (
                  <button
                    key={theme.id}
                    onClick={() => setColorTheme(theme.id)}
                    title={theme.name}
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 0,
                      position: 'relative',
                      background: isSelected
                        ? `radial-gradient(circle, ${theme.color}66 0%, ${theme.color}22 100%)`
                        : `radial-gradient(circle, ${theme.color}22 0%, transparent 100%)`,
                      boxShadow: isSelected ? `0 0 15px ${theme.color}66` : 'none',
                      transition: 'all 0.2s ease-out',
                      animation: isSelected ? 'pulse 2s ease-in-out infinite' : 'none',
                      opacity: isSelected ? 1 : 0.3
                    }}
                  >
                    <div
                      style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        background: `linear-gradient(135deg, ${colorPalettes[theme.id].join(', ')})`,
                        margin: 'auto',
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        border: isSelected ? `2px solid ${theme.color}` : '2px solid transparent',
                        transition: 'border-color 0.2s ease-out',
                        boxSizing: 'border-box'
                      }}
                    />
                  </button>
                )
              })}
            </div>
          </div>

          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.85; transform: scale(1.05); }
            }
            
            input[type="range"]::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: #00FF87;
              cursor: pointer;
              box-shadow: 0 0 8px rgba(0, 255, 135, 0.5);
              transition: box-shadow 0.2s;
              position: relative;
              z-index: 2;
            }
            
            input[type="range"]::-webkit-slider-thumb:hover {
              box-shadow: 0 0 12px rgba(0, 255, 135, 0.8);
            }
            
            input[type="range"]::-moz-range-thumb {
              width: 14px;
              height: 14px;
              border-radius: 50%;
              background: #00FF87;
              cursor: pointer;
              border: none;
              box-shadow: 0 0 8px rgba(0, 255, 135, 0.5);
            }
          `}</style>
        </>
      )}
    </div>
  )
}
