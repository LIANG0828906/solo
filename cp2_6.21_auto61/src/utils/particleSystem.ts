import * as THREE from 'three'

export class GoldenParticleSystem {
  private geometry: THREE.BufferGeometry
  private material: THREE.PointsMaterial
  private points: THREE.Points
  private maxParticles: number = 800
  private active: boolean = false
  
  private positions: Float32Array
  private colors: Float32Array
  private sizes: Float32Array
  private velocities: Float32Array
  private lives: Float32Array
  private particleCount: number = 0

  constructor() {
    this.positions = new Float32Array(this.maxParticles * 3)
    this.colors = new Float32Array(this.maxParticles * 3)
    this.sizes = new Float32Array(this.maxParticles)
    this.velocities = new Float32Array(this.maxParticles * 3)
    this.lives = new Float32Array(this.maxParticles * 2)

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))

    this.material = new THREE.PointsMaterial({
      size: 0.08,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.points.visible = false
    this.geometry.setDrawRange(0, 0)
  }

  getPoints(): THREE.Points {
    return this.points
  }

  start(): void {
    this.active = true
    this.points.visible = true
    this.particleCount = 0
    this.geometry.setDrawRange(0, 0)
  }

  stop(): void {
    this.active = false
    this.points.visible = false
  }

  private spawnParticle(center: THREE.Vector3, goldenHues: THREE.Color[]): void {
    if (this.particleCount >= this.maxParticles) {
      for (let i = 0; i < this.maxParticles - 1; i++) {
        this.positions[i * 3] = this.positions[(i + 1) * 3]
        this.positions[i * 3 + 1] = this.positions[(i + 1) * 3 + 1]
        this.positions[i * 3 + 2] = this.positions[(i + 1) * 3 + 2]
        
        this.colors[i * 3] = this.colors[(i + 1) * 3]
        this.colors[i * 3 + 1] = this.colors[(i + 1) * 3 + 1]
        this.colors[i * 3 + 2] = this.colors[(i + 1) * 3 + 2]
        
        this.sizes[i] = this.sizes[i + 1]
        this.velocities[i * 3] = this.velocities[(i + 1) * 3]
        this.velocities[i * 3 + 1] = this.velocities[(i + 1) * 3 + 1]
        this.velocities[i * 3 + 2] = this.velocities[(i + 1) * 3 + 2]
        this.lives[i * 2] = this.lives[(i + 1) * 2]
        this.lives[i * 2 + 1] = this.lives[(i + 1) * 2 + 1]
      }
      this.particleCount = this.maxParticles - 1
    }

    const idx = this.particleCount
    const color = goldenHues[Math.floor(Math.random() * goldenHues.length)]

    const offset = new THREE.Vector3(
      (Math.random() - 0.5) * 1.5,
      (Math.random() - 0.5) * 2,
      (Math.random() - 0.5) * 1.5
    )

    const pos = center.clone().add(offset)
    this.positions[idx * 3] = pos.x
    this.positions[idx * 3 + 1] = pos.y
    this.positions[idx * 3 + 2] = pos.z

    this.velocities[idx * 3] = (Math.random() - 0.5) * 0.08
    this.velocities[idx * 3 + 1] = Math.random() * 0.1 + 0.02
    this.velocities[idx * 3 + 2] = (Math.random() - 0.5) * 0.08

    this.colors[idx * 3] = color.r
    this.colors[idx * 3 + 1] = color.g
    this.colors[idx * 3 + 2] = color.b

    this.sizes[idx] = 0.05 + Math.random() * 0.1
    this.lives[idx * 2] = 1.0
    this.lives[idx * 2 + 1] = 2.0 + Math.random() * 2.0

    this.particleCount++
    this.geometry.setDrawRange(0, this.particleCount)
  }

  update(delta: number, center: THREE.Vector3): void {
    if (!this.active) return

    const goldenHues = [
      new THREE.Color(0xffd700),
      new THREE.Color(0xffc107),
      new THREE.Color(0xffeb3b),
      new THREE.Color(0xffa000),
      new THREE.Color(0xfff59d)
    ]

    const spawnCount = Math.min(6, Math.ceil(delta * 200))
    for (let i = 0; i < spawnCount; i++) {
      this.spawnParticle(center, goldenHues)
    }

    const gravity = -0.001
    const turbulence = 0.005
    let writeIdx = 0

    for (let readIdx = 0; readIdx < this.particleCount; readIdx++) {
      const life = this.lives[readIdx * 2]
      const maxLife = this.lives[readIdx * 2 + 1]

      this.velocities[readIdx * 3 + 1] += gravity
      this.velocities[readIdx * 3] += (Math.random() - 0.5) * turbulence
      this.velocities[readIdx * 3 + 2] += (Math.random() - 0.5) * turbulence

      this.positions[readIdx * 3] += this.velocities[readIdx * 3]
      this.positions[readIdx * 3 + 1] += this.velocities[readIdx * 3 + 1]
      this.positions[readIdx * 3 + 2] += this.velocities[readIdx * 3 + 2]

      this.lives[readIdx * 2] -= delta / maxLife

      const newLife = this.lives[readIdx * 2]

      if (newLife > 0) {
        if (writeIdx !== readIdx) {
          this.positions[writeIdx * 3] = this.positions[readIdx * 3]
          this.positions[writeIdx * 3 + 1] = this.positions[readIdx * 3 + 1]
          this.positions[writeIdx * 3 + 2] = this.positions[readIdx * 3 + 2]
          
          this.velocities[writeIdx * 3] = this.velocities[readIdx * 3]
          this.velocities[writeIdx * 3 + 1] = this.velocities[readIdx * 3 + 1]
          this.velocities[writeIdx * 3 + 2] = this.velocities[readIdx * 3 + 2]
          
          this.colors[writeIdx * 3] = this.colors[readIdx * 3]
          this.colors[writeIdx * 3 + 1] = this.colors[readIdx * 3 + 1]
          this.colors[writeIdx * 3 + 2] = this.colors[readIdx * 3 + 2]
          
          this.sizes[writeIdx] = this.sizes[readIdx]
          this.lives[writeIdx * 2] = newLife
          this.lives[writeIdx * 2 + 1] = maxLife
        }

        const alpha = newLife
        this.colors[writeIdx * 3] *= alpha
        this.colors[writeIdx * 3 + 1] *= alpha
        this.colors[writeIdx * 3 + 2] *= alpha
        this.sizes[writeIdx] *= newLife

        writeIdx++
      }
    }

    this.particleCount = writeIdx
    this.geometry.setDrawRange(0, this.particleCount)

    const posAttr = this.geometry.attributes.position as THREE.BufferAttribute
    const colorAttr = this.geometry.attributes.color as THREE.BufferAttribute
    const sizeAttr = this.geometry.attributes.size as THREE.BufferAttribute

    posAttr.needsUpdate = true
    colorAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
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
  private targetPosition: THREE.Vector3 = new THREE.Vector3()

  constructor() {
    const geometry = new THREE.RingGeometry(0.25, 0.9, 32)
    const material = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false
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
    this.targetPosition.copy(position)
    this.targetPosition.y = 0.05
    this.mesh.position.copy(this.targetPosition)
    this.mesh.visible = true
  }

  hide(): void {
    this.active = false
    this.mesh.visible = false
    const material = this.mesh.material as THREE.MeshBasicMaterial
    material.opacity = 0
  }

  update(delta: number): void {
    if (!this.active) return

    this.time += delta * 4
    const pulse = (Math.sin(this.time) + 1) * 0.5
    
    const material = this.mesh.material as THREE.MeshBasicMaterial
    material.opacity = 0.25 + pulse * 0.6
    
    const baseScale = 1 + pulse * 0.25
    this.mesh.scale.set(baseScale, baseScale, baseScale)
    
    material.color.setHSL(0.3 + pulse * 0.1, 1, 0.5 + pulse * 0.2)

    this.mesh.position.x = this.targetPosition.x + Math.sin(this.time * 0.5) * 0.02
    this.mesh.position.z = this.targetPosition.z + Math.cos(this.time * 0.5) * 0.02
  }

  dispose(): void {
    this.mesh.geometry.dispose()
    ;(this.mesh.material as THREE.Material).dispose()
  }
}
