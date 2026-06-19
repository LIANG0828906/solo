import { useRef, useEffect } from 'react'
import { useFrame, Canvas } from '@react-three/fiber'
import { useCrystalStore } from './store'
import CrystalScene from './CrystalScene'
import ControlPanel from './ControlPanel'
import RadarChart from './RadarChart'

function StoreUpdater() {
  const tick = useCrystalStore((s) => s.tick)
  useFrame((_, delta) => {
    tick(delta)
  })
  return null
}

function App() {
  const progressRef = useRef<HTMLDivElement>(null)
  const isPlaying = useCrystalStore((s) => s.isPlaying)
  const progress = useCrystalStore((s) => s.progress)
  const setPlaying = useCrystalStore((s) => s.setPlaying)
  const setProgress = useCrystalStore((s) => s.setProgress)
  const lastTriggeredRef = useRef(-1)
  const lastStageTriggered = useCrystalStore((s) => s.lastStageTriggered)

  useEffect(() => {
    if (lastStageTriggered !== lastTriggeredRef.current && lastStageTriggered >= 0) {
      lastTriggeredRef.current = lastStageTriggered
      const event = new CustomEvent('crystal-stage-trigger', { detail: { stage: lastStageTriggered } })
      window.dispatchEvent(event)
    }
  }, [lastStageTriggered])

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current) return
    const rect = progressRef.current.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    setProgress(ratio)
  }

  const handleProgressDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault()
    const onMove = (ev: MouseEvent) => {
      if (!progressRef.current) return
      const rect = progressRef.current.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width))
      setProgress(ratio)
    }
    const onUp = () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('mouseup', onUp)
  }

  return (
    <div className="app-container">
      <div className="canvas-container">
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50, near: 0.1, far: 100 }}
          gl={{ antialias: true, alpha: true }}
        >
          <color attach="background" args={[0x0D1117]} />
          <fog attach="fog" args={[0x0D1117, 5, 15]} />
          <StoreUpdater />
          <CrystalScene />
        </Canvas>
      </div>

      <ControlPanel />
      <RadarChart />

      <div className="playback-bar">
        <button className="play-btn" onClick={() => setPlaying(!isPlaying)}>
          {isPlaying ? (
            <svg viewBox="0 0 24 24">
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24">
              <polygon points="6,4 20,12 6,20" />
            </svg>
          )}
        </button>
        <div
          className="progress-wrapper"
          ref={progressRef}
          onClick={handleProgressClick}
          onMouseDown={handleProgressDrag}
        >
          <div className="progress-filled" style={{ width: `${progress * 100}%` }} />
          <div className="progress-handle" style={{ left: `${progress * 100}%` }} />
        </div>
      </div>
    </div>
  )
}

export default App
