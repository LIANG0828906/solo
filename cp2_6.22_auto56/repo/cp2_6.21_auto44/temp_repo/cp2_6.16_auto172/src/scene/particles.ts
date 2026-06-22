import * as THREE from 'three'
import { v4 as uuidv4 } from 'uuid'
import { useMeditationStore } from '@/store/meditationStore'

const MAX_PARTICLES = 500
const PARTICLE_LIFE = 8
const PARTICLE_SPEED = 0.2
const FADE_DURATION = 1

interface Particle {
  id: string
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  age: number
  life: number
  angle: number
  radius: number
  angularSpeed: number
  highlighted: boolean
  highlightTime: number
  baseSize: number
}

export class ParticleSystem {
  private scene: THREE.Scene
  private particles: Particle[] = []
  private baseGeometry: THREE.SphereGeometry
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private sphereRadius: number
  private baseColor: THREE.Color
  private targetColor: THREE.Color

  constructor(scene: THREE.Scene, sphereRadius: number) {
    this.scene = scene
    this.sphereRadius = sphereRadius
    this.baseGeometry = new THREE.SphereGeometry(1, 8, 8)
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()
    this.baseColor = new THREE.Color(0x9B59B6)
    this.targetColor = new THREE.Color(0x2C3E50)
  }

  private createParticle(): void {
    if (this.particles.length >= MAX_PARTICLES) {
      this.removeOldestParticle()
    }

    const state = useMeditationStore.getState()
    const angle = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const radius = this.sphereRadius * (0.9 + Math.random() * 0.2)

    const x = radius * Math.sin(phi) * Math.cos(angle)
    const y = radius * Math.sin(phi) * Math.sin(angle)
    const z = radius * Math.cos(phi)

    const size = 0.05 + Math.random() * 0.1
    const hueProgress = state.backgroundHue % 1
    
    const color = new THREE.Color().lerpColors(
      this.baseColor,
      this.targetColor,
      hueProgress
    )

    const material = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0,
    })

    const mesh = new THREE.Mesh(this.baseGeometry, material)
    mesh.position.set(x, y, z)
    mesh.scale.setScalar(size)

    const spiralAngle = angle + (Math.random() - 0.5) * 0.5
    
    const velocity = new THREE.Vector3(
      Math.cos(spiralAngle) * PARTICLE_SPEED * 0.3,
      (Math.random() - 0.5) * PARTICLE_SPEED * 0.2,
      Math.sin(spiralAngle) * PARTICLE_SPEED * 0.3
    ).normalize().multiplyScalar(PARTICLE_SPEED)

    const particle: Particle = {
      id: uuidv4(),
      mesh,
      velocity,
      age: 0,
      life: PARTICLE_LIFE,
      angle: spiralAngle,
      radius: radius,
      angularSpeed: (Math.random() - 0.5) * 0.5,
      highlighted: false,
      highlightTime: 0,
      baseSize: size,
    }

    this.scene.add(mesh)
    this.particles.push(particle)
    
    useMeditationStore.getState().incrementTotalParticles()
  }

  private removeOldestParticle(): void {
    if (this.particles.length === 0) return
    
    const oldest = this.particles.shift()
    if (oldest) {
      this.scene.remove(oldest.mesh)
      ;(oldest.mesh.material as THREE.Material).dispose()
    }
  }

  spawnParticles(delta: number): void {
    const state = useMeditationStore.getState()
    if (!state.isMeditating || state.isPaused) return

    const particlesPerFrame = 1 + Math.floor(Math.random() * 3)
    for (let i = 0; i < particlesPerFrame; i++) {
      this.createParticle()
    }
  }

  private calculateOpacity(particle: Particle): number {
    if (particle.age < 0.5) {
      return (particle.age / 0.5) * 0.8
    }
    
    const fadeStart = particle.life - FADE_DURATION
    if (particle.age > fadeStart) {
      const fadeProgress = (particle.age - fadeStart) / FADE_DURATION
      return 0.8 * (1 - fadeProgress)
    }
    
    return 0.8
  }

  private calculateScale(particle: Particle): number {
    const fadeStart = particle.life - FADE_DURATION
    if (particle.age > fadeStart) {
      const fadeProgress = (particle.age - fadeStart) / FADE_DURATION
      return 1 - fadeProgress * 0.5
    }
    return 1
  }

  update(delta: number): void {
    const state = useMeditationStore.getState()
    
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const particle = this.particles[i]
      
      if (!state.isPaused) {
        particle.age += delta
        
        if (particle.age >= particle.life) {
          this.scene.remove(particle.mesh)
          ;(particle.mesh.material as THREE.Material).dispose()
          this.particles.splice(i, 1)
          continue
        }

        particle.angle += particle.angularSpeed * delta
        particle.radius += PARTICLE_SPEED * delta * 0.5

        const heightOffset = Math.sin(particle.age * 0.5) * 0.1
        
        particle.mesh.position.x = Math.cos(particle.angle) * particle.radius
        particle.mesh.position.z = Math.sin(particle.angle) * particle.radius
        particle.mesh.position.y += particle.velocity.y * delta + heightOffset * delta

        if (particle.highlighted) {
          particle.highlightTime -= delta
          if (particle.highlightTime <= 0) {
            particle.highlighted = false
          }
        }
      }

      const material = particle.mesh.material as THREE.MeshBasicMaterial
      const opacity = this.calculateOpacity(particle)
      material.opacity = particle.highlighted ? Math.min(1, opacity * 2) : opacity
      
      const scale = this.calculateScale(particle)
      particle.mesh.scale.setScalar(scale * particle.baseSize)
    }

    useMeditationStore.getState().setParticleCount(this.particles.length)
  }

  checkMouseHover(camera: THREE.Camera, mouseX: number, mouseY: number): void {
    this.mouse.x = mouseX
    this.mouse.y = mouseY

    this.raycaster.setFromCamera(this.mouse, camera)
    
    const meshes = this.particles.map(p => p.mesh)
    const intersects = this.raycaster.intersectObjects(meshes)

    for (const particle of this.particles) {
      particle.highlighted = false
    }

    if (intersects.length > 0) {
      const hitMesh = intersects[0].object
      const particle = this.particles.find(p => p.mesh === hitMesh)
      if (particle) {
        particle.highlighted = true
        particle.highlightTime = 0.3
      }
    }
  }

  updateColors(hueProgress: number): void {
    const color = new THREE.Color().lerpColors(
      this.baseColor,
      this.targetColor,
      hueProgress
    )

    for (const particle of this.particles) {
      const material = particle.mesh.material as THREE.MeshBasicMaterial
      material.color.copy(color)
    }
  }

  getParticleCount(): number {
    return this.particles.length
  }

  dispose(): void {
    for (const particle of this.particles) {
      this.scene.remove(particle.mesh)
      ;(particle.mesh.material as THREE.Material).dispose()
    }
    this.particles = []
    this.baseGeometry.dispose()
  }
}
