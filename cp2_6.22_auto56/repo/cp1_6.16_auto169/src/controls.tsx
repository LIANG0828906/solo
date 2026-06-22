import React from 'react'
import { useSculptureStore, ColorTheme, THEME_COLORS } from './store'

const panelStyle: React.CSSProperties = {
  position: 'fixed',
  top: '20px',
  right: '20px',
  width: '280px',
  background: 'rgba(30, 30, 30, 0.85)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  borderRadius: '12px',
  padding: '20px',
  color: '#E0E0E0',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.5), inset 0 0 0 1px rgba(24, 255, 255, 0.15)',
  zIndex: 1000,
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
}

const sectionStyle: React.CSSProperties = {
  marginBottom: '20px'
}

const labelStyle: React.CSSProperties = {
  fontSize: '12px',
  fontWeight: 600,
  marginBottom: '8px',
  letterSpacing: '0.5px',
  textTransform: 'uppercase',
  color: '#18FFFF',
  display: 'block'
}

const sliderContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px'
}

const sliderStyle: React.CSSProperties = {
  flex: 1,
  height: '4px',
  appearance: 'none',
  background: 'linear-gradient(to right, #18FFFF, #7C4DFF)',
  borderRadius: '2px',
  outline: 'none',
  cursor: 'pointer',
  accentColor: '#18FFFF'
}

const valueBadgeStyle: React.CSSProperties = {
  background: 'rgba(24, 255, 255, 0.15)',
  border: '1px solid rgba(24, 255, 255, 0.4)',
  color: '#18FFFF',
  padding: '4px 10px',
  borderRadius: '6px',
  fontSize: '12px',
  fontWeight: 600,
  minWidth: '48px',
  textAlign: 'center' as const
}

const themeButtonsContainer: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: '8px'
}

const getThemeButtonStyle = (isActive: boolean, primaryColor: string): React.CSSProperties => ({
  padding: '10px 8px',
  borderRadius: '8px',
  border: isActive ? `2px solid ${primaryColor}` : '1px solid rgba(255,255,255,0.1)',
  background: isActive ? `${primaryColor}22` : 'rgba(255,255,255,0.03)',
  color: isActive ? primaryColor : '#E0E0E0',
  fontSize: '12px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none'
})

const buttonRowStyle: React.CSSProperties = {
  display: 'flex',
  gap: '8px'
}

const resetButtonStyle: React.CSSProperties = {
  flex: 1,
  padding: '10px 16px',
  borderRadius: '8px',
  border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#E0E0E0',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none'
}

const getFreezeButtonStyle = (isFrozen: boolean): React.CSSProperties => ({
  flex: 1,
  padding: '10px 16px',
  borderRadius: '8px',
  border: isFrozen ? '2px solid #18FFFF' : '1px solid rgba(255,255,255,0.1)',
  background: isFrozen ? 'rgba(24, 255, 255, 0.2)' : 'rgba(255,255,255,0.05)',
  color: isFrozen ? '#18FFFF' : '#E0E0E0',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
  outline: 'none'
})

const titleStyle: React.CSSProperties = {
  fontSize: '16px',
  fontWeight: 700,
  marginBottom: '16px',
  color: '#FFFFFF',
  display: 'flex',
  alignItems: 'center',
  gap: '8px'
}

const titleDotStyle: React.CSSProperties = {
  width: '8px',
  height: '8px',
  borderRadius: '50%',
  background: '#18FFFF',
  boxShadow: '0 0 8px #18FFFF'
}

export const Controls: React.FC = () => {
  const {
    particleCount,
    colorTheme,
    isFrozen,
    setParticleCount,
    setColorTheme,
    toggleFrozen,
    triggerReset
  } = useSculptureStore()

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10)
    setParticleCount(val)
  }

  return (
    <div style={panelStyle}>
      <div style={titleStyle}>
        <span style={titleDotStyle}></span>
        粒子雕塑控制台
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>粒子数量</label>
        <div style={sliderContainerStyle}>
          <input
            type="range"
            min={500}
            max={5000}
            step={100}
            value={particleCount}
            onChange={handleSliderChange}
            style={sliderStyle}
          />
          <span style={valueBadgeStyle}>{particleCount}</span>
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>颜色主题</label>
        <div style={themeButtonsContainer}>
          {(Object.keys(THEME_COLORS) as ColorTheme[]).map(themeKey => {
            const theme = THEME_COLORS[themeKey]
            const isActive = colorTheme === themeKey
            return (
              <button
                key={themeKey}
                onClick={() => setColorTheme(themeKey)}
                style={getThemeButtonStyle(isActive, theme.primary)}
                onMouseEnter={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = theme.primary + '88'
                    e.currentTarget.style.color = theme.primary
                  }
                }}
                onMouseLeave={e => {
                  if (!isActive) {
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
                    e.currentTarget.style.color = '#E0E0E0'
                  }
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  <span style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: theme.primary,
                    boxShadow: `0 0 6px ${theme.primary}`
                  }}></span>
                  {theme.name}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div style={sectionStyle}>
        <label style={labelStyle}>操作</label>
        <div style={buttonRowStyle}>
          <button
            onClick={triggerReset}
            style={resetButtonStyle}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#18FFFF'
              e.currentTarget.style.color = '#000000'
              e.currentTarget.style.borderColor = '#18FFFF'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              e.currentTarget.style.color = '#E0E0E0'
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
            }}
          >
            重置
          </button>
          <button
            onClick={toggleFrozen}
            style={getFreezeButtonStyle(isFrozen)}
            onMouseEnter={e => {
              e.currentTarget.style.background = '#18FFFF'
              e.currentTarget.style.color = '#FFFFFF'
              e.currentTarget.style.borderColor = '#18FFFF'
            }}
            onMouseLeave={e => {
              if (!isFrozen) {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                e.currentTarget.style.color = '#E0E0E0'
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'
              } else {
                e.currentTarget.style.background = 'rgba(24, 255, 255, 0.2)'
                e.currentTarget.style.color = '#18FFFF'
                e.currentTarget.style.borderColor = '#18FFFF'
              }
            }}
          >
            {isFrozen ? '解冻' : '冻结'}
          </button>
        </div>
      </div>

      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'rgba(24, 255, 255, 0.05)',
        borderRadius: '8px',
        border: '1px solid rgba(24, 255, 255, 0.1)',
        fontSize: '11px',
        lineHeight: 1.6,
        color: 'rgba(224, 224, 224, 0.7)'
      }}>
        <div style={{ color: '#18FFFF', fontWeight: 600, marginBottom: '6px' }}>手势提示</div>
        <div>· 拇指+食指捏合：选取粒子群</div>
        <div>· 保持捏合拖拽：移动粒子群</div>
        <div>· 双手捏合拉伸：缩放粒子群</div>
      </div>
    </div>
  )
}

export default Controls
