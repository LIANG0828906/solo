import * as THREE from 'three'

export interface Particle {
  position: THREE.Vector3
  velocity: THREE.Vector3
  color: THREE.Color
  size: number
  initialSize: number
  life: number
  maxLife: number
  opacity: number
}

interface ParticleSystemOptions {
  maxParticles?: number
  particleLifetime?: number
  gravityRadius?: number
  attractThreshold?: number
  repelThreshold?: number
  attractForce?: number
  repelForce?: number
  colorBlendRate?: number
}

const vertexShader = `
  attribute float size;
  attribute float alpha;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vColor = color;
    vAlpha = alpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = size * 600.0 / -mvPosition.z;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    
    float alpha = (1.0 - dist * 2.0) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`

export class ParticleSystem {
  private particles: Particle[] = []
  private maxParticles: number
  private particleLifetime: number
  private gravityRadius: number
  private attractThreshold: number
  private repelThreshold: number
  private attractForce: number
  private repelForce: number
  private colorBlendRate: number

  private geometry: THREE.BufferGeometry
  private material: THREE.ShaderMaterial
  private points: THREE.Points

  private positions: Float32Array
  private colors: Float32Array
  private sizes: Float32Array
  private alphas: Float32Array

  private spatialGrid: Map<string, number[]> = new Map()
  private cellSize: number = 3

  constructor(options: ParticleSystemOptions = {}) {
    this.maxParticles = options.maxParticles || 5000
    this.particleLifetime = options.particleLifetime || 15
    this.gravityRadius = options.gravityRadius || 3
    this.attractThreshold = options.attractThreshold || 0.3
    this.repelThreshold = options.repelThreshold || 0.7
    this.attractForce = options.attractForce || 1.2
    this.repelForce = options.repelForce || 1.8
    this.colorBlendRate = options.colorBlendRate || 3.0

    this.geometry = new THREE.BufferGeometry()

    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {},
      transparent: true,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    this.positions = new Float32Array(this.maxParticles * 3)
    this.colors = new Float32Array(this.maxParticles * 3)
    this.sizes = new Float32Array(this.maxParticles)
    this.alphas = new Float32Array(this.maxParticles)

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1))

    this.points = new THREE.Points(this.geometry, this.material)
  }

  getPoints(): THREE.Points {
    return this.points
  }

  getParticleCount(): number {
    return this.particles.length
  }

  emitParticles(
    position: THREE.Vector3,
    direction: THREE.Vector3,
    color: THREE.Color,
    count: number,
    brushSize: number
  ): void {
    const dirNormalized = direction.clone().normalize()
    
    for (let i = 0; i < count; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.removeShortestLifeParticles(1)
      }

      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      const r = Math.random() * brushSize
      
      const offset = new THREE.Vector3(
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      )

      const particlePos = position.clone().add(offset)

      const velocity = dirNormalized.clone().multiplyScalar(Math.random() * 0.5 + 0.5)
      const perturbation = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      )
      velocity.add(perturbation)

      const size = Math.random() * 0.1 + 0.05

      const particle: Particle = {
        position: particlePos,
        velocity,
        color: color.clone(),
        size,
        initialSize: size,
        life: this.particleLifetime,
        maxLife: this.particleLifetime,
        opacity: 1
      }

      this.particles.push(particle)
    }
  }

  update(deltaTime: number): void {
    const dt = deltaTime

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      p.life -= dt

      if (p.life <= 0) continue

      const elapsed = p.maxLife - p.life

      if (elapsed < 5) {
        p.size = p.initialSize * (1 + 0.5 * (elapsed / 5))
      } else {
        const shrinkTime = p.maxLife - 5
        const shrinkElapsed = elapsed - 5
        p.size = p.initialSize * 1.5 * (1 - shrinkElapsed / shrinkTime)
      }

      const decayRate = 0.06
      p.opacity = Math.max(0, 1 - (elapsed * decayRate))

      p.position.add(p.velocity.clone().multiplyScalar(dt))
    }

    if (this.particles.length > 0) {
      this.calculateForcesOptimized(dt)
    }
    
    this.removeDeadParticles()
    this.updateBufferAttributes()
  }

  private buildSpatialGrid(): void {
    this.spatialGrid.clear()
    
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i]
      if (p.life <= 0) continue
      
      const cellX = Math.floor(p.position.x / this.cellSize)
      const cellY = Math.floor(p.position.y / this.cellSize)
      const cellZ = Math.floor(p.position.z / this.cellSize)
      const key = `${cellX},${cellY},${cellZ}`
      
      if (!this.spatialGrid.has(key)) {
        this.spatialGrid.set(key, [])
      }
      this.spatialGrid.get(key)!.push(i)
    }
  }

  private getNearbyParticles(index: number): number[] {
    const p = this.particles[index]
    const nearby: number[] = []
    
    const cellX = Math.floor(p.position.x / this.cellSize)
    const cellY = Math.floor(p.position.y / this.cellSize)
    const cellZ = Math.floor(p.position.z / this.cellSize)
    
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const key = `${cellX + dx},${cellY + dy},${cellZ + dz}`
          const cell = this.spatialGrid.get(key)
          if (cell) {
            for (const idx of cell) {
              if (idx > index) {
                nearby.push(idx)
              }
            }
          }
        }
      }
    }
    
    return nearby
  }

  private calculateForcesOptimized(dt: number): void {
    this.buildSpatialGrid()
    
    const particles = this.particles
    
    for (let i = 0; i < particles.length; i++) {
      const p1 = particles[i]
      if (p1.life <= 0) continue

      const nearbyIndices = this.getNearbyParticles(i)
      
      for (const j of nearbyIndices) {
        const p2 = particles[j]
        if (p2.life <= 0) continue

        const dx = p2.position.x - p1.position.x
        const dy = p2.position.y - p1.position.y
        const dz = p2.position.z - p1.position.z
        const distanceSq = dx * dx + dy * dy + dz * dz

        if (distanceSq > this.gravityRadius * this.gravityRadius || distanceSq < 0.0001) continue

        const distance = Math.sqrt(distanceSq)

        const dr = p1.color.r - p2.color.r
        const dg = p1.color.g - p2.color.g
        const db = p1.color.b - p2.color.b
        const colorDistance = Math.sqrt(dr * dr + dg * dg + db * db) / Math.sqrt(3)

        const invDistance = 1 / distance
        const dirX = dx * invDistance
        const dirY = dy * invDistance
        const dirZ = dz * invDistance

        if (colorDistance < this.attractThreshold) {
          const force = this.attractForce * (1 - colorDistance / this.attractThreshold) * dt
          
          p1.velocity.x += dirX * force
          p1.velocity.y += dirY * force
          p1.velocity.z += dirZ * force
          
          p2.velocity.x -= dirX * force
          p2.velocity.y -= dirY * force
          p2.velocity.z -= dirZ * force

          const blend = Math.min(this.colorBlendRate * dt * (1 - colorDistance / this.attractThreshold), 0.5)
          
          const r1 = p1.color.r
          const g1 = p1.color.g
          const b1 = p1.color.b
          const r2 = p2.color.r
          const g2 = p2.color.g
          const b2 = p2.color.b
          
          p1.color.r = r1 + (r2 - r1) * blend
          p1.color.g = g1 + (g2 - g1) * blend
          p1.color.b = b1 + (b2 - b1) * blend
          
          p2.color.r = r2 + (r1 - r2) * blend
          p2.color.g = g2 + (g1 - g2) * blend
          p2.color.b = b2 + (b1 - b2) * blend
          
        } else if (colorDistance > this.repelThreshold) {
          const force = this.repelForce * ((colorDistance - this.repelThreshold) / (1 - this.repelThreshold)) * dt
          
          p1.velocity.x -= dirX * force
          p1.velocity.y -= dirY * force
          p1.velocity.z -= dirZ * force
          
          p2.velocity.x += dirX * force
          p2.velocity.y += dirY * force
          p2.velocity.z += dirZ * force
        }
      }
    }
  }

  private removeDeadParticles(): void {
    this.particles = this.particles.filter((p) => p.life > 0 && p.size > 0.001)
  }

  private removeShortestLifeParticles(count: number): void {
    this.particles.sort((a, b) => a.life - b.life)
    this.particles.splice(0, count)
  }

  private updateBufferAttributes(): void {
    const count = Math.min(this.particles.length, this.maxParticles)

    for (let i = 0; i < count; i++) {
      const p = this.particles[i]
      const idx3 = i * 3

      this.positions[idx3] = p.position.x
      this.positions[idx3 + 1] = p.position.y
      this.positions[idx3 + 2] = p.position.z

      this.colors[idx3] = p.color.r
      this.colors[idx3 + 1] = p.color.g
      this.colors[idx3 + 2] = p.color.b

      this.sizes[i] = p.size
      this.alphas[i] = p.opacity
    }

    const positionAttr = this.geometry.getAttribute('position') as THREE.BufferAttribute
    const colorAttr = this.geometry.getAttribute('color') as THREE.BufferAttribute
    const sizeAttr = this.geometry.getAttribute('size') as THREE.BufferAttribute
    const alphaAttr = this.geometry.getAttribute('alpha') as THREE.BufferAttribute

    positionAttr.needsUpdate = true
    colorAttr.needsUpdate = true
    sizeAttr.needsUpdate = true
    alphaAttr.needsUpdate = true
    this.geometry.setDrawRange(0, count)
  }

  reset(): void {
    this.particles = []
    this.spatialGrid.clear()
    this.updateBufferAttributes()
  }

  dispose(): void {
    this.geometry.dispose()
    this.material.dispose()
  }
}
