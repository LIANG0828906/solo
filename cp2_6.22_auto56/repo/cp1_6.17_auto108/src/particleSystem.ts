import * as THREE from 'three'
import type { Emitter } from 'mitt'
import type { BuildingData } from './buildingScene'

export interface ClimateParams {
  type: string
  particleColor: number
  particleCount: number
  windSpeed: number
  fallAngle: number
  wobble: boolean
  opacity: number
}

export type AppEvents = {
  'climate-change': ClimateParams
}

interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  age: number
  maxAge: number
  active: boolean
  inVortex: boolean
  vortexTime: number
  vortexMaxTime: number
  vortexCenter: THREE.Vector3
  bornAt: number
}

const CLIMATE_PRESETS: Record<string, ClimateParams> = {
  sunny: {
    type: 'sunny',
    particleColor: 0xFFFFFF,
    particleCount: 300,
    windSpeed: 2,
    fallAngle: 0,
    wobble: false,
    opacity: 0.7
  },
  rain: {
    type: 'rain',
    particleColor: 0x4682B4,
    particleCount: 500,
    windSpeed: 2.5,
    fallAngle: -15,
    wobble: false,
    opacity: 0.6
  },
  snow: {
    type: 'snow',
    particleColor: 0xF0F8FF,
    particleCount: 200,
    windSpeed: 0.8,
    fallAngle: -3,
    wobble: true,
    opacity: 0.85
  },
  fog: {
    type: 'fog',
    particleColor: 0xC0C0C0,
    particleCount: 150,
    windSpeed: 1,
    fallAngle: 0,
    wobble: false,
    opacity: 0.3
  }
}

export class ParticleSystem {
  private particles: Particle[]
  private maxParticles = 500
  private buildings: BuildingData[]
  private emitter: Emitter<AppEvents>
  private climate: ClimateParams
  private geometry: THREE.BufferGeometry
  private positionAttr: THREE.BufferAttribute
  private points: THREE.Points
  private emitAccumulator = 0
  private totalLifetimeAccum = 0
  private totalLivedParticles = 0

  constructor(
    scene: THREE.Scene,
    buildings: BuildingData[],
    emitter: Emitter<AppEvents>
  ) {
    this.buildings = buildings
    this.emitter = emitter
    this.climate = { ...CLIMATE_PRESETS.sunny }

    this.particles = []
    for (let i = 0; i < this.maxParticles; i++) {
      this.particles.push(this.createParticle())
    }

    const positions = new Float32Array(this.maxParticles * 3)
    this.geometry = new THREE.BufferGeometry()
    this.positionAttr = new THREE.BufferAttribute(positions, 3)
    this.geometry.setAttribute('position', this.positionAttr)
    this.geometry.setDrawRange(0, 0)

    const material = new THREE.PointsMaterial({
      color: this.climate.particleColor,
      size: 4,
      transparent: true,
      opacity: this.climate.opacity,
      sizeAttenuation: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    })

    this.points = new THREE.Points(this.geometry, material)
    scene.add(this.points)

    this.emitter.on('climate-change', (params) => {
      this.applyClimate(params)
    })
  }

  private createParticle(): Particle {
    return {
      position: new THREE.Vector3(),
      velocity: new THREE.Vector3(),
      age: 0,
      maxAge: 8 + Math.random() * 6,
      active: false,
      inVortex: false,
      vortexTime: 0,
      vortexMaxTime: 2 + Math.random() * 2,
      vortexCenter: new THREE.Vector3(),
      bornAt: 0
    }
  }

  private applyClimate(params: ClimateParams): void {
    this.climate = { ...params }
    const mat = this.points.material as THREE.PointsMaterial
    mat.color.setHex(params.particleColor)
    mat.opacity = params.opacity
    mat.needsUpdate = true
  }

  private emitParticle(): void {
    for (const p of this.particles) {
      if (!p.active) {
        p.active = true
        p.age = 0
        p.maxAge = 8 + Math.random() * 6
        p.inVortex = false
        p.vortexTime = 0
        p.bornAt = performance.now() / 1000

        const y = 1 + Math.random() * 18
        const z = -20 + Math.random() * 40
        p.position.set(-35, y, z)

        const speed = this.climate.windSpeed * (0.5 + Math.random() * 1.0)
        const angleRad = (this.climate.fallAngle * Math.PI) / 180
        p.velocity.set(
          speed,
          Math.sin(angleRad) * speed * 0.3,
          (Math.random() - 0.5) * 0.3
        )
        return
      }
    }
  }

  update(dt: number, now: number): void {
    if (dt > 0.1) dt = 0.1

    const targetCount = this.climate.particleCount
    const emitRate = targetCount / 4
    this.emitAccumulator += emitRate * dt
    while (this.emitAccumulator >= 1) {
      this.emitParticle()
      this.emitAccumulator -= 1
    }

    const windDir = new THREE.Vector3(1, 0, 0)

    for (const p of this.particles) {
      if (!p.active) continue

      p.age += dt

      if (p.age > p.maxAge) {
        this.recordDeath(p)
        p.active = false
        continue
      }

      if (p.position.x > 40 || p.position.y < -2 || p.position.y > 25) {
        this.recordDeath(p)
        p.active = false
        continue
      }

      if (this.climate.wobble) {
        const wobbleOffset = Math.sin(p.age * 2.5 + p.position.x * 0.3) * 0.6
        p.velocity.z = wobbleOffset
        p.velocity.y = -0.3 + Math.sin(p.age * 1.5) * 0.2
      }

      if (p.inVortex) {
        this.applyVortex(p, dt)
      } else {
        this.checkWakeZone(p)

        const nextPos = p.position.clone().add(
          p.velocity.clone().multiplyScalar(dt)
        )

        let collided = false
        for (const b of this.buildings) {
          if (b.boundingBox.containsPoint(nextPos)) {
            this.handleCollision(p, b, nextPos)
            collided = true
            break
          }
        }

        if (!collided) {
          p.position.copy(nextPos)
        }
      }
    }

    this.updateGeometry()
  }

  private checkWakeZone(p: Particle): void {
    for (const b of this.buildings) {
      if (b.wakeZone.containsPoint(p.position)) {
        if (!p.inVortex && p.velocity.x > 0.3) {
          p.inVortex = true
          p.vortexTime = 0
          p.vortexMaxTime = 2 + Math.random() * 2
          p.vortexCenter.copy(b.position)
          p.vortexCenter.x = b.boundingBox.max.x + 1
          p.vortexCenter.y = b.height * 0.5
          p.vortexCenter.z = b.position.z
        }
        return
      }
    }
  }

  private applyVortex(p: Particle, dt: number): void {
    p.vortexTime += dt

    if (p.vortexTime > p.vortexMaxTime) {
      p.inVortex = false
      const speed = this.climate.windSpeed * (0.5 + Math.random() * 0.5)
      p.velocity.set(speed, (Math.random() - 0.5) * 0.3, (Math.random() - 0.5) * 0.5)
      return
    }

    const vortexSpeed = 0.2 + Math.random() * 0.3
    const angle = p.vortexTime * 3.0
    const radius = 1.5 + Math.sin(p.vortexTime * 0.8) * 0.8

    const offsetX = Math.cos(angle) * radius * 0.5
    const offsetZ = Math.sin(angle) * radius
    const offsetY = Math.sin(p.vortexTime * 1.2) * 0.3

    const target = new THREE.Vector3(
      p.vortexCenter.x + offsetX,
      p.vortexCenter.y + offsetY,
      p.vortexCenter.z + offsetZ
    )

    p.position.lerp(target, dt * 2)
    p.velocity.set(
      vortexSpeed + Math.cos(angle) * 0.3,
      offsetY * 0.2,
      Math.sin(angle) * vortexSpeed
    )
  }

  private handleCollision(
    p: Particle,
    building: BuildingData,
    nextPos: THREE.Vector3
  ): void {
    const box = building.boundingBox

    const dl = Math.abs(nextPos.x - box.min.x)
    const dr = Math.abs(nextPos.x - box.max.x)
    const db = Math.abs(nextPos.y - box.min.y)
    const dt2 = Math.abs(nextPos.y - box.max.y)
    const df = Math.abs(nextPos.z - box.min.z)
    const dbk = Math.abs(nextPos.z - box.max.z)

    const minDist = Math.min(dl, dr, db, dt2, df, dbk)

    const speedBoost = 1.2 + Math.random() * 0.3
    const turbulence = (Math.random() - 0.5) * 0.8

    if (minDist === dl || minDist === dr) {
      p.velocity.x = -p.velocity.x * speedBoost * 0.5
      p.velocity.y += turbulence
      p.velocity.z += turbulence * 0.5
      p.position.x = minDist === dl ? box.min.x - 0.2 : box.max.x + 0.2
      p.position.y += p.velocity.y * 0.01
      p.position.z += p.velocity.z * 0.01
    } else if (minDist === df || minDist === dbk) {
      p.velocity.z = -p.velocity.z * speedBoost * 0.5
      p.velocity.y += turbulence
      p.velocity.x += turbulence * 0.5
      p.position.z = minDist === df ? box.min.z - 0.2 : box.max.z + 0.2
      p.position.x += p.velocity.x * 0.01
      p.position.y += p.velocity.y * 0.01
    } else {
      p.velocity.y = -p.velocity.y * speedBoost * 0.5
      p.velocity.x += turbulence
      p.position.y = minDist === db ? box.min.y - 0.2 : box.max.y + 0.2
      p.position.x += p.velocity.x * 0.01
      p.position.z += p.velocity.z * 0.01
    }
  }

  private recordDeath(p: Particle): void {
    const lifetime = performance.now() / 1000 - p.bornAt
    if (lifetime > 0) {
      this.totalLifetimeAccum += lifetime
      this.totalLivedParticles++
    }
  }

  private updateGeometry(): void {
    const posArr = this.positionAttr.array as Float32Array
    let count = 0

    for (const p of this.particles) {
      if (!p.active) continue
      posArr[count * 3] = p.position.x
      posArr[count * 3 + 1] = p.position.y
      posArr[count * 3 + 2] = p.position.z
      count++
    }

    this.positionAttr.needsUpdate = true
    this.geometry.setDrawRange(0, count)
  }

  getActiveCount(): number {
    let c = 0
    for (const p of this.particles) {
      if (p.active) c++
    }
    return c
  }

  getWindSpeed(): number {
    return this.climate.windSpeed
  }

  getAverageLifetime(): number {
    if (this.totalLivedParticles === 0) return 0
    return this.totalLifetimeAccum / this.totalLivedParticles
  }

  resetLifetimeStats(): void {
    this.totalLifetimeAccum = 0
    this.totalLivedParticles = 0
  }
}

export { CLIMATE_PRESETS }
