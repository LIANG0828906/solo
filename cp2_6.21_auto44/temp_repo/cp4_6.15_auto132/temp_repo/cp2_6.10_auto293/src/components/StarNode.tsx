import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { StarNode as StarNodeType } from '@/types'

interface StarNodeProps {
  node: StarNodeType
  isSelected: boolean
  isConnecting: boolean
  signalStrength: number
  mode: 'normal' | 'spectrum'
  onClick: (e: any) => void
  onPointerDown: (e: any) => void
}

export const StarNode = ({
  node,
  isSelected,
  isConnecting,
  signalStrength,
  mode,
  onClick,
  onPointerDown
}: StarNodeProps) => {
  const meshRef = useRef<THREE.Mesh>(null)
  const glowRef = useRef<THREE.Mesh>(null)
  const beamRef = useRef<THREE.Points>(null)
  const groupRef = useRef<THREE.Group>(null)

  const beamGeometry = useMemo(() => {
    const positions = new Float32Array(200 * 3)
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2
      const radius = 0.8 + Math.random() * 0.5
      const height = (Math.random() - 0.5) * 0.1
      positions[i * 3] = Math.cos(angle) * radius
      positions[i * 3 + 1] = height
      positions[i * 3 + 2] = Math.sin(angle) * radius
    }
    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return geometry
  }, [])

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += node.rotationSpeed
      meshRef.current.rotation.x += node.rotationSpeed * 0.5
    }
    if (glowRef.current) {
      const pulse = 1 + Math.sin(state.clock.elapsedTime * 2) * 0.1
      glowRef.current.scale.setScalar(pulse)
    }
    if (beamRef.current && beamRef.current.geometry) {
      const positions = beamRef.current.geometry.attributes.position.array as Float32Array
      for (let i = 0; i < 200; i++) {
        const i3 = i * 3
        const speed = 0.02 + Math.random() * 0.02
        const currentRadius = Math.sqrt(
          positions[i3] ** 2 + positions[i3 + 2] ** 2
        )
        const newRadius = currentRadius + speed * delta * 30
        if (newRadius > 2.5) {
          const angle = Math.random() * Math.PI * 2
          positions[i3] = Math.cos(angle) * 0.8
          positions[i3 + 1] = (Math.random() - 0.5) * 0.1
          positions[i3 + 2] = Math.sin(angle) * 0.8
        } else {
          const angle = Math.atan2(positions[i3 + 2], positions[i3])
          positions[i3] = Math.cos(angle) * newRadius
          positions[i3 + 2] = Math.sin(angle) * newRadius
        }
      }
      beamRef.current.geometry.attributes.position.needsUpdate = true
    }
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1
    }
  })

  const baseColor = mode === 'spectrum' 
    ? new THREE.Color().setHSL((Date.now() * 0.0001 + node.position[0] * 0.1) % 1, 1, 0.6)
    : new THREE.Color(node.color)

  const glowIntensity = isSelected ? 1.5 : isConnecting ? 1.2 : 1
  const scaleMultiplier = isSelected ? 1.2 : 1

  return (
    <group position={node.position}>
      <group ref={groupRef}>
        <mesh
          ref={meshRef}
          onClick={onClick}
          onPointerDown={onPointerDown}
          scale={scaleMultiplier}
        >
          <icosahedronGeometry args={[0.5, 4]} />
          <meshStandardMaterial
            color={baseColor}
            emissive={baseColor}
            emissiveIntensity={0.8 * (signalStrength / 100) * glowIntensity}
            metalness={0.8}
            roughness={0.2}
          />
        </mesh>

        <mesh ref={glowRef} scale={1.2}>
          <icosahedronGeometry args={[0.55, 3]} />
          <meshBasicMaterial
            color={baseColor}
            transparent
            opacity={0.3 * glowIntensity}
            side={THREE.BackSide}
          />
        </mesh>

        <points ref={beamRef} geometry={beamGeometry}>
          <pointsMaterial
            color={baseColor}
            size={0.03}
            transparent
            opacity={0.8 * (signalStrength / 100)}
            sizeAttenuation
          />
        </points>

        {isConnecting && (
          <mesh>
            <ringGeometry args={[0.7, 0.75, 32]} />
            <meshBasicMaterial
              color="#00d4ff"
              transparent
              opacity={0.8}
              side={THREE.DoubleSide}
            />
          </mesh>
        )}

        {isSelected && (
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.8, 0.02, 16, 32]} />
            <meshBasicMaterial
              color="#a855f7"
              transparent
              opacity={0.9}
            />
          </mesh>
        )}
      </group>
    </group>
  )
}
