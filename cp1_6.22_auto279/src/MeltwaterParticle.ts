import * as THREE from 'three'
import { randomRange, clamp } from './utils'

interface Particle {
  mesh: THREE.Mesh
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  baseOpacity: number
}

interface MeltwaterLake {
  mesh: THREE.Mesh
  position: THREE.Vector3
  majorAxis: number
  minorAxis: number
  rotation: number
  opacity: number
  rippleTime: number
  particles: Particle[]
}

export class MeltwaterParticle {
  private scene: THREE.Scene
  private meltwaterGroup: THREE.Group
  private lakes: MeltwaterLake[] = []
  private particlePool: Particle[] = []
  private maxParticles: number = 500
  private activeParticles: number = 0

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.meltwaterGroup = new THREE.Group()
    this.scene.add(this.meltwaterGroup)
    this.initializeParticlePool()
  }

  private initializeParticlePool(): void {
    const geometry = new THREE.SphereGeometry(0.1, 8, 8)
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    })

    for (let i = 0; i < this.maxParticles; i++) {
      const mesh = new THREE.Mesh(geometry.clone(), material.clone())
      mesh.visible = false
      this.meltwaterGroup.add(mesh)

      this.particlePool.push({
        mesh,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 3,
        size: 0.1,
        baseOpacity: 0.8,
      })
    }
  }

  createMeltwaterLake(
    x: number,
    z: number,
    surfaceY: number,
    temperature: number
  ): void {
    if (temperature <= 0) return

    const majorAxis = randomRange(10, 25) * 0.1
    const minorAxis = randomRange(8, 18) * 0.1
    const opacity = randomRange(0.4, 0.7)
    const rotation = randomRange(0, Math.PI * 2)

    const lakeGeometry = new THREE.CircleGeometry(1, 32)
    const lakeMaterial = new THREE.MeshBasicMaterial({
      color: 0x006994,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      depthWrite: false,
    })

    const lakeMesh = new THREE.Mesh(lakeGeometry, lakeMaterial)
    lakeMesh.rotation.x = -Math.PI / 2
    lakeMesh.rotation.z = rotation
    lakeMesh.scale.set(majorAxis, minorAxis, 1)
    lakeMesh.position.set(x, surfaceY + 0.02, z)

    this.meltwaterGroup.add(lakeMesh)

    const lake: MeltwaterLake = {
      mesh: lakeMesh,
      position: new THREE.Vector3(x, surfaceY + 0.02, z),
      majorAxis,
      minorAxis,
      rotation,
      opacity,
      rippleTime: 0,
      particles: [],
    }

    this.lakes.push(lake)
    this.createRippleParticles(lake, temperature)
  }

  private createRippleParticles(lake: MeltwaterLake, temperature: number): void {
    const particleCount = Math.floor(randomRange(10, 20))
    const tempFactor = clamp(temperature / 10, 0.5, 1.5)

    for (let i = 0; i < particleCount; i++) {
      const particle = this.getParticleFromPool()
      if (!particle) break

      const angle = randomRange(0, Math.PI * 2)
      const radius = randomRange(0, Math.min(lake.majorAxis, lake.minorAxis) * 0.8)

      const px = lake.position.x + Math.cos(angle) * radius
      const pz = lake.position.z + Math.sin(angle) * radius

      particle.position.set(px, lake.position.y + 0.01, pz)
      particle.velocity.set(
        Math.cos(angle) * randomRange(0.2, 0.5) * tempFactor,
        randomRange(0.05, 0.15),
        Math.sin(angle) * randomRange(0.2, 0.5) * tempFactor
      )
      particle.life = 3
      particle.maxLife = 3
      particle.size = randomRange(0.05, 0.15)
      particle.baseOpacity = 0.8

      particle.mesh.position.copy(particle.position)
      particle.mesh.scale.setScalar(particle.size)
      particle.mesh.visible = true
      ;(particle.mesh.material as THREE.MeshBasicMaterial).opacity = 0.8

      lake.particles.push(particle)
    }
  }

  private getParticleFromPool(): Particle | null {
    for (const particle of this.particlePool) {
      if (particle.life <= 0) {
        return particle
      }
    }

    if (this.activeParticles < this.maxParticles) {
      const geometry = new THREE.SphereGeometry(0.1, 8, 8)
      const material = new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      })

      const mesh = new THREE.Mesh(geometry, material)
      mesh.visible = false
      this.meltwaterGroup.add(mesh)

      const newParticle: Particle = {
        mesh,
        position: new THREE.Vector3(),
        velocity: new THREE.Vector3(),
        life: 0,
        maxLife: 3,
        size: 0.1,
        baseOpacity: 0.8,
      }

      this.particlePool.push(newParticle)
      return newParticle
    }

    return null
  }

  update(deltaTime: number): void {
    this.activeParticles = 0

    for (let i = this.lakes.length - 1; i >= 0; i--) {
      const lake = this.lakes[i]
      lake.rippleTime += deltaTime

      const lakeMaterial = lake.mesh.material as THREE.MeshBasicMaterial
      if (lakeMaterial.opacity < lake.opacity) {
        lakeMaterial.opacity = Math.min(
          lake.opacity,
          lakeMaterial.opacity + deltaTime * 0.5
        )
      }

      for (let j = lake.particles.length - 1; j >= 0; j--) {
        const particle = lake.particles[j]
        particle.life -= deltaTime

        if (particle.life <= 0) {
          particle.mesh.visible = false
          ;(particle.mesh.material as THREE.MeshBasicMaterial).opacity = 0
          lake.particles.splice(j, 1)
          continue
        }

        this.activeParticles++

        particle.position.add(
          particle.velocity.clone().multiplyScalar(deltaTime)
        )
        particle.velocity.y -= deltaTime * 0.1

        const lifeRatio = particle.life / particle.maxLife
        const rippleScale = 1 + (1 - lifeRatio) * 2
        particle.mesh.position.copy(particle.position)
        particle.mesh.scale.setScalar(particle.size * rippleScale)

        const material = particle.mesh.material as THREE.MeshBasicMaterial
        material.opacity = particle.baseOpacity * lifeRatio
      }

      if (lake.particles.length === 0 && lake.rippleTime > 5) {
        this.removeLake(lake, i)
      }
    }
  }

  private removeLake(lake: MeltwaterLake, index: number): void {
    const material = lake.mesh.material as THREE.MeshBasicMaterial
    const fadeOut = setInterval(() => {
      material.opacity -= 0.05
      if (material.opacity <= 0) {
        clearInterval(fadeOut)
        this.meltwaterGroup.remove(lake.mesh)
        lake.mesh.geometry.dispose()
        material.dispose()
      }
    }, 50)

    this.lakes.splice(index, 1)
  }

  reset(): void {
    for (const lake of this.lakes) {
      this.meltwaterGroup.remove(lake.mesh)
      lake.mesh.geometry.dispose()
      const material = lake.mesh.material as THREE.MeshBasicMaterial
      material.dispose()

      for (const particle of lake.particles) {
        particle.mesh.visible = false
        ;(particle.mesh.material as THREE.MeshBasicMaterial).opacity = 0
        particle.life = 0
      }
    }

    this.lakes = []
  }

  getLakeCount(): number {
    return this.lakes.length
  }

  getActiveParticleCount(): number {
    return this.activeParticles
  }

  dispose(): void {
    this.reset()

    for (const particle of this.particlePool) {
      particle.mesh.geometry.dispose()
      const material = particle.mesh.material as THREE.MeshBasicMaterial
      material.dispose()
      this.meltwaterGroup.remove(particle.mesh)
    }

    this.particlePool = []
    this.scene.remove(this.meltwaterGroup)
  }
}
