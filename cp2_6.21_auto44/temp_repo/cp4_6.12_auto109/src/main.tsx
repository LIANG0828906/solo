import React, { useState, useRef, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Canvas } from '@react-three/fiber'
import Scene from './Scene'
import ControlPanel from './ControlPanel'

function App() {
  const [temperature, setTemperature] = useState(6000)
  const [ionization, setIonization] = useState(50)
  const [viewAngle, setViewAngle] = useState(0)
  const [fps, setFps] = useState(60)
  const lastTimeRef = useRef(performance.now())
  const frameCountRef = useRef(0)

  useEffect(() => {
    let animationId: number
    const updateFps = () => {
      frameCountRef.current++
      const now = performance.now()
      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current)
        frameCountRef.current = 0
        lastTimeRef.current = now
      }
      animationId = requestAnimationFrame(updateFps)
    }
    animationId = requestAnimationFrame(updateFps)
    return () => cancelAnimationFrame(animationId)
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', background: '#000000' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 60 }}
        style={{ width: '800px', height: '600px' }}
        gl={{ antialias: true }}
      >
        <color attach="background" args={['#000000']} />
        <Scene temperature={temperature} ionization={ionization} viewAngle={viewAngle} />
      </Canvas>
      <ControlPanel
        temperature={temperature}
        setTemperature={setTemperature}
        ionization={ionization}
        setIonization={setIonization}
        viewAngle={viewAngle}
        setViewAngle={setViewAngle}
        fps={fps}
      />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
