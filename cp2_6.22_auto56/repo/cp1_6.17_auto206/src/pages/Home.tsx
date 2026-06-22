import { FC, useEffect, useRef, useState } from 'react'
import { GeoDataSource } from '@/GeoDataSource'
import { Scene3D } from '@/Scene3D'
import { eventBus } from '@/EventBus'
import { UIManager } from '@/UIManager'

const dataSourceSingleton = new GeoDataSource()

const Home: FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<Scene3D | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const scene = new Scene3D(containerRef.current, dataSourceSingleton, eventBus)
    sceneRef.current = scene
    setReady(true)
    return () => {
      scene.dispose()
      sceneRef.current = null
    }
  }, [])

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden', background: '#0D1117' }}>
      <div ref={containerRef} style={{ position: 'absolute', inset: 0 }} />
      {ready && <UIManager eventBus={eventBus} dataSource={dataSourceSingleton} />}
      <div style={{
        position: 'absolute', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 20,
        color: '#E6EDF3', fontSize: 14, fontWeight: 600, letterSpacing: 1,
        textShadow: '0 0 8px rgba(0,191,255,0.3)', pointerEvents: 'none',
      }}>
        城市热岛效应 · 3D 时空可视化系统
      </div>
    </div>
  )
}

export default Home
