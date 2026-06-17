import * as THREE from 'three'
import { gsap } from 'gsap'
import { eventBus, EVENTS } from '../core/EventBus'

interface Particle {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  life: number
  maxLife: number
  active: boolean
}

export class EffectsModule {
  private scene: THREE.Scene
  private camera: THREE.PerspectiveCamera

  private glowPulseMeshes: Map<string, THREE.Mesh> = new Map()
  private screenFlashMesh: THREE.Mesh | null = null

  private particlePool: Particle[] = []
  private maxParticles: number = 500
  private particleEmissionRate: number = 50
  private particleEmissionAccumulator: number = 0
  private activeParticles: number = 0

  private trailParticles: Particle[] = []
  private maxTrailParticles: number = 100

  private isRunning: boolean = true

  constructor(scene: THREE.Scene, camera: THREE.PerspectiveCamera) {
    this.scene = scene
    this.camera = camera
    this.bindEvents()
    this.initScreenFlash()
    this.initParticlePool()
  }

  private bindEvents(): void {
    eventBus.on(EVENTS.EFFECTS_GLOW_PULSE, this.handleGlowPulse.bind(this))
    eventBus.on(EVENTS.EFFECTS_SCREEN_FLASH, this.handleScreenFlash.bind(this))
    eventBus.on(EVENTS.EFFECTS_SHARD_PICKUP, this.handleShardPickup.bind(this))
    eventBus.on(EVENTS.GAME_RESTART, this.handleRestart.bind(this))
  }

  private initScreenFlash(): void {
    const geometry = new THREE.PlaneGeometry(10, 10)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthTest: false,
      depthWrite: false,
    })

    this.screenFlashMesh = new THREE.Mesh(geometry, material)
    this.screenFlashMesh.position.set(0, 0, -1)
    this.camera.add(this.screenFlashMesh)
    this.scene.add(this.camera)
  }

  private initParticlePool(): void {
    for (let i = 0; i < this.maxParticles; i++) {
      const geometry = new THREE.SphereGeometry(0.1, 4, 4)
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff88,
        transparent: true,
        opacity: 0,
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.visible = false
      this.scene.add(mesh)

      this.particlePool.push({
        mesh,
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 1,
        active: false,
      })
    }
  }

  private handleGlowPulse(data: {
    position: { x: number; y: number; z: number }
    color: string
    duration: number
    maxRadius: number
  }): void {
    const id = `glow_${Date.now()}_${Math.random()}`

    const geometry = new THREE.RingGeometry(0, 0.1, 32)
    const material = new THREE.MeshBasicMaterial({
      color: new THREE.Color(data.color),
      transparent: true,
      opacity: 0.6,
      side: THREE.DoubleSide,
      depthWrite: false,
    })

    const glowMesh = new THREE.Mesh(geometry, material)
    glowMesh.position.set(data.position.x, data.position.y, data.position.z)
    glowMesh.lookAt(this.camera.position)

    this.scene.add(glowMesh)
    this.glowPulseMeshes.set(id, glowMesh)

    gsap.to(glowMesh.scale, {
      x: data.maxRadius,
      y: data.maxRadius,
      z: data.maxRadius,
      duration: data.duration,
      ease: 'power2.out',
    })

    gsap.to(material, {
      opacity: 0,
      duration: data.duration,
      ease: 'power2.out',
      onComplete: () => {
        this.scene.remove(glowMesh)
        geometry.dispose()
        material.dispose()
        this.glowPulseMeshes.delete(id)
      },
    })
  }

  private handleScreenFlash(data: {
    color: string
    opacity: number
    duration: number
    borderOnly?: boolean
    borderWidth?: number
  }): void {
    if (!this.screenFlashMesh) return

    const material = this.screenFlashMesh.material as THREE.MeshBasicMaterial

    material.color.set(data.color)

    gsap.fromTo(
      material,
      { opacity: data.opacity },
      {
        opacity: 0,
        duration: data.duration,
        ease: 'power1.out',
      }
    )
  }

  private handleShardPickup(data: {
    id: string
    position: { x: number; y: number; z: number }
  }): void {
    this.emitParticles(data.position, 20, 0x00ff88, 0.5)
  }

  private emitParticles(
    position: { x: number; y: number; z: number },
    count: number,
    color: number,
    life: number
  ): void {
    let emitted = 0

    for (const particle of this.particlePool) {
      if (emitted >= count) break
      if (particle.active) continue

      particle.mesh.position.set(position.x, position.y, position.z)
      particle.mesh.visible = true

      const material = particle.mesh.material as THREE.MeshBasicMaterial
      material.color.setHex(color)
      material.opacity = 1

      const angle = Math.random() * Math.PI * 2
      const speed = 2 + Math.random() * 3
      particle.velocity.set(
        Math.cos(angle) * speed,
        (Math.random() - 0.5) * speed,
        Math.sin(angle) * speed
      )

      particle.life = life
      particle.maxLife = life
      particle.active = true

      emitted++
      this.activeParticles++
    }
  }

  private handleRestart(): void {
    this.glowPulseMeshes.forEach((mesh) => {
      this.scene.remove(mesh)
      if (mesh.geometry) mesh.geometry.dispose()
      if (mesh.material) {
        if (Array.isArray(mesh.material)) {
          mesh.material.forEach((m) => m.dispose())
        } else {
          mesh.material.dispose()
        }
      }
    })
    this.glowPulseMeshes.clear()

    for (const particle of this.particlePool) {
      particle.active = false
      particle.mesh.visible = false
      particle.life = 0
    }
    this.activeParticles = 0
  }

  update(deltaTime: number): void {
    if (!this.isRunning) return

    this.updateParticles(deltaTime)
    this.updateGlowPulses()
  }

  private updateParticles(deltaTime: number): void {
    for (const particle of this.particlePool) {
      if (!particle.active) continue

      particle.life -= deltaTime

      if (particle.life <= 0) {
        particle.active = false
        particle.mesh.visible = false
        this.activeParticles--
        continue
      }

      particle.mesh.position.x += particle.velocity.x * deltaTime
      particle.mesh.position.y += particle.velocity.y * deltaTime
      particle.mesh.position.z += particle.velocity.z * deltaTime

      particle.velocity.multiplyScalar(0.98)

      const material = particle.mesh.material as THREE.MeshBasicMaterial
      material.opacity = (particle.life / particle.maxLife) * 0.8

      const scale = particle.life / particle.maxLife
      particle.mesh.scale.setScalar(Math.max(0.1, scale))
    }
  }

  private updateGlowPulses(): void {
    this.glowPulseMeshes.forEach((mesh) => {
      mesh.lookAt(this.camera.position)
    })
  }

  getActiveParticles(): number {
    return this.activeParticles
  }

  getMaxParticles(): number {
    return this.maxParticles
  }

  dispose(): void {
    this.isRunning = false

    this.particlePool.forEach((p) => {
      p.mesh.geometry.dispose()
      ;(p.mesh.material as THREE.Material).dispose()
      this.scene.remove(p.mesh)
    })

    this.glowPulseMeshes.forEach((mesh) => {
      mesh.geometry.dispose()
      if (Array.isArray(mesh.material)) {
        mesh.material.forEach((m) => m.dispose())
      } else {
        mesh.material.dispose()
      }
      this.scene.remove(mesh)
    })
  }
}
