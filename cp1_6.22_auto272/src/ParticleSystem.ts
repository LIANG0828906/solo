import * as THREE from 'three'

export interface ParticleSystemConfig {
  particleCount: number
  boundarySize: number
  minSize: number
  maxSize: number
  minOpacity: number
  maxOpacity: number
  trailLength: number
  defaultLifetime: number
}

const DEFAULT_CONFIG: ParticleSystemConfig = {
  particleCount: 500,
  boundarySize: 100,
  minSize: 2,
  maxSize: 6,
  minOpacity: 0.3,
  maxOpacity: 0.8,
  trailLength: 15,
  defaultLifetime: 5
}

const vertexShader = `
  attribute float aSize;
  attribute float aAlpha;
  attribute vec3 color;
  varying vec3 vColor;
  varying float vAlpha;
  uniform float uPixelRatio;

  void main() {
    vColor = color;
    vAlpha = aAlpha;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
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

const trailVertexShader = `
  attribute float aSize;
  attribute vec3 color;
  varying vec3 vColor;
  uniform float uPixelRatio;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aSize * uPixelRatio * (300.0 / -mvPosition.z);
  }
`

const trailFragmentShader = `
  varying vec3 vColor;
  uniform float uOpacity;

  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    if (dist > 0.5) discard;
    float alpha = (1.0 - dist * 2.0) * uOpacity;
    gl_FragColor = vec4(vColor, alpha);
  }
`

export class ParticleSystem {
  private config: ParticleSystemConfig
  private scene: THREE.Scene
  private mainPoints!: THREE.Points
  private trailPoints: THREE.Points[] = []
  private positions: Float32Array
  private colors: Float32Array
  private sizes: Float32Array
  private alphas: Float32Array
  private velocities: THREE.Vector3[]
  private lifetimes: number[]
  private maxLifetimes: number[]
  private trailBuffer: Float32Array[]
  private trailIndex: number = 0
  private geometry: THREE.BufferGeometry
  private trailGeometries: THREE.BufferGeometry[] = []
  private pixelRatio: number = window.devicePixelRatio

  constructor(scene: THREE.Scene, config: Partial<ParticleSystemConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.scene = scene

    const { particleCount, trailLength } = this.config

    this.positions = new Float32Array(particleCount * 3)
    this.colors = new Float32Array(particleCount * 3)
    this.sizes = new Float32Array(particleCount)
    this.alphas = new Float32Array(particleCount)
    this.velocities = new Array(particleCount)
    this.lifetimes = new Array(particleCount)
    this.maxLifetimes = new Array(particleCount)

    this.trailBuffer = new Array(trailLength)
    for (let i = 0; i < trailLength; i++) {
      this.trailBuffer[i] = new Float32Array(particleCount * 3)
    }

    this.geometry = new THREE.BufferGeometry()
    this.initParticles()
    this.createMainPoints()
    this.createTrailPoints()
  }

  private initParticles(): void {
    const { particleCount, boundarySize, minSize, maxSize, minOpacity, maxOpacity, defaultLifetime } = this.config

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      this.positions[i3] = (Math.random() - 0.5) * boundarySize
      this.positions[i3 + 1] = (Math.random() - 0.5) * boundarySize
      this.positions[i3 + 2] = (Math.random() - 0.5) * boundarySize

      const t = Math.random()
      this.colors[i3] = 1.0
      this.colors[i3 + 1] = 1.0
      this.colors[i3 + 2] = 0.9 + t * 0.1

      this.sizes[i] = minSize + Math.random() * (maxSize - minSize)
      this.alphas[i] = minOpacity + Math.random() * (maxOpacity - minOpacity)

      this.velocities[i] = new THREE.Vector3(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      )

      this.maxLifetimes[i] = defaultLifetime * (0.8 + Math.random() * 0.4)
      this.lifetimes[i] = Math.random() * this.maxLifetimes[i]

      for (let tIdx = 0; tIdx < this.config.trailLength; tIdx++) {
        this.trailBuffer[tIdx][i3] = this.positions[i3]
        this.trailBuffer[tIdx][i3 + 1] = this.positions[i3 + 1]
        this.trailBuffer[tIdx][i3 + 2] = this.positions[i3 + 2]
      }
    }

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('aSize', new THREE.BufferAttribute(this.sizes, 1))
    this.geometry.setAttribute('aAlpha', new THREE.BufferAttribute(this.alphas, 1))
  }

  private createMainPoints(): void {
    const material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uPixelRatio: { value: this.pixelRatio }
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    this.mainPoints = new THREE.Points(this.geometry, material)
    this.scene.add(this.mainPoints)
  }

  private createTrailPoints(): void {
    const { trailLength, particleCount } = this.config

    for (let t = 0; t < trailLength - 1; t++) {
      const geometry = new THREE.BufferGeometry()
      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)
      const trailSizes = new Float32Array(particleCount)

      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3
        const tint = Math.random()
        colors[i3] = 1.0
        colors[i3 + 1] = 1.0
        colors[i3 + 2] = 0.9 + tint * 0.1
        trailSizes[i] = this.sizes[i] * (1 - (t + 1) / trailLength)
      }

      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('aSize', new THREE.BufferAttribute(trailSizes, 1))

      const fadeFactor = 1 - (t + 1) / trailLength
      const material = new THREE.ShaderMaterial({
        vertexShader: trailVertexShader,
        fragmentShader: trailFragmentShader,
        uniforms: {
          uPixelRatio: { value: this.pixelRatio },
          uOpacity: { value: fadeFactor * 0.5 }
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })

      const points = new THREE.Points(geometry, material)
      this.trailPoints.push(points)
      this.trailGeometries.push(geometry)
      this.scene.add(points)
    }
  }

  public update(forceVector: THREE.Vector3, turbulence: number, deltaTime: number, lifetime: number): void {
    const { particleCount, boundarySize, trailLength, minOpacity, maxOpacity } = this.config
    const halfBoundary = boundarySize / 2

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      this.maxLifetimes[i] = lifetime * (0.8 + Math.random() * 0.4)

      const turbulenceForce = new THREE.Vector3(
        (Math.random() - 0.5) * 2 * turbulence,
        (Math.random() - 0.5) * 2 * turbulence,
        (Math.random() - 0.5) * 2 * turbulence
      )

      this.velocities[i].add(forceVector.clone().multiplyScalar(deltaTime))
      this.velocities[i].add(turbulenceForce.multiplyScalar(deltaTime))
      this.velocities[i].multiplyScalar(0.98)

      this.positions[i3] += this.velocities[i].x * deltaTime
      this.positions[i3 + 1] += this.velocities[i].y * deltaTime
      this.positions[i3 + 2] += this.velocities[i].z * deltaTime

      if (this.positions[i3] > halfBoundary) this.positions[i3] = -halfBoundary
      if (this.positions[i3] < -halfBoundary) this.positions[i3] = halfBoundary
      if (this.positions[i3 + 1] > halfBoundary) this.positions[i3 + 1] = -halfBoundary
      if (this.positions[i3 + 1] < -halfBoundary) this.positions[i3 + 1] = halfBoundary
      if (this.positions[i3 + 2] > halfBoundary) this.positions[i3 + 2] = -halfBoundary
      if (this.positions[i3 + 2] < -halfBoundary) this.positions[i3 + 2] = halfBoundary

      this.lifetimes[i] -= deltaTime
      if (this.lifetimes[i] <= 0) {
        this.respawnParticle(i)
      }

      const lifeRatio = this.lifetimes[i] / this.maxLifetimes[i]
      this.alphas[i] = minOpacity + (maxOpacity - minOpacity) * Math.min(lifeRatio * 2, 1)

      this.trailBuffer[this.trailIndex][i3] = this.positions[i3]
      this.trailBuffer[this.trailIndex][i3 + 1] = this.positions[i3 + 1]
      this.trailBuffer[this.trailIndex][i3 + 2] = this.positions[i3 + 2]
    }

    this.geometry.attributes.position.needsUpdate = true
    ;(this.geometry.attributes.aAlpha as THREE.BufferAttribute).needsUpdate = true

    for (let t = 0; t < trailLength - 1; t++) {
      const bufferIndex = (this.trailIndex - t - 1 + trailLength) % trailLength
      const trailGeometry = this.trailGeometries[t]
      const trailPositions = trailGeometry.attributes.position.array as Float32Array

      for (let i = 0; i < particleCount * 3; i++) {
        trailPositions[i] = this.trailBuffer[bufferIndex][i]
      }

      trailGeometry.attributes.position.needsUpdate = true
    }

    this.trailIndex = (this.trailIndex + 1) % trailLength
  }

  private respawnParticle(index: number): void {
    const { boundarySize } = this.config
    const halfBoundary = boundarySize / 2
    const i3 = index * 3

    this.positions[i3] = (Math.random() - 0.5) * boundarySize
    this.positions[i3 + 1] = -halfBoundary + Math.random() * 10
    this.positions[i3 + 2] = (Math.random() - 0.5) * boundarySize

    this.velocities[index].set(
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5,
      (Math.random() - 0.5) * 0.5
    )

    this.lifetimes[index] = this.maxLifetimes[index]

    for (let tIdx = 0; tIdx < this.config.trailLength; tIdx++) {
      this.trailBuffer[tIdx][i3] = this.positions[i3]
      this.trailBuffer[tIdx][i3 + 1] = this.positions[i3 + 1]
      this.trailBuffer[tIdx][i3 + 2] = this.positions[i3 + 2]
    }
  }

  public reset(): void {
    const { particleCount, boundarySize } = this.config

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3

      this.positions[i3] = (Math.random() - 0.5) * boundarySize
      this.positions[i3 + 1] = (Math.random() - 0.5) * boundarySize
      this.positions[i3 + 2] = (Math.random() - 0.5) * boundarySize

      this.velocities[i].set(
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5,
        (Math.random() - 0.5) * 0.5
      )

      this.lifetimes[i] = this.maxLifetimes[i]

      for (let tIdx = 0; tIdx < this.config.trailLength; tIdx++) {
        this.trailBuffer[tIdx][i3] = this.positions[i3]
        this.trailBuffer[tIdx][i3 + 1] = this.positions[i3 + 1]
        this.trailBuffer[tIdx][i3 + 2] = this.positions[i3 + 2]
      }
    }

    this.geometry.attributes.position.needsUpdate = true
  }

  public dispose(): void {
    this.scene.remove(this.mainPoints)
    this.geometry.dispose()
    ;(this.mainPoints.material as THREE.Material).dispose()

    for (let i = 0; i < this.trailPoints.length; i++) {
      this.scene.remove(this.trailPoints[i])
      this.trailGeometries[i].dispose()
      ;(this.trailPoints[i].material as THREE.Material).dispose()
    }
  }
}
