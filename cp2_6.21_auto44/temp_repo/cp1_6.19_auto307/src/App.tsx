import { useEffect, useRef } from 'react'
import StarField from './components/StarField'
import UIPanel from './components/UIPanel'
import Sidebar from './components/Sidebar'
import { useStarStore } from './store/starStore'
import Stats from 'stats.js'
import './styles/global.css'

export default function App() {
  const statsRef = useRef<Stats | null>(null)
  const loadConstellations = useStarStore((s) => s.loadConstellations)
  const fpsWrapperRef = useRef<{ update: () => void } | null>(null)

  useEffect(() => {
    loadConstellations()
  }, [loadConstellations])

  useEffect(() => {
    const stats = new Stats()
    stats.showPanel(0)
    stats.dom.style.position = 'fixed'
    stats.dom.style.left = 'auto'
    stats.dom.style.right = '16px'
    stats.dom.style.top = '16px'
    stats.dom.style.zIndex = '9999'
    stats.dom.style.borderRadius = '4px'
    stats.dom.style.opacity = '0.85'
    document.body.appendChild(stats.dom)
    statsRef.current = stats
    fpsWrapperRef.current = {
      update: () => {
        stats.begin()
      },
    }

    let lastFpsLogTime = performance.now()
    let frameCount = 0
    const onRaf = () => {
      frameCount++
      stats.end()
      const now = performance.now()
      if (now - lastFpsLogTime >= 5000) {
        const avgFps = (frameCount * 1000) / (now - lastFpsLogTime)
        if (import.meta.env.DEV) {
          console.debug(`[FPS Monitor] 5秒平均帧率: ${avgFps.toFixed(1)} fps`)
        }
        frameCount = 0
        lastFpsLogTime = now
      }
      requestAnimationFrame(onRaf)
    }
    const rafId = requestAnimationFrame(onRaf)

    return () => {
      cancelAnimationFrame(rafId)
      if (statsRef.current?.dom.parentNode) {
        statsRef.current.dom.parentNode.removeChild(statsRef.current.dom)
      }
    }
  }, [])

  const statsBridge = useRef({
    update: () => {
      statsRef.current?.begin()
    },
  })

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', inset: 0 }}>
        <StarField statsRef={statsBridge} />
      </div>
      <Sidebar />
      <UIPanel />
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#C9A96E',
          fontSize: 11,
          letterSpacing: 3,
          opacity: 0.7,
          pointerEvents: 'none',
          userSelect: 'none',
          textShadow: '0 0 8px rgba(0,0,0,0.8)',
          zIndex: 10,
        }}
      >
        ✦ 3D CONSTELLATION STORY PROJECTOR · 3D星座故事投影仪 ✦
      </div>
    </div>
  )
}
