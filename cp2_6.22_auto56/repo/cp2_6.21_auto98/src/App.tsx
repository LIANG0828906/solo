import { useEffect, useRef, useState } from 'react'
import Scene3D from './components/Scene3D'
import ControlPanel from './components/ControlPanel'
import TerrainProfile from './components/TerrainProfile'
import TopBar from './components/TopBar'
import StatusBar from './components/StatusBar'
import { useTerrainStore } from './store/terrainStore'
import './App.css'

export default function App() {
  const [worker, setWorker] = useState<Worker | null>(null)
  const { setFps } = useTerrainStore()
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useEffect(() => {
    const erosionWorker = new Worker(new URL('./workers/erosionWorker.ts', import.meta.url), {
      type: 'module'
    })
    setWorker(erosionWorker)

    return () => {
      erosionWorker.terminate()
    }
  }, [])

  useEffect(() => {
    let animationId: number

    const measureFps = () => {
      frameCountRef.current++
      const now = performance.now()
      const elapsed = now - lastTimeRef.current

      if (elapsed >= 1000) {
        const fps = (frameCountRef.current * 1000) / elapsed
        setFps(fps)
        frameCountRef.current = 0
        lastTimeRef.current = now
      }

      animationId = requestAnimationFrame(measureFps)
    }

    animationId = requestAnimationFrame(measureFps)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [setFps])

  return (
    <div className="app-container">
      <div className="scene-container">
        <TopBar />
        <Scene3D worker={worker} />
        <TerrainProfile />
        <StatusBar />
      </div>
      <ControlPanel />
    </div>
  )
}
