import React, { useEffect, useRef } from 'react'
import ReactDOM from 'react-dom/client'
import { Scene3D } from './Scene3D'
import { InteractionManager } from './InteractionManager'
import { UIPanel } from './UIPanel'

function App() {
  const sceneContainerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<Scene3D | null>(null)
  const interactionRef = useRef<InteractionManager | null>(null)
  const hoverTimerRef = useRef<number | null>(null)

  useEffect(() => {
    if (!sceneContainerRef.current) return

    const scene3d = new Scene3D(sceneContainerRef.current)
    sceneRef.current = scene3d

    const interaction = new InteractionManager(scene3d, sceneContainerRef.current)
    interactionRef.current = interaction

    const canvas = scene3d.renderer.domElement

    const handleMove = () => {
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
      }
      hoverTimerRef.current = window.setTimeout(() => {
        interaction.updateHoverHighlight()
      }, 16)
    }

    canvas.addEventListener('pointermove', handleMove)
    canvas.addEventListener('pointerenter', handleMove)
    canvas.addEventListener('pointerleave', () => {
      scene3d.updateHighlight(null)
    })

    interaction.updateHoverHighlight()

    return () => {
      canvas.removeEventListener('pointermove', handleMove)
      canvas.removeEventListener('pointerenter', handleMove)
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
      interaction.destroy()
      scene3d.destroy()
    }
  }, [])

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      width: '100vw',
      height: '100vh',
      overflow: 'hidden',
    }}>
      <div
        ref={sceneContainerRef}
        style={{
          position: 'absolute',
          top: 56,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100%',
          height: 'calc(100vh - 56px)',
          background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        }}
      />
      <UIPanel />
      <HelpOverlay />
    </div>
  )
}

function HelpOverlay() {
  const [dismissed, setDismissed] = React.useState(() => {
    try {
      return sessionStorage.getItem('voxelize_help_dismissed') === '1'
    } catch { return false }
  })

  const dismiss = () => {
    setDismissed(true)
    try { sessionStorage.setItem('voxelize_help_dismissed', '1') } catch {}
  }

  if (dismissed) {
    return (
      <button
        onClick={() => setDismissed(false)}
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          width: 38,
          height: 38,
          borderRadius: 50,
          background: 'rgba(26, 30, 50, 0.85)',
          border: '1px solid rgba(96, 192, 255, 0.4)',
          color: '#8fb8e0',
          cursor: 'pointer',
          fontSize: 16,
          fontWeight: 700,
          fontFamily: 'inherit',
          backdropFilter: 'blur(8px)',
          zIndex: 90,
          transition: 'all 0.2s',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.08)'
          e.currentTarget.style.color = '#60c0ff'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.color = '#8fb8e0'
        }}>?</button>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: 24,
      left: 24,
      width: 280,
      padding: '18px 20px',
      background: 'rgba(22, 26, 44, 0.88)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      border: '1px solid rgba(96, 192, 255, 0.35)',
      borderRadius: 14,
      boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
      zIndex: 90,
      color: '#c0d0e0',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: 0.3 }}>
          💡 操作指南
        </div>
        <button
          onClick={dismiss}
          style={{
            width: 24, height: 24,
            borderRadius: 50,
            border: 'none',
            background: 'rgba(255,255,255,0.06)',
            color: '#8098b0',
            cursor: 'pointer',
            fontSize: 14,
            fontFamily: 'inherit',
          }}>✕</button>
      </div>
      <div style={{ fontSize: 12, lineHeight: 1.9, color: '#a0b8d0' }}>
        <div><span style={{ color: '#60c0ff', fontWeight: 600 }}>🖱 左键拖拽</span>：旋转视角</div>
        <div><span style={{ color: '#60c0ff', fontWeight: 600 }}>🖱 滚轮</span>：缩放画面</div>
        <div><span style={{ color: '#60c0ff', fontWeight: 600 }}>🖱 右键拖拽</span>：平移视角</div>
        <div><span style={{ color: '#60c0ff', fontWeight: 600 }}>🖱 单击网格</span>：放置/删除体素</div>
        <div><span style={{ color: '#60c0ff', fontWeight: 600 }}>⌨ Ctrl+Z</span>：撤销操作</div>
        <div><span style={{ color: '#60c0ff', fontWeight: 600 }}>⌨ Ctrl+Shift+Z</span>：重做操作</div>
        <div><span style={{ color: '#60c0ff', fontWeight: 600 }}>⌨ 数字键 1/2/3</span>：切换模式</div>
      </div>
    </div>
  )
}

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
