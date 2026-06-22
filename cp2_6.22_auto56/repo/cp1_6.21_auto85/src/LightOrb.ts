import * as THREE from 'three'
import { Player } from './Player'

const ORB_RADIUS = 0.15
const COLLECT_DISTANCE = 0.5
const PARTICLE_COUNT = 30
const MAX_ACTIVE_PARTICLES = 60

type Particle = {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  life: number
  maxLife: number
  startColor: THREE.Color
  endColor: THREE.Color
}

type OrbData = {
  mesh: THREE.Group
  light: THREE.PointLight
  position: THREE.Vector3
  collected: boolean
  phase: number
}

export class LightOrbSystem {
  public group: THREE.Group
  public orbs: OrbData[] = []
  private particles: Particle[] = []
  private particleGeometry: THREE.SphereGeometry
  private startColor: THREE.Color = new THREE.Color(0xffd700)
  private endColor: THREE.Color = new THREE.Color(0xff4500)
  private orbGeometry: THREE.SphereGeometry
  private player: Player

  constructor(
    positions: { x: number; z: number }[],
    scene: THREE.Scene,
    player: Player
  ) {
    this.group = new THREE.Group()
    this.player = player
    this.orbGeometry = new THREE.SphereGeometry(ORB_RADIUS, 16, 16)
    this.particleGeometry = new THREE.SphereGeometry(0.05, 4, 4)

    positions.forEach((pos, i) => {
      const orb = this.createOrb(pos.x, pos.z, i)
      this.orbs.push(orb)
      this.group.add(orb.mesh)
      this.group.add(orb.light)
    })
  }

  private createOrb(x: number, z: number, index: number): OrbData {
    const group = new THREE.Group()

    const orbMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
    })
    const orbMesh = new THREE.Mesh(this.orbGeometry, orbMat)
    group.add(orbMesh)

    const glowGeo = new THREE.SphereGeometry(ORB_RADIUS * 2, 16, 16)
    const glowMat = new THREE.MeshBasicMaterial({
      color: 0xffd700,
      transparent: true,
      opacity: 0.3,
      side: THREE.BackSide,
    })
    const glowMesh = new THREE.Mesh(glowGeo, glowMat)
    group.add(glowMesh)

    const light = new THREE.PointLight(0xffd700, 1, 2, 2)

    const phase = Math.random() * Math.PI * 2

    group.position.set(x, ORB_RADIUS + 0.3, z)
    light.position.set(x, ORB_RADIUS + 0.3, z)

    return {
      mesh: group,
      light,
      position: new THREE.Vector3(x, ORB_RADIUS + 0.3, z),
      collected: false,
      phase,
    }
  }

  public update(deltaTime: number, time: number): number {
    let newlyCollected = 0

    this.orbs.forEach((orb) => {
      if (orb.collected) return

      orb.mesh.rotation.y += deltaTime * Math.PI
      orb.mesh.position.y = orb.position.y + Math.sin(time * 2 + orb.phase) * 0.1
      orb.light.position.y = orb.mesh.position.y
      orb.light.intensity = 0.8 + 0.4 * Math.sin(time * 3 + orb.phase)

      const dist = this.player.position.distanceTo(
        new THREE.Vector3(orb.mesh.position.x, this.player.position.y, orb.mesh.position.z)
      )

      if (dist < COLLECT_DISTANCE) {
        orb.collected = true
        orb.mesh.visible = false
        orb.light.intensity = 0
        this.spawnExplosion(orb.mesh.position)
        this.player.collectedOrbs++
        this.player.increaseLightRadius()
        newlyCollected++
      }
    })

    this.updateParticles(deltaTime)

    return newlyCollected
  }

  private spawnExplosion(position: THREE.Vector3): void {
    for (let i = 0; i < PARTICLE_COUNT && this.particles.length < MAX_ACTIVE_PARTICLES; i++) {
      const size = 0.05 + Math.random() * 0.05
      const mat = new THREE.MeshBasicMaterial({
        color: this.startColor.clone(),
        transparent: true,
        opacity: 1,
      })
      const mesh = new THREE.Mesh(this.particleGeometry, mat)
      mesh.scale.setScalar(size / 0.05)
      mesh.position.copy(position)

      const angle = Math.random() * Math.PI * 2
      const speed = 0.02 + Math.random() * 0.04
      const vy = 0.02 + Math.random() * 0.05
      const velocity = new THREE.Vector3(
        Math.cos(angle) * speed,
        vy,
        Math.sin(angle) * speed
      )

      this.group.add(mesh)
      this.particles.push({
        mesh,
        velocity,
        life: 1.5,
        maxLife: 1.5,
        startColor: this.startColor.clone(),
        endColor: this.endColor.clone(),
      })
    }
  }

  private updateParticles(deltaTime: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.life -= deltaTime
      if (p.life <= 0) {
        this.group.remove(p.mesh)
        p.mesh.geometry.dispose()
        ;(p.mesh.material as THREE.Material).dispose()
        this.particles.splice(i, 1)
        continue
      }

      p.mesh.position.add(p.velocity)
      p.velocity.y -= 0.0005
      p.velocity.multiplyScalar(0.98)

      const t = 1 - p.life / p.maxLife
      const mat = p.mesh.material as THREE.MeshBasicMaterial
      mat.color.lerpColors(p.startColor, p.endColor, t)
      mat.opacity = 1 - t
    }
  }

  public getCollectedCount(): number {
    return this.orbs.filter((o) => o.collected).length
  }

  public getTotalCount(): number {
    return this.orbs.length
  }

  public reset(positions: { x: number; z: number }[]): void {
    this.orbs.forEach((orb) => {
      this.group.remove(orb.mesh)
      this.group.remove(orb.light)
      orb.mesh.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose()
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose())
          } else {
            obj.material.dispose()
          }
        }
      })
    })
    this.orbs = []

    this.particles.forEach((p) => {
      this.group.remove(p.mesh)
      p.mesh.geometry.dispose()
      ;(p.mesh.material as THREE.Material).dispose()
    })
    this.particles = []

    positions.forEach((pos, i) => {
      const orb = this.createOrb(pos.x, pos.z, i)
      this.orbs.push(orb)
      this.group.add(orb.mesh)
      this.group.add(orb.light)
    })
  }
}
