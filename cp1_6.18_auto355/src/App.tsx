import { useState, useCallback } from 'react'
import { Canvas } from '@react-three/fiber'
import OceanRenderer from './oceanRenderer'
import OceanControls from './oceanControls'
import { RenderParticle } from './oceanData'

export default function App() {
  const [, setLastClickedParticle] = useState<RenderParticle | null>(null)

  const handleParticleClick = useCallback((particle: RenderParticle) => {
    setLastClickedParticle(particle)
  }, [])

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas
        camera={{
          position: [0, 8, 28],
          fov: 50,
          near: 0.1,
          far: 500,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        style={{ background: '#0A0E27' }}
      >
        <OceanRenderer onParticleClick={handleParticleClick} />
      </Canvas>
      <OceanControls />
    </div>
  )
}
