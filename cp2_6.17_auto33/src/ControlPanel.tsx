import { useStore, ColorTheme } from './store'

const themeLabels: Record<ColorTheme, string> = {
  nebula: '星云蓝紫',
  aurora: '极光绿蓝',
  lava: '熔岩红橙',
}

const themeColors: Record<ColorTheme, string[]> = {
  nebula: ['#4B6CB7', '#9B59B6', '#F39C12'],
  aurora: ['#1ABC9C', '#3498DB', '#00D4AA'],
  lava: ['#E74C3C', '#E67E22', '#F39C12'],
}

function ControlPanel() {
  const { particleCount, colorTheme, setParticleCount, setColorTheme, resetView } = useStore()

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 24,
        right: 24,
        padding: 20,
        borderRadius: 12,
        backgroundColor: 'rgba(26, 27, 65, 0.85)',
        backdropFilter: 'blur(10px)',
        color: 'white',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        fontSize: 14,
        minWidth: 280,
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        zIndex: 1000,
      }}
    >
      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 8,
            letterSpacing: 0.5,
          }}
        >
          粒子数量
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <input
            type="range"
            min={1000}
            max={5000}
            step={100}
            value={particleCount}
            onChange={(e) => setParticleCount(Number(e.target.value))}
            style={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              background: 'rgba(255, 255, 255, 0.2)',
              appearance: 'none',
              cursor: 'pointer',
            }}
          />
          <span
            style={{
              minWidth: 48,
              textAlign: 'right',
              fontVariantNumeric: 'tabular-nums',
              fontWeight: 600,
            }}
          >
            {particleCount}
          </span>
        </div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: 'rgba(255, 255, 255, 0.7)',
            marginBottom: 8,
            letterSpacing: 0.5,
          }}
        >
          颜色主题
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(Object.keys(themeLabels) as ColorTheme[]).map((theme) => (
            <button
              key={theme}
              onClick={() => setColorTheme(theme)}
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: 8,
                border: colorTheme === theme 
                  ? '2px solid rgba(255, 255, 255, 0.5)' 
                  : '2px solid transparent',
                backgroundColor: colorTheme === theme 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(255, 255, 255, 0.05)',
                color: 'white',
                fontSize: 12,
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = colorTheme === theme 
                  ? 'rgba(255, 255, 255, 0.1)' 
                  : 'rgba(255, 255, 255, 0.05)'
              }}
            >
              <div style={{ display: 'flex', gap: 3 }}>
                {themeColors[theme].map((color, i) => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      backgroundColor: color,
                    }}
                  />
                ))}
              </div>
              <span>{themeLabels[theme]}</span>
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={resetView}
        style={{
          width: '100%',
          padding: '12px 16px',
          borderRadius: 8,
          border: 'none',
          backgroundColor: 'rgba(75, 108, 183, 0.8)',
          color: 'white',
          fontSize: 13,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(75, 108, 183, 1)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = 'rgba(75, 108, 183, 0.8)'
        }}
      >
        重置视角
      </button>

      <div
        style={{
          marginTop: 16,
          paddingTop: 16,
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          fontSize: 11,
          color: 'rgba(255, 255, 255, 0.5)',
          lineHeight: 1.6,
        }}
      >
        <div>移动鼠标：吹散星云</div>
        <div>点击画布：超新星爆发</div>
      </div>
    </div>
  )
}

export default ControlPanel
