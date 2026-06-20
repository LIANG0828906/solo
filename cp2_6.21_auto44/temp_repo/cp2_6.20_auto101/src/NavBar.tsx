import React from 'react'
import { useAppStore } from './store'

const NavBar: React.FC = () => {
  const { resetCombo, saveCombo, shareCombo, playback: { isPlaying } } = useAppStore()

  const buttonStyle: React.CSSProperties = {
    padding: '8px 20px',
    fontSize: 13,
    fontWeight: 500,
    backgroundColor: 'transparent',
    color: '#ffffff',
    border: '1px solid rgba(233, 69, 96, 0.5)',
    borderRadius: 4,
    cursor: isPlaying ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    opacity: isPlaying ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    gap: 6,
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isPlaying) {
      e.currentTarget.style.backgroundColor = '#e94560'
      e.currentTarget.style.color = '#ffffff'
      e.currentTarget.style.borderColor = '#e94560'
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!isPlaying) {
      e.currentTarget.style.backgroundColor = 'transparent'
      e.currentTarget.style.color = '#ffffff'
      e.currentTarget.style.borderColor = 'rgba(233, 69, 96, 0.5)'
    }
  }

  return (
    <nav
      style={{
        height: 60,
        backgroundColor: '#16213e',
        borderBottom: '0.5px solid #e94560',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 24px',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <span style={{ fontSize: 28 }}>⚔️</span>
        <h1
          style={{
            fontSize: 20,
            fontWeight: 700,
            fontFamily: "'Cinzel', serif",
            color: '#e94560',
            letterSpacing: 1,
          }}
        >
          技能连招编辑器
        </h1>
      </div>

      <div style={{ display: 'flex', gap: 12 }}>
        <button
          onClick={() => !isPlaying && resetCombo()}
          disabled={isPlaying}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span>🔄</span>
          <span>重置</span>
        </button>
        <button
          onClick={() => !isPlaying && saveCombo()}
          disabled={isPlaying}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span>💾</span>
          <span>保存</span>
        </button>
        <button
          onClick={() => !isPlaying && shareCombo()}
          disabled={isPlaying}
          style={buttonStyle}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <span>🔗</span>
          <span>分享</span>
        </button>
      </div>
    </nav>
  )
}

export default NavBar
