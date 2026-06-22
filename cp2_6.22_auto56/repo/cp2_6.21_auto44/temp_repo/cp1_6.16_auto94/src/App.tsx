import { useState, useRef, useCallback, useEffect } from 'react'
import LineCanvas, { LineData, LineCanvasHandle } from './LineCanvas'

const COLOR_POOL = ['#4a00e0', '#00b4d8', '#7209b7', '#f72585']

function App() {
  const [lines, setLines] = useState<LineData[]>([])
  const [colorIndex, setColorIndex] = useState(0)
  const [isReplaying, setIsReplaying] = useState(false)
  const [hasReplayed, setHasReplayed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const canvasRef = useRef<LineCanvasHandle>(null)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const handleLineComplete = useCallback((line: LineData) => {
    setLines(prev => [...prev, line])
    setColorIndex(prev => prev + 1)
  }, [])

  const handleClear = () => {
    if (isReplaying) return
    setLines([])
    setColorIndex(0)
    setHasReplayed(false)
    canvasRef.current?.clearCanvas()
  }

  const handleUndo = () => {
    if (isReplaying || lines.length === 0) return
    setLines(prev => prev.slice(0, -1))
    setColorIndex(prev => Math.max(0, prev - 1))
    setHasReplayed(false)
  }

  const handleReplay = () => {
    if (lines.length === 0) return
    if (isReplaying) return
    setIsReplaying(true)
    setHasReplayed(true)
    canvasRef.current?.startReplay()
  }

  const handleReplayComplete = useCallback(() => {
    setIsReplaying(false)
  }, [])

  const buttonBaseStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px 16px',
    border: 'none',
    borderRadius: '10px',
    color: 'white',
    fontSize: '14px',
    fontWeight: 500,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    transition: 'all 0.2s ease',
    userSelect: 'none',
  }

  const clearButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: 'linear-gradient(135deg, #ff4757 0%, #ff3838 100%)',
    boxShadow: '0 4px 15px rgba(255, 71, 87, 0.4)',
  }

  const undoButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: 'rgba(255, 255, 255, 0.15)',
    opacity: lines.length === 0 || isReplaying ? 0.5 : 1,
    cursor: lines.length === 0 || isReplaying ? 'not-allowed' : 'pointer',
  }

  const replayButtonStyle: React.CSSProperties = {
    ...buttonBaseStyle,
    background: 'linear-gradient(135deg, #00b4d8 0%, #0096c7 100%)',
    boxShadow: '0 4px 15px rgba(0, 180, 216, 0.4)',
    opacity: lines.length === 0 ? 0.5 : 1,
    cursor: lines.length === 0 || isReplaying ? 'not-allowed' : 'pointer',
  }

  const toolbarStyle: React.CSSProperties = isMobile
    ? {
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: '80px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-around',
        padding: '0 20px',
        gap: '12px',
        zIndex: 100,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
      }
    : {
        position: 'fixed',
        top: '50%',
        right: '20px',
        transform: 'translateY(-50%)',
        width: '220px',
        background: 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderRadius: '16px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        zIndex: 100,
        border: '1px solid rgba(255, 255, 255, 0.1)',
      }

  const handleButtonMouseDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    const target = e.currentTarget
    target.style.transform = 'scale(0.95)'
    setTimeout(() => {
      target.style.transform = ''
    }, 100)
  }

  const handleButtonMouseEnter = (e: React.MouseEvent<HTMLButtonElement>, type: string) => {
    const target = e.currentTarget
    if (type === 'clear') {
      target.style.transform = 'scale(1.05)'
      target.style.boxShadow = '0 6px 20px rgba(255, 71, 87, 0.6)'
    } else if (type === 'undo' && lines.length > 0 && !isReplaying) {
      target.style.background = 'rgba(255, 255, 255, 0.25)'
    } else if (type === 'replay' && lines.length > 0 && !isReplaying) {
      target.style.transform = 'scale(1.05)'
      target.style.boxShadow = '0 6px 20px rgba(0, 180, 216, 0.6)'
    }
  }

  const handleButtonMouseLeave = (e: React.MouseEvent<HTMLButtonElement>, type: string) => {
    const target = e.currentTarget
    target.style.transform = ''
    if (type === 'clear') {
      target.style.boxShadow = '0 4px 15px rgba(255, 71, 87, 0.4)'
    } else if (type === 'undo') {
      target.style.background = 'rgba(255, 255, 255, 0.15)'
    } else if (type === 'replay') {
      target.style.boxShadow = '0 4px 15px rgba(0, 180, 216, 0.4)'
    }
  }

  const mobileButtonStyle: React.CSSProperties = {
    flex: 1,
    padding: '10px 8px',
    fontSize: '12px',
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <LineCanvas
        ref={canvasRef}
        lines={lines}
        onLineComplete={handleLineComplete}
        isReplaying={isReplaying}
        onReplayComplete={handleReplayComplete}
        colorPool={COLOR_POOL}
        currentColorIndex={colorIndex}
      />

      <div
        style={{
          position: 'fixed',
          top: '20px',
          left: '20px',
          color: 'white',
          fontSize: '14px',
          opacity: 0.6,
          zIndex: 100,
          pointerEvents: 'none',
        }}
      >
        线条数量: {lines.length}
      </div>

      <div style={toolbarStyle}>
        <button
          style={isMobile ? { ...clearButtonStyle, ...mobileButtonStyle } : clearButtonStyle}
          onClick={handleClear}
          onMouseDown={handleButtonMouseDown}
          onMouseEnter={(e) => handleButtonMouseEnter(e, 'clear')}
          onMouseLeave={(e) => handleButtonMouseLeave(e, 'clear')}
          disabled={isReplaying}
        >
          <span style={{ fontSize: '16px' }}>🗑️</span>
          <span>清空画布</span>
        </button>

        <button
          style={isMobile ? { ...undoButtonStyle, ...mobileButtonStyle } : undoButtonStyle}
          onClick={handleUndo}
          onMouseDown={handleButtonMouseDown}
          onMouseEnter={(e) => handleButtonMouseEnter(e, 'undo')}
          onMouseLeave={(e) => handleButtonMouseLeave(e, 'undo')}
          disabled={lines.length === 0 || isReplaying}
        >
          <span style={{ fontSize: '16px' }}>↩️</span>
          <span>撤销</span>
        </button>

        <button
          style={isMobile ? { ...replayButtonStyle, ...mobileButtonStyle } : replayButtonStyle}
          onClick={handleReplay}
          onMouseDown={handleButtonMouseDown}
          onMouseEnter={(e) => handleButtonMouseEnter(e, 'replay')}
          onMouseLeave={(e) => handleButtonMouseLeave(e, 'replay')}
          disabled={lines.length === 0 || isReplaying}
        >
          <span style={{ fontSize: '16px' }}>{isReplaying ? '⏳' : '▶️'}</span>
          <span>{hasReplayed && !isReplaying ? '重新回放' : '回放创作'}</span>
        </button>
      </div>
    </div>
  )
}

export default App
