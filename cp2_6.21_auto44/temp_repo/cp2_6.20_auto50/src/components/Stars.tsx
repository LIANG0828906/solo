import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export default function Stars() {
  const starsRef = useRef<THREE.Points>(null)
  const count = 1500

  const { positions, colors, phases } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const phases = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const radius = 40 + Math.random() * 10

      positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = radius * Math.cos(phi)

      colors[i * 3] = 1
      colors[i * 3 + 1] = 1
      colors[i * 3 + 2] = 1

      phases[i] = Math.random() * Math.PI * 2
    }

    return { positions, colors, phases }
  }, [])

  useFrame((state) => {
    if (!starsRef.current) return
    const geometry = starsRef.current.geometry
    const colorAttribute = geometry.attributes.color as THREE.BufferAttribute
    const time = state.clock.elapsedTime

    for (let i = 0; i < count; i++) {
      const brightness = 0.5 + Math.sin(time * 1.5 + phases[i]) * 0.5
      colorAttribute.setXYZ(i, brightness, brightness, brightness)
    }
    colorAttribute.needsUpdate = true
  })

  return (
    <points ref={starsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.08}
        vertexColors
        transparent
        opacity={0.85}
        sizeAttenuation
      />
    </points>
  )
}
