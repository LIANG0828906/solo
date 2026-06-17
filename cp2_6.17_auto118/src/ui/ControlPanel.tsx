import { useStore, ColorTheme, colorPalettes } from '../store/useStore'

const themes: { id: ColorTheme; name: string; color: string }[] = [
  { id: 'aurora', name: '极光', color: '#00FF87' },
  { id: 'flame', name: '火焰', color: '#FF6B6B' },
  { id: 'ocean', name: '海洋', color: '#60EFFF' }
]

export default function ControlPanel() {
  const particleCount = useStore((state) => state.particleCount)
  const setParticleCount = useStore((state) => state.setParticleCount)
  const flowSpeed = useStore((state) => state.flowSpeed)
  const setFlowSpeed = useStore((state) => state.setFlowSpeed)
  const forceFieldStrength = useStore((state) => state.forceFieldStrength)
  const setForceFieldStrength = useStore((state) => state.setForceFieldStrength)
  const colorTheme = useStore((state) => state.colorTheme)
  const setColorTheme = useStore((state) => state.setColorTheme)

  return (
    <div
      style={{
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
        userSelect: 'none'
      }}
    >
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
          <span style={{ color: '#00FF87', fontWeight: 500 }}>{particleCount}</span>
        </div>
        <input
          type="range"
          min={1000}
          max={10000}
          step={500}
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
            cursor: 'pointer'
          }}
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: 6,
            color: 'rgba(255,255,255,0.7)'
          }}
        >
          <span>流动速度</span>
          <span style={{ color: '#60EFFF', fontWeight: 500 }}>{flowSpeed.toFixed(1)}</span>
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
          <span style={{ color: '#D4A5FF', fontWeight: 500 }}>{forceFieldStrength}</span>
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
          {themes.map((theme) => (
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
                background: colorTheme === theme.id
                  ? `radial-gradient(circle, ${theme.color}66 0%, ${theme.color}22 100%)`
                  : 'transparent',
                boxShadow: colorTheme === theme.id
                  ? `0 0 15px ${theme.color}66`
                  : 'none',
                transition: 'all 0.2s ease-out',
                animation: colorTheme === theme.id ? 'pulse 2s ease-in-out infinite' : 'none'
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
                  border: colorTheme === theme.id ? `2px solid ${theme.color}` : '2px solid transparent',
                  transition: 'border-color 0.2s ease-out',
                  boxSizing: 'border-box'
                }}
              />
            </button>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.7; transform: scale(1.05); }
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
    </div>
  )
}
