import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '@/types'
import { lightenColor, darkenColor } from '@/utils/pathUtils'

interface MitochondriaProps {
  position?: Vec3
  scale?: Vec3 | number
  color?: string
}

export default function Mitochondria({
  position = [0, 0, 0],
  scale = 1,
  color = '#8b0000',
}: MitochondriaProps) {
  const groupRef = useRef<THREE.Group>(null)

  const baseScale: Vec3 =
    typeof scale === 'number'
      ? [scale * 1, scale * 1.5, scale * 1]
      : [scale[0] * 1, scale[1] * 1.5, scale[2] * 1]

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      const breathe = 1 + Math.sin(t * Math.PI) * 0.05
      groupRef.current.scale.set(
        baseScale[0] * breathe,
        baseScale[1] * breathe,
        baseScale[2] * breathe
      )
    }
  })

  return (
    <group ref={groupRef} position={position}>
      <mesh>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color={color}
          transparent
          opacity={0.85}
          roughness={0.5}
          metalness={0.1}
        />
      </mesh>
      <mesh scale={0.9}>
        <sphereGeometry args={[0.6, 32, 32]} />
        <meshStandardMaterial
          color={lightenColor(color, 0.1)}
          transparent
          opacity={0.5}
          side={2}
        />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 0.05, 1]} position={[0, 0.15, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial
          color={darkenColor(color, 0.2)}
          transparent
          opacity={0.6}
        />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]} scale={[1, 0.05, 1]} position={[0, -0.15, 0]}>
        <sphereGeometry args={[0.6, 16, 16]} />
        <meshStandardMaterial
          color={darkenColor(color, 0.2)}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  )
}
