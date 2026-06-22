import { useState, useRef, useEffect, useCallback } from 'react'
import { formatTime } from '../utils/buildings'

interface ControlPanelProps {
  time: number
  onTimeChange: (time: number) => void
}

const MIN_TIME = 5
const MAX_TIME = 22

function ControlPanel({ time, onTimeChange }: ControlPanelProps) {
  const [isDragging, setIsDragging] = useState(false)
  const trackRef = useRef<HTMLDivElement>(null)
  const currentTimeRef = useRef(time)

  useEffect(() => {
    currentTimeRef.current = time
  }, [time])

  const getTimeFromY = useCallback((clientY: number) => {
    if (!trackRef.current) return currentTimeRef.current
    const rect = trackRef.current.getBoundingClientRect()
    const y = Math.max(0, Math.min(clientY - rect.top, rect.height))
    const ratio = 1 - y / rect.height
    return MIN_TIME + ratio * (MAX_TIME - MIN_TIME)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault()
    setIsDragging(true)
    const newTime = getTimeFromY(e.clientY)
    onTimeChange(newTime)
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true)
    const touch = e.touches[0]
    const newTime = getTimeFromY(touch.clientY)
    onTimeChange(newTime)
  }

  useEffect(() => {
    if (!isDragging) return

    const handleMouseMove = (e: MouseEvent) => {
      const newTime = getTimeFromY(e.clientY)
      onTimeChange(newTime)
    }

    const handleTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      const newTime = getTimeFromY(touch.clientY)
      onTimeChange(newTime)
    }

    const handleEnd = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleEnd)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleEnd)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleEnd)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleEnd)
    }
  }, [isDragging, getTimeFromY, onTimeChange])

  const ratio = (time - MIN_TIME) / (MAX_TIME - MIN_TIME)
  const percentage = ratio * 100

  const panelStyle: React.CSSProperties = {
    position: 'absolute',
    top: '50%',
    right: '32px',
    transform: 'translateY(-50%)',
    background: 'rgba(20, 20, 30, 0.8)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)',
    padding: '24px 20px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '16px',
    zIndex: 100,
    userSelect: 'none'
  }

  const labelStyle: React.CSSProperties = {
    color: '#ffffff',
    fontSize: '14px',
    fontWeight: 600,
    letterSpacing: '0.5px',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: '4px'
  }

  const timeDisplayStyle: React.CSSProperties = {
    color: '#ffd700',
    fontSize: '26px',
    fontWeight: 700,
    fontFamily: 'Consolas, Monaco, monospace',
    textShadow: '0 0 10px rgba(255, 215, 0, 0.5)',
    letterSpacing: '2px',
    marginBottom: '4px'
  }

  const trackContainerStyle: React.CSSProperties = {
    position: 'relative',
    width: '56px',
    height: '340px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center'
  }

  const trackStyle: React.CSSProperties = {
    position: 'relative',
    width: '12px',
    height: '100%',
    borderRadius: '6px',
    background: 'linear-gradient(to top, ' +
      '#ff6b35 0%, ' +
      '#f7931e 15%, ' +
      '#ffd23f 30%, ' +
      '#6ee7b7 45%, ' +
      '#60a5fa 60%, ' +
      '#3b82f6 75%, ' +
      '#1e3a8a 90%, ' +
      '#0a0a2e 100%)',
    cursor: 'pointer',
    boxShadow: 'inset 0 2px 6px rgba(0, 0, 0, 0.4)'
  }

  const progressStyle: React.CSSProperties = {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: `${percentage}%`,
    borderRadius: '6px',
    background: 'linear-gradient(to top, ' +
      'rgba(255, 107, 53, 0.9) 0%, ' +
      'rgba(247, 147, 30, 0.9) 15%, ' +
      'rgba(255, 210, 63, 0.9) 30%, ' +
      'rgba(110, 231, 183, 0.9) 45%, ' +
      'rgba(96, 165, 250, 0.9) 60%, ' +
      'rgba(59, 130, 246, 0.9) 75%, ' +
      'rgba(30, 58, 138, 0.9) 90%, ' +
      'rgba(10, 10, 46, 0.9) 100%)',
    pointerEvents: 'none',
    boxShadow: '0 0 8px rgba(255, 215, 0, 0.3)'
  }

  const glowColor = ratio < 0.3
    ? 'rgba(255, 150, 100, 0.9)'
    : ratio < 0.7
    ? 'rgba(255, 220, 100, 0.9)'
    : 'rgba(100, 150, 255, 0.9)'

  const handleStyle: React.CSSProperties = {
    position: 'absolute',
    left: '50%',
    bottom: `calc(${percentage}% - 14px)`,
    transform: 'translateX(-50%)',
    width: '28px',
    height: '28px',
    borderRadius: '50%',
    background: `radial-gradient(circle at 30% 30%, #ffffff, ${glowColor})`,
    border: '2px solid rgba(255, 255, 255, 0.9)',
    cursor: isDragging ? 'grabbing' : 'grab',
    boxShadow: isDragging
      ? `0 0 20px ${glowColor}, 0 0 40px ${glowColor}, 0 4px 12px rgba(0, 0, 0, 0.5)`
      : `0 0 12px ${glowColor}, 0 2px 8px rgba(0, 0, 0, 0.4)`,
    transition: isDragging ? 'none' : 'box-shadow 0.2s ease, transform 0.1s ease',
    zIndex: 10
  }

  const marks = [
    { label: '22:00', value: 22 },
    { label: '18:00', value: 18 },
    { label: '12:00', value: 12 },
    { label: '09:00', value: 9 },
    { label: '05:00', value: 5 }
  ]

  const markStyle: React.CSSProperties = {
    position: 'absolute',
    right: '-8px',
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: '10px',
    fontWeight: 500,
    fontFamily: 'Consolas, Monaco, monospace',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    transform: 'translateX(100%)'
  }

  const getMarkPosition = (val: number) => {
    const r = (val - MIN_TIME) / (MAX_TIME - MIN_TIME)
    return `calc(${r * 100}% - 5px)`
  }

  const hintStyle: React.CSSProperties = {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: '11px',
    textAlign: 'center',
    marginTop: '4px',
    lineHeight: 1.4
  }

  return (
    <div style={panelStyle}>
      <div style={labelStyle}>模拟时间</div>
      <div style={timeDisplayStyle}>{formatTime(time)}</div>
      <div style={trackContainerStyle}>
        <div
          ref={trackRef}
          style={trackStyle}
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div style={progressStyle} />
          <div
            style={handleStyle}
            onMouseDown={handleMouseDown}
            onTouchStart={handleTouchStart}
          />
          {marks.map(m => (
            <span
              key={m.value}
              style={{
                ...markStyle,
                bottom: getMarkPosition(m.value)
              }}
            >
              {m.label}
            </span>
          ))}
        </div>
      </div>
      <div style={hintStyle}>
        拖动滑块<br />感受城市昼夜变化
      </div>
    </div>
  )
}

export default ControlPanel
