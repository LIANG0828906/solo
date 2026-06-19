import { useEffect, useRef, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import ParticleField from '@/components/ParticleField'
import ControlPanel from '@/components/ControlPanel'
import { useParticleStore } from '@/store/useParticleStore'

function App() {
  const [fps, setFps] = useState(0)
  const frameCount = useRef(0)
  const lastTime = useRef(performance.now())
  const lastMousePos = useRef<{ x: number; y: number } | null>(null)
  
  const {
    setMouseDirection,
    setIsMouseDown,
    triggerReset,
    nextColorScheme,
    togglePause,
  } = useParticleStore()

  useEffect(() => {
    const updateFps = () => {
      frameCount.current++
      const now = performance.now()
      if (now - lastTime.current >= 1000) {
        setFps(frameCount.current)
        frameCount.current = 0
        lastTime.current = now
      }
      requestAnimationFrame(updateFps)
    }
    const id = requestAnimationFrame(updateFps)
    return () => cancelAnimationFrame(id)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'r' || e.key === 'R') {
        triggerReset()
      } else if (e.key === 'c' || e.key === 'C') {
        nextColorScheme()
      } else if (e.key === ' ') {
        e.preventDefault()
        togglePause()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [triggerReset, nextColorScheme, togglePause])

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button === 0) {
        setIsMouseDown(true)
        lastMousePos.current = { x: e.clientX, y: e.clientY }
      }
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        setIsMouseDown(false)
        setMouseDirection([0, 0, 0])
        lastMousePos.current = null
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (lastMousePos.current) {
        const dx = e.clientX - lastMousePos.current.x
        const dy = e.clientY - lastMousePos.current.y
        
        const dirX = dx * 0.01
        const dirY = -dy * 0.01
        const dirZ = 0
        
        setMouseDirection([dirX, dirY, dirZ])
        
        lastMousePos.current = { x: e.clientX, y: e.clientY }
      }
    }

    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mousemove', handleMouseMove)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [setMouseDirection, setIsMouseDown])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          zIndex: 10,
          color: 'rgba(255, 255, 255, 0.6)',
          fontFamily: 'monospace',
          fontSize: 14,
          pointerEvents: 'none',
        }}
      >
        {fps} FPS
      </div>

      <Canvas
        camera={{ position: [0, 10, 12], fov: 60 }}
        style={{ background: '#0B0D17' }}
        gl={{ antialias: true }}
      >
        <ParticleField />
        <OrbitControls
          enablePan={false}
          enableDamping
          dampingFactor={0.05}
          minDistance={5}
          maxDistance={30}
        />
      </Canvas>

      <ControlPanel />
    </div>
  )
}

export default App
