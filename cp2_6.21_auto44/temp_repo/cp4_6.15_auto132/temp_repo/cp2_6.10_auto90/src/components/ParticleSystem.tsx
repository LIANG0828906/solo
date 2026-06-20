import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useLockStore } from '../store/useLockStore'
import { PARTICLE_CONFIG } from '../utils/constants'

export const ParticleSystem: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null)
  const particles = useLockStore(state => state.particles)
  const updateParticles = useLockStore(state => state.updateParticles)

  const [positions, colors, sizes] = useMemo(() => {
    const maxParticles = 100
    const positions = new Float32Array(maxParticles * 3)
    const colors = new Float32Array(maxParticles * 3)
    const sizes = new Float32Array(maxParticles)

    const color = new THREE.Color(PARTICLE_CONFIG.color)
    for (let i = 0; i < maxParticles; i++) {
      colors[i * 3] = color.r
      colors[i * 3 + 1] = color.g
      colors[i * 3 + 2] = color.b
    }

    return [positions, colors, sizes]
  }, [])

  useFrame((_, delta) => {
    updateParticles(delta)

    if (particlesRef.current) {
      const geometry = particlesRef.current.geometry
      const positionAttr = geometry.attributes.position as THREE.BufferAttribute
      const sizeAttr = geometry.attributes.size as THREE.BufferAttribute

      const maxParticles = 100
      for (let i = 0; i < maxParticles; i++) {
        if (i < particles.length) {
          const p = particles[i]
          positionAttr.setXYZ(i, p.position.x, p.position.y, p.position.z)
          sizeAttr.setX(i, p.size * (p.life / p.maxLife))
        } else {
          positionAttr.setXYZ(i, -1000, -1000, -1000)
          sizeAttr.setX(i, 0)
        }
      }

      positionAttr.needsUpdate = true
      sizeAttr.needsUpdate = true
    }
  })

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={100}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={100}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={100}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={2}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}
