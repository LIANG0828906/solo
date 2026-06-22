import React, { useState, useEffect } from 'react'
import Scene from './scene'
import { LeftPanel, RightPanel, LoadingHexagon } from './ui'
import { useAppStore } from './store'
import { Point3D } from './utils'

const App: React.FC = () => {
  const isProcessing = useAppStore(state => state.isProcessing)
  const [leftPanelOpen, setLeftPanelOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [focusTarget, setFocusTarget] = useState<[number, number, number] | null>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handlePointClick = (coord: Point3D) => {
    setFocusTarget([coord.x, coord.y, coord.z])
  }

  const handleFocusComplete = () => {
    setFocusTarget(null)
  }

  return (
    <div className="app-container">
      <button
        className="hamburger-btn"
        onClick={() => setLeftPanelOpen(!leftPanelOpen)}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="3" y1="6" x2="21" y2="6" />
          <line x1="3" y1="12" x2="21" y2="12" />
          <line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      <div className={`left-panel ${leftPanelOpen ? 'open' : ''}`}>
        <LeftPanel />
      </div>

      <div className="scene-container">
        <Scene focusTarget={focusTarget} onFocusComplete={handleFocusComplete} />

        {isProcessing && (
          <div className="loading-overlay">
            <div style={{ textAlign: 'center' }}>
              <LoadingHexagon />
              <div style={{ marginTop: '16px', color: '#00D4FF', fontSize: '14px' }}>
                数据处理中...
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="right-panel" style={{ display: 'flex', flexDirection: 'column' }}>
        <RightPanel onPointClick={handlePointClick} />
      </div>
    </div>
  )
}

export default App
