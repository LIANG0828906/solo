import * as THREE from 'three'

export interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  life: number
  maxLife: number
  size: number
  color: THREE.Color
}

export class GoldenParticleSystem {
  private particles: Particle[] = []
  private geometry: THREE.BufferGeometry
  private material: THREE.PointsMaterial
  private points: THREE.Points
  private maxParticles: number = 500
  private active: boolean = false

  constructor() {
    this.geometry = new THREE.BufferGeometry()
    this.material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    const positions = new Float32Array(this.maxParticles * 3)
    const colors = new Float32Array(this.maxParticles * 3)
    const sizes = new Float32Array(this.maxParticles)

    this.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

    this.points = new THREE.Points(this.geometry, this.material)
    this.points.visible = false
  }

  getPoints(): THREE.Points {
    return this.points
  }

  start(): void {
    this.active = true
    this.points.visible = true
    this.particles = []
  }

  stop(): void {
    this.active = false
    this.points.visible = false
  }

  private emit(center: THREE.Vector3): void {
    if (this.particles.length >= this.maxParticles) return

    const goldenHues = [
      new THREE.Color(0xffd700),
      new THREE.Color(0xffc107),
      new THREE.Color(0xffeb3b),
      new THREE.Color(0xffa000),
      new THREE.Color(0xfff59d)
    ]

    const particle: Particle = {
      position: center.clone(),
      velocity: new THREE.Vector3(
        (Math.random() - 0.5) * 0.08,
        Math.random() * 0.1 + 0.02,
        (Math.random() - 0.5) * 0.08
      ),
      life: 1.0,
      maxLife: 2.0 + Math.random() * 2.0,
      size: 0.05 + Math.random() * 0.1,
      color: goldenHues[Math.floor(Math.random() * goldenHues.length)]
    }

    this.particles.push(particle)
  }

  update(delta: number, center: THREE.Vector3): void {
    if (!this.active) return

    for (let i = 0; i < 8; i++) {
      const offset = new THREE.Vector3(
        (Math.random() - 0.5) * 1.5,
        (Math.random() - 0.5) * 2,
        (Math.random() - 0.5) * 1.5
      )
      this.emit(center.clone().add(offset))
    }

    const positions = this.geometry.attributes.position.array as Float32Array
    const colors = this.geometry.attributes.color.array as Float32Array
    const sizes = this.geometry.attributes.size.array as Float32Array

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      
      p.velocity.y -= 0.001
      p.velocity.x += (Math.random() - 0.5) * 0.005
      p.velocity.z += (Math.random() - 0.5) * 0.005
      
      p.position.add(p.velocity)
      p.life -= delta / p.maxLife

      if (p.life <= 0) {
        this.particles.splice(i, 1)
        continue
      }

      const idx = i * 3
      positions[idx] = p.position.x
      positions[idx + 1] = p.position.y
      positions[idx + 2] = p.position.z

      const alpha = p.life
      colors[idx] = p.color.r * alpha
      colors[idx + 1] = p.color.g * alpha
      colors[idx + 2] = p.color.b * alpha

      sizes[i] = p.size * p.life
    }

    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.color.needsUpdate = true
    this.geometry.attributes.size.needsUpdate = true
    this.geometry.setDrawRange(0, this.particles.length)
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}

export class SnapGlowEffect {
  private mesh: THREE.Mesh
  private active: boolean = false
  private time: number = 0

  constructor() {
    const geometry = new THREE.RingGeometry(0.3, 0.8, 32)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    })
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.rotation.x = -Math.PI / 2
    this.mesh.visible = false
  }

  getMesh(): THREE.Mesh {
    return this.mesh
  }

  show(position: THREE.Vector3): void {
    this.active = true
    this.time = 0
    this.mesh.visible = true
    this.mesh.position.copy(position)
    this.mesh.position.y = 0.02
  }

  hide(): void {
    this.active = false
    this.mesh.visible = false
    const material = this.mesh.material as THREE.MeshBasicMaterial
    material.opacity = 0
  }

  update(delta: number): void {
    if (!this.active) return

    this.time += delta * 3
    const pulse = (Math.sin(this.time) + 1) * 0.5
    
    const material = this.mesh.material as THREE.MeshBasicMaterial
    material.opacity = 0.3 + pulse * 0.5
    
    const scale = 1 + pulse * 0.2
    this.mesh.scale.set(scale, scale, scale)
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }
}
