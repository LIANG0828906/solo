import * as THREE from 'three'

export interface ColorScheme {
  colors: [string, string, string]
}

export const WARM_SCHEME: ColorScheme = {
  colors: ['#FF6B35', '#F59E0B', '#EF4444']
}

export const COOL_SCHEME: ColorScheme = {
  colors: ['#3B82F6', '#8B5CF6', '#EC4899']
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255]
    : [1, 1, 1]
}

function lerpColor(a: [number, number, number], b: [number, number, number], t: number): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  ]
}

function getGradientColor(scheme: ColorScheme, t: number): [number, number, number] {
  const c = scheme.colors.map(hexToRgb)
  if (t < 0.5) {
    return lerpColor(c[0], c[1], t * 2)
  } else {
    return lerpColor(c[1], c[2], (t - 0.5) * 2)
  }
}

export interface ParticleState {
  positions: Float32Array
  velocities: Float32Array
  colors: Float32Array
  sizes: Float32Array
}

export class ParticleSystem {
  count: number
  positions: Float32Array
  velocities: Float32Array
  colors: Float32Array
  sizes: Float32Array
  originalPositions: Float32Array
  originalVelocities: Float32Array
  targetColors: Float32Array
  currentColors: Float32Array
  containerSize: number
  geometry: THREE.BufferGeometry
  points: THREE.Points
  colorScheme: ColorScheme
  colorTransitionProgress: number
  resetProgress: number
  isResetting: boolean

  constructor(count: number, containerSize: number = 20, scheme: ColorScheme = WARM_SCHEME) {
    this.count = count
    this.containerSize = containerSize
    this.colorScheme = scheme
    this.colorTransitionProgress = 1
    this.resetProgress = 1
    this.isResetting = false

    this.positions = new Float32Array(count * 3)
    this.velocities = new Float32Array(count * 3)
    this.colors = new Float32Array(count * 3)
    this.sizes = new Float32Array(count)
    this.originalPositions = new Float32Array(count * 3)
    this.originalVelocities = new Float32Array(count * 3)
    this.targetColors = new Float32Array(count * 3)
    this.currentColors = new Float32Array(count * 3)

    this.initialize()

    this.geometry = new THREE.BufferGeometry()
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))

    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        varying float vSize;
        void main() {
          vColor = color;
          vSize = size;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vSize;
        void main() {
          vec2 center = gl_PointCoord - vec2(0.5);
          float dist = length(center);
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.0, dist);
          alpha = pow(alpha, 1.5);
          vec3 glow = vColor * (1.0 + alpha * 0.5);
          gl_FragColor = vec4(glow, alpha);
        }
      `,
      vertexColors: true,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    })

    this.points = new THREE.Points(this.geometry, material)
  }

  initialize() {
    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3
      const x = (Math.random() - 0.5) * (this.containerSize - 1)
      const y = (Math.random() - 0.5) * (this.containerSize - 1)
      const z = (Math.random() - 0.5) * (this.containerSize - 1)
      
      this.positions[i3] = x
      this.positions[i3 + 1] = y
      this.positions[i3 + 2] = z
      
      this.originalPositions[i3] = x
      this.originalPositions[i3 + 1] = y
      this.originalPositions[i3 + 2] = z

      const vx = (Math.random() - 0.5) * 2
      const vy = (Math.random() - 0.5) * 2
      const vz = (Math.random() - 0.5) * 2
      
      this.velocities[i3] = vx
      this.velocities[i3 + 1] = vy
      this.velocities[i3 + 2] = vz

      this.originalVelocities[i3] = vx
      this.originalVelocities[i3 + 1] = vy
      this.originalVelocities[i3 + 2] = vz

      this.sizes[i] = 2 + Math.random() * 2

      const colorT = Math.random()
      const color = getGradientColor(this.colorScheme, colorT)
      this.colors[i3] = color[0]
      this.colors[i3 + 1] = color[1]
      this.colors[i3 + 2] = color[2]
      this.currentColors[i3] = color[0]
      this.currentColors[i3 + 1] = color[1]
      this.currentColors[i3 + 2] = color[2]
    }
  }

  setColorScheme(scheme: ColorScheme) {
    if (this.colorScheme === scheme) return
    this.colorScheme = scheme
    this.colorTransitionProgress = 0

    for (let i = 0; i < this.count; i++) {
      const i3 = i * 3
      const colorT = (i / this.count) * 0.8 + Math.random() * 0.2
      const color = getGradientColor(scheme, colorT)
      this.targetColors[i3] = color[0]
      this.targetColors[i3 + 1] = color[1]
      this.targetColors[i3 + 2] = color[2]
    }
  }

  reset() {
    this.isResetting = true
    this.resetProgress = 0
  }

  resize(count: number) {
    this.count = count
    this.positions = new Float32Array(count * 3)
    this.velocities = new Float32Array(count * 3)
    this.colors = new Float32Array(count * 3)
    this.sizes = new Float32Array(count)
    this.originalPositions = new Float32Array(count * 3)
    this.originalVelocities = new Float32Array(count * 3)
    this.targetColors = new Float32Array(count * 3)
    this.currentColors = new Float32Array(count * 3)
    this.initialize()

    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('size', new THREE.BufferAttribute(this.sizes, 1))
  }

  update(deltaTime: number) {
    if (this.colorTransitionProgress < 1) {
      this.colorTransitionProgress = Math.min(1, this.colorTransitionProgress + deltaTime / 0.5)
      const t = this.easeInOutCubic(this.colorTransitionProgress)
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3
        this.colors[i3] = this.currentColors[i3] + (this.targetColors[i3] - this.currentColors[i3]) * t
        this.colors[i3 + 1] = this.currentColors[i3 + 1] + (this.targetColors[i3 + 1] - this.currentColors[i3 + 1]) * t
        this.colors[i3 + 2] = this.currentColors[i3 + 2] + (this.targetColors[i3 + 2] - this.currentColors[i3 + 2]) * t
      }
      if (this.colorTransitionProgress >= 1) {
        for (let i = 0; i < this.count; i++) {
          const i3 = i * 3
          this.currentColors[i3] = this.colors[i3]
          this.currentColors[i3 + 1] = this.colors[i3 + 1]
          this.currentColors[i3 + 2] = this.colors[i3 + 2]
        }
      }
    }

    if (this.isResetting && this.resetProgress < 1) {
      this.resetProgress = Math.min(1, this.resetProgress + deltaTime / 0.3)
      const t = this.easeInOutCubic(this.resetProgress)
      for (let i = 0; i < this.count; i++) {
        const i3 = i * 3
        this.positions[i3] = this.positions[i3] + (this.originalPositions[i3] - this.positions[i3]) * t
        this.positions[i3 + 1] = this.positions[i3 + 1] + (this.originalPositions[i3 + 1] - this.positions[i3 + 1]) * t
        this.positions[i3 + 2] = this.positions[i3 + 2] + (this.originalPositions[i3 + 2] - this.positions[i3 + 2]) * t
        
        this.velocities[i3] = this.velocities[i3] + (this.originalVelocities[i3] - this.velocities[i3]) * t
        this.velocities[i3 + 1] = this.velocities[i3 + 1] + (this.originalVelocities[i3 + 1] - this.velocities[i3 + 1]) * t
        this.velocities[i3 + 2] = this.velocities[i3 + 2] + (this.originalVelocities[i3 + 2] - this.velocities[i3 + 2]) * t
      }
      if (this.resetProgress >= 1) {
        this.isResetting = false
      }
    }

    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.color.needsUpdate = true
    this.geometry.attributes.size.needsUpdate = true
  }

  easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
  }

  getState(): ParticleState {
    return {
      positions: this.positions,
      velocities: this.velocities,
      colors: this.colors,
      sizes: this.sizes
    }
  }
}
