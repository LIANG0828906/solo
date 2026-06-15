import { useRef, useMemo, useCallback } from 'react'
import * as THREE from 'three'

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
}

export const useParticleSystem = (maxParticles: number = 200) => {
  const particlesRef = useRef<Particle[]>([])
  const geometryRef = useRef<THREE.BufferGeometry | null>(null)
  const positionsRef = useRef<Float32Array | null>(null)
  const colorsRef = useRef<Float32Array | null>(null)
  const sizesRef = useRef<Float32Array | null>(null)

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const positions = new Float32Array(maxParticles * 3)
    const colors = new Float32Array(maxParticles * 3)
    const sizes = new Float32Array(maxParticles)

    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3] = 0
      positions[i * 3 + 1] = 0
      positions[i * 3 + 2] = 0
      
      colors[i * 3] = 1.0
      colors[i * 3 + 1] = 0.84
      colors[i * 3 + 2] = 0.0
      
      sizes[i] = 0
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geo.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    const mat = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    })

    geometryRef.current = geo
    positionsRef.current = positions
    colorsRef.current = colors
    sizesRef.current = sizes

    return { geometry: geo, material: mat }
  }, [maxParticles])

  const spawnParticle = useCallback((position: THREE.Vector3, direction: THREE.Vector3) => {
    if (particlesRef.current.length >= maxParticles) {
      const deadParticle = particlesRef.current.find(p => p.life <= 0)
      if (deadParticle) {
        deadParticle.position.copy(position)
        deadParticle.velocity.copy(direction).multiplyScalar(0.02)
        deadParticle.life = 1.0
        deadParticle.maxLife = 1.0
        deadParticle.size = 0.03 + Math.random() * 0.03
      }
    } else {
      particlesRef.current.push({
        position: position.clone(),
        velocity: direction.clone().multiplyScalar(0.02),
        life: 1.0,
        maxLife: 1.0,
        size: 0.03 + Math.random() * 0.03,
      })
    }
  }, [maxParticles])

  const spawnTrailParticles = useCallback((from: THREE.Vector3, to: THREE.Vector3, count: number = 3) => {
    const direction = new THREE.Vector3().subVectors(to, from).normalize()
    for (let i = 0; i < count; i++) {
      const t = i / count
      const pos = new THREE.Vector3().lerpVectors(from, to, t)
      spawnParticle(pos, direction)
    }
  }, [spawnParticle])

  const update = useCallback((delta: number) => {
    const positions = positionsRef.current
    const colors = colorsRef.current
    const sizes = sizesRef.current
    if (!positions || !colors || !sizes) return

    particlesRef.current.forEach((particle, i) => {
      if (particle.life > 0) {
        particle.life -= delta
        particle.position.add(particle.velocity)
        particle.velocity.multiplyScalar(0.98)

        const alpha = Math.max(0, particle.life / particle.maxLife)
        positions[i * 3] = particle.position.x
        positions[i * 3 + 1] = particle.position.y
        positions[i * 3 + 2] = particle.position.z

        colors[i * 3] = 1.0
        colors[i * 3 + 1] = 0.84 * alpha
        colors[i * 3 + 2] = 0.0

        sizes[i] = particle.size * alpha
      } else {
        sizes[i] = 0
      }
    })

    if (geometryRef.current) {
      geometryRef.current.attributes.position.needsUpdate = true
      geometryRef.current.attributes.color.needsUpdate = true
      geometryRef.current.attributes.size.needsUpdate = true
    }
  }, [])

  const reset = useCallback(() => {
    particlesRef.current = []
    if (positionsRef.current && sizesRef.current) {
      for (let i = 0; i < maxParticles; i++) {
        sizesRef.current[i] = 0
      }
      if (geometryRef.current) {
        geometryRef.current.attributes.size.needsUpdate = true
      }
    }
  }, [maxParticles])

  return {
    geometry,
    material,
    spawnParticle,
    spawnTrailParticles,
    update,
    reset,
  }
}
