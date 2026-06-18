import * as THREE from 'three'
import { Particle, ConstellationTemplate } from '@/types'
import { useGameStore } from '@/store/useGameStore'

export class ConstellationEffect {
  private particles: Particle[] = []
  private animationId: number | null = null
  private isRunning: boolean = false

  updateParticles(deltaTime: number): void {
    const store = useGameStore.getState()
    const currentParticles = store.particles

    if (currentParticles.length === 0) return

    const updatedParticles = currentParticles
      .map(particle => {
        const newParticle = { ...particle }
        newParticle.life -= deltaTime
        newParticle.opacity = Math.max(0, newParticle.life / newParticle.maxLife)
        newParticle.position = newParticle.position.clone().add(
          newParticle.velocity.clone().multiplyScalar(deltaTime)
        )
        newParticle.velocity.multiplyScalar(0.98)
        return newParticle
      })
      .filter(particle => particle.life > 0)

    store.dispatch({ type: 'UPDATE_PARTICLES', particles: updatedParticles })
  }

  triggerExplosion(constellation: ConstellationTemplate, center: THREE.Vector3): void {
    const store = useGameStore.getState()
    const particleCount = 200
    const newParticles: Particle[] = []

    for (let i = 0; i < particleCount; i++) {
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const speed = 3 + Math.random() * 5

      const velocity = new THREE.Vector3(
        Math.sin(phi) * Math.cos(theta) * speed,
        Math.sin(phi) * Math.sin(theta) * speed,
        Math.cos(phi) * speed
      )

      newParticles.push({
        id: `particle-${Date.now()}-${i}`,
        position: center.clone(),
        velocity,
        color: constellation.themeColor,
        size: 0.1 + Math.random() * 0.3,
        life: 2,
        maxLife: 2,
        opacity: 1
      })
    }

    store.dispatch({ type: 'ADD_PARTICLES', particles: newParticles })
  }

  createStarDustParticles(count: number = 500): THREE.Points {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const offsets = new Float32Array(count)
    const periods = new Float32Array(count)

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      const radius = 15 + Math.random() * 10
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)

      positions[i3] = Math.sin(phi) * Math.cos(theta) * radius
      positions[i3 + 1] = Math.sin(phi) * Math.sin(theta) * radius - 5
      positions[i3 + 2] = Math.cos(phi) * Math.cos(theta) * radius

      const brightness = 0.3 + Math.random() * 0.3
      colors[i3] = brightness
      colors[i3 + 1] = brightness
      colors[i3 + 2] = brightness + 0.1

      sizes[i] = 0.05 + Math.random() * 0.1
      offsets[i] = Math.random() * Math.PI * 2
      periods[i] = 3 + Math.random() * 3
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
    geometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 1))
    geometry.setAttribute('period', new THREE.BufferAttribute(periods, 1))

    const material = new THREE.PointsMaterial({
      size: 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 0.5,
      sizeAttenuation: true
    })

    return new THREE.Points(geometry, material)
  }

  animateStarDust(points: THREE.Points, time: number): void {
    const positions = points.geometry.attributes.position.array as Float32Array
    const offsets = points.geometry.attributes.offset.array as Float32Array
    const periods = points.geometry.attributes.period.array as Float32Array
    const originalPositions = (points.geometry as any).originalPositions

    if (!originalPositions) {
      ;(points.geometry as any).originalPositions = new Float32Array(positions)
      return
    }

    for (let i = 0; i < positions.length / 3; i++) {
      const i3 = i * 3
      const offset = offsets[i]
      const period = periods[i]
      const yOffset = Math.sin(time / period + offset) * 0.2
      positions[i3 + 1] = originalPositions[i3 + 1] + yOffset
    }

    points.geometry.attributes.position.needsUpdate = true
  }

  start(): void {
    if (this.isRunning) return
    this.isRunning = true
    this.animate()
  }

  stop(): void {
    this.isRunning = false
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private animate(): void {
    if (!this.isRunning) return

    const deltaTime = 1 / 60
    this.updateParticles(deltaTime)

    this.animationId = requestAnimationFrame(() => this.animate())
  }
}

export const constellationEffect = new ConstellationEffect()
