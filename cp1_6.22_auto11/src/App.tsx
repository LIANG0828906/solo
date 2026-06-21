import { useState, useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import ParticleNebula from './ParticleNebula'
import ControlPanel from './ControlPanel'

export default function App() {
  const [particleCount, setParticleCount] = useState(30000)
  const [colorSpeed, setColorSpeed] = useState(0.3)
  const [rotationSpeed, setRotationSpeed] = useState(0.2)
  const [flowDirection, setFlowDirection] = useState({ x: 0.3, y: 0.2, z: 0.1 })

  const handleFlowDirectionChange = (axis: 'x' | 'y' | 'z', value: number) => {
    setFlowDirection(prev => ({ ...prev, [axis]: value }))
  }

  const handleParticleClick = (_point: THREE.Vector3) => {
  }

  const { starPositions, starSizes } = useMemo(() => {
    const count = 800
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    
    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const radius = 60 + Math.random() * 60
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)
      
      sizes[i] = 0.02 + Math.random() * 0.06
    }
    
    return { starPositions: positions, starSizes: sizes }
  }, [])

  const baseDistance = 18

  return (
    <div className="w-full h-screen bg-gradient-to-b from-[#0a0a1a] via-[#0d0d24] to-[#050510] overflow-hidden relative">
      <Canvas
        camera={{ position: [0, 0, baseDistance], fov: 60 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', top: 0, left: 0 }}
      >
        <color attach="background" args={['#050510']} />
        <fog attach="fog" args={['#050510', 30, 80]} />

        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={800}
              array={starPositions}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            size={0.05}
            color="white"
            transparent
            opacity={0.9}
            sizeAttenuation
          />
        </points>

        <ParticleNebula
          particleCount={particleCount}
          colorSpeed={colorSpeed}
          rotationSpeed={rotationSpeed}
          flowDirection={flowDirection}
          onParticleClick={handleParticleClick}
        />

        <OrbitControls
          enablePan={false}
          minDistance={baseDistance * 0.5}
          maxDistance={baseDistance * 5}
          minPolarAngle={0}
          maxPolarAngle={Math.PI}
          enableDamping
          dampingFactor={0.05}
        />
      </Canvas>

      <ControlPanel
        particleCount={particleCount}
        colorSpeed={colorSpeed}
        rotationSpeed={rotationSpeed}
        flowDirection={flowDirection}
        onParticleCountChange={setParticleCount}
        onColorSpeedChange={setColorSpeed}
        onRotationSpeedChange={setRotationSpeed}
        onFlowDirectionChange={handleFlowDirectionChange}
      />

      <div className="absolute top-6 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <h1 className="text-white/90 text-2xl font-light tracking-[0.3em]">
          PARTICLE NEBULA
        </h1>
        <p className="text-white/40 text-sm mt-2 tracking-wider">
          拖动旋转 · 滚轮缩放 · 点击涟漪
        </p>
      </div>
    </div>
  )
}
