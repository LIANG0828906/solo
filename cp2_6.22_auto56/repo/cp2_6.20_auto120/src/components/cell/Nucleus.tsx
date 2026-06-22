import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '@/types'
import { lightenColor, darkenColor } from '@/utils/pathUtils'

interface NucleusProps {
  position?: Vec3
  scale?: Vec3 | number
  color?: string
}

export default function Nucleus({
  position = [0, 0, 0],
  scale = 1,
  color = '#87ceeb',
}: NucleusProps) {
  const groupRef = useRef<THREE.Group>(null)
  const nucleolusRef = useRef<THREE.Mesh>(null)

  const scaleArr: Vec3 =
    typeof scale === 'number' ? [scale, scale, scale] : scale

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (groupRef.current) {
      groupRef.current.rotation.y = t * 0.15
      groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.1
    }
    if (nucleolusRef.current) {
      nucleolusRef.current.rotation.y = -t * 0.3
    }
  })

  return (
    <group position={position} scale={scaleArr}>
      <group ref={groupRef}>
        <mesh>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={0.7}
            roughness={0.3}
            metalness={0.1}
          />
        </mesh>
        <mesh scale={0.92}>
          <sphereGeometry args={[1.2, 32, 32]} />
          <meshStandardMaterial
            color={lightenColor(color, 0.1)}
            transparent
            opacity={0.4}
            side={THREE.DoubleSide}
          />
        </mesh>
        <mesh ref={nucleolusRef} position={[0.3, 0.2, -0.2]} scale={0.35}>
          <sphereGeometry args={[1.2, 16, 16]} />
          <meshStandardMaterial
            color={darkenColor(color, 0.15)}
            transparent
            opacity={0.6}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]} scale={1.005}>
          <sphereGeometry args={[1.2, 32, 2, 0, Math.PI * 2, 0, 0.08]} />
          <meshBasicMaterial
            color={lightenColor(color, 0.2)}
            transparent
            opacity={0.25}
            side={THREE.DoubleSide}
          />
        </mesh>
      </group>
    </group>
  )
}
