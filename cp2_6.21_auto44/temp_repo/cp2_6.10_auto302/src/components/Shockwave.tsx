import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useStore, Shockwave as ShockwaveType } from '@/store/useStore'

interface ShockwaveProps {
  shockwave: ShockwaveType
}

const SHOCKWAVE_DURATION = 1500
const MAX_RADIUS = 8

export function Shockwave({ shockwave }: ShockwaveProps) {
  const ringRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const removeShockwave = useStore((state) => state.removeShockwave)

  useEffect(() => {
    const timer = setTimeout(() => {
      removeShockwave(shockwave.id)
    }, SHOCKWAVE_DURATION)
    return () => clearTimeout(timer)
  }, [shockwave.id, removeShockwave])

  useFrame(() => {
    const elapsed = Date.now() - shockwave.startTime
    const progress = Math.min(elapsed / SHOCKWAVE_DURATION, 1)
    
    const radius = progress * MAX_RADIUS
    const opacity = 1 - progress

    if (ringRef.current) {
      ringRef.current.scale.setScalar(radius)
      const material = ringRef.current.material as THREE.MeshBasicMaterial
      material.opacity = opacity * 0.8
    }

    if (glowRef.current) {
      glowRef.current.scale.setScalar(radius * 1.5)
      const material = glowRef.current.material as THREE.MeshBasicMaterial
      material.opacity = opacity * 0.3
    }
  })

  return (
    <group position={shockwave.position}>
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.05, 16, 128]} />
        <meshBasicMaterial
          color={shockwave.color}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={glowRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1, 0.2, 16, 64]} />
        <meshBasicMaterial
          color={shockwave.color}
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
