import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import ControlPanel from './components/ControlPanel'
import InteractionManager from './components/InteractionManager'
import ParticleField from './rendering/ParticleField'
import TrailLines from './rendering/TrailLines'
import PulseSpheres from './rendering/PulseSpheres'
import { useSimulation } from './simulation/engine'

function FpsUpdater({ fpsRef }: { fpsRef: React.RefObject<HTMLDivElement> }) {
  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(performance.now())

  useFrame(() => {
    frameCountRef.current++
    if (frameCountRef.current >= 15) {
      const now = performance.now()
      const elapsed = (now - lastTimeRef.current) / 1000
      const fps = Math.round(frameCountRef.current / elapsed)
      if (fpsRef.current) {
        fpsRef.current.textContent = `FPS: ${fps}`
        fpsRef.current.style.color = fps >= 50 ? '#00FF00' : '#FF0000'
      }
      frameCountRef.current = 0
      lastTimeRef.current = now
    }
  })

  return null
}

function Scene({ fpsRef }: { fpsRef: React.RefObject<HTMLDivElement> }) {
  useSimulation()

  return (
    <>
      <ambientLight intensity={0.1} />
      <ParticleField />
      <TrailLines />
      <PulseSpheres />
      <InteractionManager />
      <FpsUpdater fpsRef={fpsRef} />
      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.1}
        minDistance={5}
        maxDistance={50}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={(Math.PI * 3) / 4}
        target={new THREE.Vector3(0, 0, 0)}
      />
    </>
  )
}

export default function App() {
  const fpsRef = useRef<HTMLDivElement>(null)

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #0B1026 0%, #1A2A47 100%)',
          zIndex: 0
        }}
      />
      <Canvas
        camera={{ position: [0, 0, 30], fov: 60, near: 0.1, far: 1000 }}
        style={{ position: 'absolute', inset: 0, zIndex: 1 }}
        gl={{ antialias: true, alpha: true }}
        dpr={[1, 2]}
      >
        <Scene fpsRef={fpsRef} />
      </Canvas>
      <ControlPanel ref={fpsRef} />
    </div>
  )
}
