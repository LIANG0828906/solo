import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

const STAR_COUNT = 2000

export function Starfield() {
  const pointsRef = useRef<THREE.Points>(null)

  const { positions, colors } = useMemo(() => {
    const positions = new Float32Array(STAR_COUNT * 3)
    const colors = new Float32Array(STAR_COUNT * 3)
    
    for (let i = 0; i < STAR_COUNT; i++) {
      const i3 = i * 3
      const radius = 50 + Math.random() * 50
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      positions[i3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i3 + 2] = radius * Math.cos(phi)
      
      const colorChoice = Math.random()
      if (colorChoice < 0.6) {
        colors[i3] = 1
        colors[i3 + 1] = 0.5 + Math.random() * 0.3
        colors[i3 + 2] = 0.2 + Math.random() * 0.2
      } else if (colorChoice < 0.8) {
        colors[i3] = 1
        colors[i3 + 1] = 0.8 + Math.random() * 0.2
        colors[i3 + 2] = 0.8 + Math.random() * 0.2
      } else {
        colors[i3] = 0.8 + Math.random() * 0.2
        colors[i3 + 1] = 0.3 + Math.random() * 0.3
        colors[i3 + 2] = 0.8 + Math.random() * 0.2
      }
    }
    
    return { positions, colors }
  }, [])

  useFrame((state, delta) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y += delta * 0.02
      pointsRef.current.rotation.x += delta * 0.01
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={STAR_COUNT}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={STAR_COUNT}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.15}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}
