import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { Vec3 } from '@/types'

interface CellMembraneProps {
  opacity?: number
}

export default function CellMembrane({ opacity = 0.25 }: CellMembraneProps) {
  const outerRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (outerRef.current) {
      outerRef.current.scale.setScalar(1 + Math.sin(t * 0.5) * 0.01)
    }
    if (innerRef.current) {
      innerRef.current.scale.setScalar(1 + Math.sin(t * 0.5 + 0.5) * 0.008)
    }
  })

  return (
    <group>
      <mesh ref={outerRef}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshBasicMaterial
          color="rgb(100,149,237)"
          transparent
          opacity={opacity}
          side={THREE.BackSide}
        />
      </mesh>
      <mesh ref={innerRef} scale={0.98}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshBasicMaterial
          color="rgb(140,180,255)"
          transparent
          opacity={opacity * 0.4}
          side={THREE.FrontSide}
        />
      </mesh>
      <mesh scale={1.02}>
        <sphereGeometry args={[5, 64, 64]} />
        <meshBasicMaterial
          color="rgb(160,200,255)"
          transparent
          opacity={opacity * 0.15}
          wireframe
        />
      </mesh>
    </group>
  )
}
