import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import type { PulseEffectData } from '@/types'

interface PulseEffectProps {
  pulse: PulseEffectData
}

export const PulseEffect = ({ pulse }: PulseEffectProps) => {
  const ring1Ref = useRef<THREE.Mesh>(null)
  const ring2Ref = useRef<THREE.Mesh>(null)
  const ring3Ref = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)
  const startTime = useRef(Date.now())

  const particleGeometry = useMemo(() => {
    const count = 100
    const positions = new Float32Array(count * 3)
    const velocities = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)

    const baseColor = new THREE.Color(pulse.color)

    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.random() * Math.PI
      const speed = 0.5 + Math.random() * 1

      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed
      velocities[i * 3 + 2] = Math.cos(phi) * speed

      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0

      const colorVariation = 0.5 + Math.random() * 0.5
      colors[i * 3] = baseColor.r * colorVariation
      colors[i * 3 + 1] = baseColor.g * colorVariation
      colors[i * 3 + 2] = baseColor.b * colorVariation
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

    return geometry
  }, [pulse.color])

  useFrame((_, delta) => {
    const elapsed = (Date.now() - startTime.current) / 1000
    const progress = Math.min(elapsed / 1.5, 1)
    const easeOut = 1 - Math.pow(1 - progress, 3)

    if (ring1Ref.current) {
      const scale = 1 + easeOut * 5
      ring1Ref.current.scale.setScalar(scale)
      const material = ring1Ref.current.material as THREE.MeshBasicMaterial
      material.opacity = Math.max(0, 1 - easeOut)
    }

    if (ring2Ref.current) {
      const scale = 1 + easeOut * 4
      ring2Ref.current.scale.setScalar(scale)
      const material = ring2Ref.current.material as THREE.MeshBasicMaterial
      material.opacity = Math.max(0, 0.8 - easeOut * 0.8)
    }

    if (ring3Ref.current) {
      const scale = 1 + easeOut * 6
      ring3Ref.current.scale.setScalar(scale)
      const material = ring3Ref.current.material as THREE.MeshBasicMaterial
      material.opacity = Math.max(0, 0.6 - easeOut * 0.6)
    }

    if (particlesRef.current && particlesRef.current.geometry) {
      const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
      const velocities = particlesRef.current.geometry.attributes.velocity.array as Float32Array

      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3] += velocities[i * 3] * delta * 3
        positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * 3
        positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * 3

        velocities[i * 3] *= 0.98
        velocities[i * 3 + 1] *= 0.98
        velocities[i * 3 + 2] *= 0.98
      }

      particlesRef.current.geometry.attributes.position.needsUpdate = true

      const material = particlesRef.current.material as THREE.PointsMaterial
      material.opacity = Math.max(0, 1 - easeOut)
      material.size = 0.1 + (1 - easeOut) * 0.1
    }
  })

  const color = new THREE.Color(pulse.color)

  return (
    <group position={pulse.position}>
      <mesh ref={ring1Ref}>
        <torusGeometry args={[0.5, 0.05, 16, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={1}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={ring2Ref} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.03, 16, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.8}
          side={THREE.DoubleSide}
        />
      </mesh>

      <mesh ref={ring3Ref} rotation={[Math.PI / 3, Math.PI / 4, 0]}>
        <torusGeometry args={[0.5, 0.02, 16, 32]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      <points ref={particlesRef} geometry={particleGeometry}>
        <pointsMaterial
          vertexColors
          size={0.15}
          transparent
          opacity={1}
          sizeAttenuation
          blending={THREE.AdditiveBlending}
        />
      </points>
    </group>
  )
}
