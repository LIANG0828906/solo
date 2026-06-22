import { useEffect, useRef } from 'react'
import { createRiverScene, type RiverSceneAPI } from './river/RiverScene'
import AnalyticsPanel from './analytics/AnalyticsPanel'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<RiverSceneAPI | null>(null)

  useEffect(() => {
    if (!containerRef.current) return
    const container = containerRef.current
    const scene = createRiverScene(container)
    sceneRef.current = scene

    const handleResize = () => {
      if (!containerRef.current) return
      const w = containerRef.current.clientWidth
      const h = containerRef.current.clientHeight
      scene.resize(w, h)
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        margin: 0,
        padding: 0,
        overflow: 'hidden'
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%'
        }}
      />
      <AnalyticsPanel />
    </div>
  )
}

export default App
