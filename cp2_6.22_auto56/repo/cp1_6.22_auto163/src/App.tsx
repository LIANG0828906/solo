import { useEffect, useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import Scene from './components/Scene'
import ControlPanel from './components/ControlPanel'
import { startTrafficSimulation, stopTrafficSimulation } from './store/trafficStore'

function App() {
  const controlsRef = useRef<any>(null)

  useEffect(() => {
    const unsubscribe = startTrafficSimulation()
    return () => {
      unsubscribe()
      stopTrafficSimulation()
    }
  }, [])

  const handleResetCamera = () => {
    if (controlsRef.current && controlsRef.current.object) {
      const camera = controlsRef.current.object
      const startPos = { x: camera.position.x, y: camera.position.y, z: camera.position.z }
      const targetPos = { x: 25, y: 20, z: 25 }
      const duration = 600
      const startTime = performance.now()

      const animate = (currentTime: number) => {
        const elapsed = currentTime - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easeProgress = 1 - Math.pow(1 - progress, 3)

        camera.position.x = startPos.x + (targetPos.x - startPos.x) * easeProgress
        camera.position.y = startPos.y + (targetPos.y - startPos.y) * easeProgress
        camera.position.z = startPos.z + (targetPos.z - startPos.z) * easeProgress

        controlsRef.current.target.set(0, 0, 0)

        if (progress < 1) {
          requestAnimationFrame(animate)
        }
      }

      requestAnimationFrame(animate)
    }
  }

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        shadows
        camera={{ position: [25, 20, 25], fov: 60 }}
        gl={{ antialias: true }}
      >
        <Scene controlsRef={controlsRef} />
      </Canvas>
      <ControlPanel onResetCamera={handleResetCamera} />
    </div>
  )
}

export default App
