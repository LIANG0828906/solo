import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createNoiseTexture } from '@/utils/noise'

interface SunProps {
  radius: number
}

export function Sun({ radius }: SunProps) {
  const sunRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Points>(null)

  const glowGeometry = useMemo(() => {
    const positions = new Float32Array(500 * 3)
    for (let i = 0; i < 500; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = radius * (1.2 + Math.random() * 0.5)
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta)
      positions[i * 3 + 2] = r * Math.cos(phi)
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [radius])

  const noiseTexture = useMemo(() => createNoiseTexture(256), [])

  useFrame((_, delta) => {
    if (sunRef.current) {
      sunRef.current.rotation.y += delta * 0.1
    }
    if (glowRef.current) {
      glowRef.current.rotation.y += delta * 0.05
      glowRef.current.rotation.x += delta * 0.02
    }
  })

  return (
    <group>
      <mesh ref={sunRef}>
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          color="#FFAA00"
          emissive="#FFAA00"
          emissiveIntensity={1.5}
          emissiveMap={noiseTexture}
        />
      </mesh>
      <points ref={glowRef} geometry={glowGeometry}>
        <pointsMaterial
          color="#FFCC00"
          size={0.05}
          transparent
          opacity={0.6}
          sizeAttenuation
        />
      </points>
      <pointLight color="#FFAA00" intensity={2} distance={50} />
    </group>
  )
}
