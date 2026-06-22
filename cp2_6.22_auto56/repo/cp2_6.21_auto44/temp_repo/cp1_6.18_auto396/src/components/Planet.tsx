import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PlanetData } from '@/types'
import { createPlanetTexture } from '@/utils/noise'

interface PlanetProps {
  planet: PlanetData
  radius: number
  distance: number
  orbitalSpeed: number
  rotationSpeed: number
  isSelected: boolean
  onClick: () => void
  onDoubleClick: () => void
}

export function Planet({
  planet,
  radius,
  distance,
  orbitalSpeed,
  rotationSpeed,
  isSelected,
  onClick,
  onDoubleClick,
}: PlanetProps) {
  const groupRef = useRef<THREE.Group>(null)
  const planetRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const highlightRef = useRef<THREE.Mesh>(null)
  const angleRef = useRef(Math.random() * Math.PI * 2)

  const texture = useMemo(
    () => createPlanetTexture(planet.color, planet.hasContinents, planet.secondaryColor),
    [planet.color, planet.hasContinents, planet.secondaryColor]
  )

  useFrame((state, delta) => {
    angleRef.current += orbitalSpeed * delta

    if (groupRef.current) {
      groupRef.current.position.x = Math.cos(angleRef.current) * distance
      groupRef.current.position.z = Math.sin(angleRef.current) * distance
    }

    if (planetRef.current) {
      planetRef.current.rotation.y += rotationSpeed * delta
    }

    if (highlightRef.current && isSelected) {
      const time = state.clock.elapsedTime
      const pulse = 1 + Math.sin(time * (Math.PI * 2) / 1.5) * 0.3
      highlightRef.current.scale.setScalar(pulse)
      const material = highlightRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.3 + Math.sin(time * (Math.PI * 2) / 1.5) * 0.2
    }
  })

  const handleClick = (e: any) => {
    e.stopPropagation()
    onClick()
  }

  const handleDoubleClick = (e: any) => {
    e.stopPropagation()
    onDoubleClick()
  }

  return (
    <group ref={groupRef}>
      <mesh
        ref={planetRef}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
      >
        <sphereGeometry args={[radius, 16, 16]} />
        <meshStandardMaterial
          map={texture}
          color={planet.color}
          roughness={0.8}
        />
      </mesh>

      {planet.name === '土星' && (
        <mesh ref={ringRef} rotation={[Math.PI / 2.5, 0, 0]}>
          <ringGeometry args={[radius * 1.4, radius * 2.2, 32]} />
          <meshStandardMaterial
            color="#D4AF37"
            side={THREE.DoubleSide}
            transparent
            opacity={0.8}
          />
        </mesh>
      )}

      {isSelected && (
        <mesh ref={highlightRef}>
          <sphereGeometry args={[radius * 1.3, 16, 16]} />
          <meshBasicMaterial
            color={planet.color}
            transparent
            opacity={0.3}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  )
}
