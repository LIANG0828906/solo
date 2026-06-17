import { useRef } from 'react'
import { Canvas } from '@react-three/fiber'
import { ParticleEngine } from './engine/ParticleEngine'
import ParticleSystem from './components/ParticleSystem'
import ControlPanel from './ui/ControlPanel'
import InteractionLayer from './ui/InteractionLayer'

export default function App() {
  const engineRef = useRef<ParticleEngine | null>(null)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <Canvas
        camera={{
          position: [0, 0, 15],
          fov: 60,
          near: 0.1,
          far: 200
        }}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: 'high-performance'
        }}
        dpr={[1, 2]}
        style={{ background: '#0a0a1a' }}
      >
        <ambientLight intensity={0.2} />
        <ParticleSystem engineRef={engineRef} />
      </Canvas>

      <ControlPanel />
      <InteractionLayer />

      <div
        style={{
          position: 'fixed',
          bottom: 20,
          left: 20,
          color: 'rgba(255,255,255,0.4)',
          fontSize: 12,
          fontFamily: 'system-ui, sans-serif',
          pointerEvents: 'none',
          userSelect: 'none'
        }}
      >
        按住鼠标左键拖动画出极光
      </div>
    </div>
  )
}
