import React, { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { Skill } from './types'

interface SkillParticleProps {
  skill: Skill
  startTime: number
  onComplete?: () => void
}

interface ParticleData {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
}

const SkillParticle: React.FC<SkillParticleProps> = ({ skill, startTime, onComplete }) => {
  const pointsRef = useRef<THREE.Points>(null)
  const particlesRef = useRef<ParticleData[]>([])
  const hasCompletedRef = useRef(false)

  const particleCount = useMemo(() => {
    const [min, max] = skill.particleCount
    return Math.floor(Math.random() * (max - min + 1)) + min
  }, [skill.particleCount])

  const positions = useMemo(() => new Float32Array(particleCount * 3), [particleCount])
  const colors = useMemo(() => new Float32Array(particleCount * 3), [particleCount])
  const sizes = useMemo(() => new Float32Array(particleCount), [particleCount])

  useMemo(() => {
    const color = new THREE.Color(skill.color)
    particlesRef.current = []

    for (let i = 0; i < particleCount; i++) {
      let velocity: THREE.Vector3
      const speed = 0.5 + Math.random() * 1.5

      switch (skill.effectType) {
        case 'fire': {
          const theta = Math.random() * Math.PI * 2
          const phi = Math.random() * Math.PI * 0.5
          velocity = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            Math.sin(phi) * Math.sin(theta) * speed + 0.5,
            Math.cos(phi) * speed
          )
          break
        }
        case 'ice': {
          const angle = Math.random() * Math.PI * 2
          velocity = new THREE.Vector3(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed * 0.5,
            Math.sin(angle) * speed
          )
          break
        }
        case 'lightning': {
          velocity = new THREE.Vector3(
            (Math.random() - 0.5) * speed * 2,
            (Math.random() - 0.5) * speed * 2,
            (Math.random() - 0.5) * speed * 2
          )
          break
        }
        case 'wind': {
          const angle = Math.random() * Math.PI * 2
          velocity = new THREE.Vector3(
            Math.cos(angle) * speed * 1.5,
            (Math.random() - 0.5) * 0.3,
            Math.sin(angle) * speed * 1.5
          )
          break
        }
        case 'shadow': {
          const theta = Math.random() * Math.PI * 2
          const phi = Math.random() * Math.PI
          velocity = new THREE.Vector3(
            Math.sin(phi) * Math.cos(theta) * speed,
            -Math.abs(Math.cos(phi)) * speed - 0.3,
            Math.sin(phi) * Math.sin(theta) * speed
          )
          break
        }
        default: {
          velocity = new THREE.Vector3(
            (Math.random() - 0.5) * speed,
            (Math.random() - 0.5) * speed,
            (Math.random() - 0.5) * speed
          )
        }
      }

      const particle: ParticleData = {
        position: new THREE.Vector3(0, 0, 0),
        velocity,
        life: 1.5,
        maxLife: 1.5,
        size: 0.05 + Math.random() * 0.1,
      }
      particlesRef.current.push(particle)

      positions[i * 3] = particle.position.x
      positions[i * 3 + 1] = particle.position.y
      positions[i * 3 + 2] = particle.position.z

      const brightness = 0.7 + Math.random() * 0.3
      colors[i * 3] = color.r * brightness
      colors[i * 3 + 1] = color.g * brightness
      colors[i * 3 + 2] = color.b * brightness

      sizes[i] = particle.size
    }
  }, [skill, particleCount, positions, colors, sizes])

  useFrame((_, delta) => {
    if (!pointsRef.current) return

    const elapsed = (Date.now() - startTime) / 1000

    if (elapsed >= 1.5) {
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true
        onComplete?.()
      }
      return
    }

    const geometry = pointsRef.current.geometry
    const posAttr = geometry.attributes.position as THREE.BufferAttribute
    const alphaAttr = geometry.attributes.opacity as THREE.BufferAttribute

    particlesRef.current.forEach((particle, i) => {
      if (particle.life <= 0) return

      particle.life -= delta

      if (skill.effectType === 'lightning') {
        particle.position.add(particle.velocity.clone().multiplyScalar(delta * 3))
        particle.position.x += (Math.random() - 0.5) * 0.02
        particle.position.y += (Math.random() - 0.5) * 0.02
      } else {
        particle.position.add(particle.velocity.clone().multiplyScalar(delta))
      }

      if (skill.effectType === 'fire') {
        particle.velocity.y += delta * 0.5
      } else if (skill.effectType === 'ice') {
        particle.velocity.multiplyScalar(0.98)
      } else if (skill.effectType === 'shadow') {
        particle.velocity.y -= delta * 0.3
      }

      posAttr.setXYZ(
        i,
        particle.position.x,
        particle.position.y,
        particle.position.z
      )

      const alpha = Math.max(0, particle.life / particle.maxLife)
      const fadeOutStart = 1.0
      if (elapsed > fadeOutStart) {
        alphaAttr.setX(i, alpha * (1 - (elapsed - fadeOutStart) / 0.5))
      } else {
        alphaAttr.setX(i, alpha)
      }
    })

    posAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={particleCount}
          array={colors}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-opacity"
          count={particleCount}
          array={new Float32Array(particleCount).fill(1)}
          itemSize={1}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particleCount}
          array={sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.12}
        vertexColors
        transparent
        opacity={1}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  )
}

export default SkillParticle
