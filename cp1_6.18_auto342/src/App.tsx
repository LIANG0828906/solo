import { useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import ParticleSystem from '@/render/ParticleSystem'
import UserControls from '@/interaction/UserControls'
import { useFlowStore } from '@/store/flowStore'

const App = () => {
  const initializeParticles = useFlowStore((state) => state.initializeParticles)
  const particles = useFlowStore((state) => state.particles)

  useEffect(() => {
    if (particles.length === 0) {
      initializeParticles(500)
    }
  }, [particles.length, initializeParticles])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{
          position: [0, 0, 30],
          fov: 60,
          near: 0.1,
          far: 1000,
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance',
        }}
        dpr={[1, 2]}
        style={{
          background: 'radial-gradient(ellipse at center, #1a1a3e 0%, #0a0a23 100%)',
        }}
        frameloop="always"
      >
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} color="#8A2BE2" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#00BFFF" />
        <fog attach="fog" args={['#0a0a23', 30, 80]} />
        <ParticleSystem />
        <UserControls />
      </Canvas>
    </div>
  )
}

export default App
