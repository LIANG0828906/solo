import { useRef, useCallback } from 'react'
import { motion } from 'framer-motion'
import Scene from './components/Scene'
import ControlPanel from './components/ControlPanel'

function App() {
  const canvasContainerRef = useRef<HTMLDivElement>(null)

  const handleScreenshot = useCallback(() => {
    const canvas = document.querySelector('canvas')
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `vintage-speaker-${Date.now()}.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
  }, [])

  return (
    <div style={appStyle}>
      <ControlPanel />

      <div ref={canvasContainerRef} style={sceneContainerStyle}>
        <Scene />
      </div>

      <motion.button
        style={screenshotButtonStyle}
        onClick={handleScreenshot}
        whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 107, 53, 0.9)' }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 20, duration: 0.15 }}
      >
        <svg
          style={iconStyle}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </svg>
        <span style={buttonTextStyle}>截图分享</span>
      </motion.button>

      <div style={infoOverlayStyle}>
        <p style={infoTextStyle}>拖拽旋转 · 滚轮缩放</p>
      </div>
    </div>
  )
}

const appStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  position: 'relative',
  overflow: 'hidden',
}

const sceneContainerStyle: React.CSSProperties = {
  position: 'absolute',
  left: 280,
  top: 0,
  right: 0,
  bottom: 0,
  width: 'calc(100% - 280px)',
  height: '100%',
}

const screenshotButtonStyle: React.CSSProperties = {
  position: 'fixed',
  top: 24,
  right: 24,
  zIndex: 200,
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '12px 20px',
  backgroundColor: '#FF6B35',
  color: '#FFFFFF',
  borderRadius: 8,
  fontSize: 14,
  fontWeight: 600,
  boxShadow: '0 4px 20px rgba(255, 107, 53, 0.4)',
}

const iconStyle: React.CSSProperties = {
  width: 18,
  height: 18,
}

const buttonTextStyle: React.CSSProperties = {
  fontSize: 14,
  fontWeight: 600,
}

const infoOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  bottom: 24,
  right: 24,
  zIndex: 100,
  pointerEvents: 'none',
}

const infoTextStyle: React.CSSProperties = {
  fontSize: 13,
  color: 'rgba(192, 192, 192, 0.6)',
}

export default App
