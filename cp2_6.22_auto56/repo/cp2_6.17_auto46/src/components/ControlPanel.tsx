import { forwardRef } from 'react'
import { useFireflyStore } from '../store/fireflyStore'

interface ControlPanelProps {}

const ControlPanel = forwardRef<HTMLDivElement, ControlPanelProps>((_, ref) => {
  const count = useFireflyStore((s) => s.fireflies.length)
  const trailsVisible = useFireflyStore((s) => s.trailsVisible)
  const resetFatigue = useFireflyStore((s) => s.resetFatigue)
  const toggleTrails = useFireflyStore((s) => s.toggleTrails)

  const textColor = trailsVisible ? '#FFFFFF' : '#95A5A6'

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 500,
          maxWidth: '90vw',
          backgroundColor: 'rgba(15, 23, 42, 0.8)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderRadius: 12,
          padding: '14px 20px',
          color: textColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          zIndex: 10,
          boxShadow: '0 4px 24px rgba(0,0,0,0.3)',
          transition: 'color 0.2s ease',
          userSelect: 'none'
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap' }}>
          萤火虫总数: <span style={{ fontWeight: 700 }}>{count}</span>
        </div>

        <button
          onClick={resetFatigue}
          style={{
            border: '1px solid #FFFFFF',
            borderRadius: 8,
            padding: '8px 16px',
            background: 'transparent',
            color: '#FFFFFF',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'background 0.2s ease, transform 0.1s ease',
            fontFamily: 'inherit'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent'
          }}
        >
          重置疲劳
        </button>

        <button
          onClick={toggleTrails}
          style={{
            border: '1px solid #FFFFFF',
            borderRadius: 8,
            padding: '8px 16px',
            background: trailsVisible ? 'rgba(255,255,255,0.1)' : 'transparent',
            color: '#FFFFFF',
            fontSize: 13,
            cursor: 'pointer',
            transition: 'background 0.2s ease, transform 0.1s ease',
            fontFamily: 'inherit',
            whiteSpace: 'nowrap'
          }}
          onMouseDown={(e) => {
            e.currentTarget.style.background = 'rgba(255,255,255,0.2)'
          }}
          onMouseUp={(e) => {
            e.currentTarget.style.background = trailsVisible ? 'rgba(255,255,255,0.1)' : 'transparent'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = trailsVisible ? 'rgba(255,255,255,0.1)' : 'transparent'
          }}
        >
          {trailsVisible ? '隐藏轨迹' : '显示轨迹'}
        </button>
      </div>

      <div
        ref={ref}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 24,
          color: '#00FF00',
          fontFamily: 'monospace',
          fontSize: 14,
          fontWeight: 700,
          zIndex: 10,
          textShadow: '0 0 8px rgba(0,0,0,0.8)',
          userSelect: 'none'
        }}
      >
        FPS: 60
      </div>
    </>
  )
})

ControlPanel.displayName = 'ControlPanel'

export default ControlPanel
