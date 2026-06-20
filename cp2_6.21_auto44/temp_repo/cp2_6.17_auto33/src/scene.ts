import * as THREE from 'three'
import { useStore, colorThemes, ColorTheme } from './store'

const vertexShader = `
  attribute vec3 color;
  attribute vec3 originalPosition;
  attribute vec3 originalColor;
  attribute float originalSize;
  attribute float novaPhase;
  attribute float alpha;
  
  uniform float uTime;
  uniform float uPixelRatio;
  
  varying vec3 vColor;
  varying float vAlpha;
  varying float vNovaPhase;
  
  void main() {
    vColor = color;
    vAlpha = alpha;
    vNovaPhase = novaPhase;
    
    float sizeMultiplier = 1.0;
    if (novaPhase > 0.0) {
      float t = novaPhase;
      float peakT = 0.3 / 1.5;
      if (t < peakT) {
        sizeMultiplier = 1.0 + (5.0 / originalSize - 1.0) * (t / peakT);
      } else {
        sizeMultiplier = 5.0 / originalSize - (5.0 / originalSize - 1.0) * ((t - peakT) / (1.0 - peakT));
      }
    }
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = originalSize * sizeMultiplier * uPixelRatio * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  varying float vNovaPhase;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) {
      discard;
    }
    
    float alpha = smoothstep(0.5, 0.3, dist) * vAlpha;
    
    vec3 finalColor = vColor;
    if (vNovaPhase > 0.0) {
      float t = vNovaPhase;
      if (t < 0.533) {
        float whiteT = t / 0.533;
        finalColor = mix(vec3(1.0), vColor, whiteT);
      }
    }
    
    gl_FragColor = vec4(finalColor, alpha);
  }
`

const tailVertexShader = `
  attribute vec3 prevPosition;
  attribute vec3 tailColor;
  attribute float tailAlpha;
  
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vColor = tailColor;
    vAlpha = tailAlpha;
    
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = 1.5;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const tailFragmentShader = `
  varying vec3 vColor;
  varying float vAlpha;
  
  void main() {
    vec2 center = gl_PointCoord - vec2(0.5);
    float dist = length(center);
    
    if (dist > 0.5) {
      discard;
    }
    
    float alpha = smoothstep(0.5, 0.3, dist) * vAlpha * 0.3;
    
    gl_FragColor = vec4(vColor, alpha);
  }
`

interface NovaData {
  active: boolean
  position: THREE.Vector3
  time: number
  particles: {
    index: number
    direction: THREE.Vector3
    speed: number
    originalSpeed: number
  }[]
}

interface ParticleTransition {
  type: 'in' | 'out'
  startTime: number
  duration: number
  startPos: THREE.Vector3
  endPos: THREE.Vector3
}

const MAX_PARTICLES = 5000

export default class AstroScene {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer | null
  particles: THREE.Points
  tailParticles: THREE.Points
  geometry: THREE.BufferGeometry
  tailGeometry: THREE.BufferGeometry
  material: THREE.ShaderMaterial
  tailMaterial: THREE.ShaderMaterial
  mouse: THREE.Vector2
  mouseWorld: THREE.Vector3
  isMouseOver: boolean
  mouseVelocity: THREE.Vector2
  lastMousePos: THREE.Vector2
  novaData: NovaData
  unsubscribe: (() => void) | null
  animationId: number | null
  clock: THREE.Clock
  container: HTMLElement | null
  
  currentCount: number
  driftPhase: number[]
  driftFrequencies: Float32Array
  transitionParticles: Map<number, ParticleTransition>
  colorTransition: {
    active: boolean
    startTime: number
    duration: number
  }
  resetAnimation: {
    active: boolean
    startTime: number
    duration: number
  }
  positions: Float32Array
  originalPositions: Float32Array
  colors: Float32Array
  originalColors: Float32Array
  targetColors: Float32Array
  sizes: Float32Array
  originalSizes: Float32Array
  velocities: Float32Array
  driftSpeeds: Float32Array
  colorGroups: Uint8Array
  novaPhases: Float32Array
  alphas: Float32Array
  prevPositions: Float32Array
  tailColors: Float32Array
  tailAlphas: Float32Array
  visibleCount: number
  
  constructor() {
    this.scene = new THREE.Scene()
    this.camera = new THREE.PerspectiveCamera(75, 1, 0.1, 5000)
    this.camera.position.z = 1000
    this.renderer = null
    
    this.mouse = new THREE.Vector2()
    this.mouseWorld = new THREE.Vector3()
    this.isMouseOver = false
    this.mouseVelocity = new THREE.Vector2()
    this.lastMousePos = new THREE.Vector2()
    
    this.novaData = {
      active: false,
      position: new THREE.Vector3(),
      time: 0,
      particles: [],
    }
    
    this.unsubscribe = null
    this.animationId = null
    this.clock = new THREE.Clock()
    this.container = null
    
    this.currentCount = 0
    this.driftPhase = []
    this.driftFrequencies = new Float32Array(MAX_PARTICLES)
    this.transitionParticles = new Map()
    this.colorTransition = { active: false, startTime: 0, duration: 500 }
    this.resetAnimation = { active: false, startTime: 0, duration: 800 }
    
    this.positions = new Float32Array(MAX_PARTICLES * 3)
    this.originalPositions = new Float32Array(MAX_PARTICLES * 3)
    this.colors = new Float32Array(MAX_PARTICLES * 3)
    this.originalColors = new Float32Array(MAX_PARTICLES * 3)
    this.targetColors = new Float32Array(MAX_PARTICLES * 3)
    this.sizes = new Float32Array(MAX_PARTICLES)
    this.originalSizes = new Float32Array(MAX_PARTICLES)
    this.velocities = new Float32Array(MAX_PARTICLES * 3)
    this.driftSpeeds = new Float32Array(MAX_PARTICLES)
    this.colorGroups = new Uint8Array(MAX_PARTICLES)
    this.novaPhases = new Float32Array(MAX_PARTICLES)
    this.alphas = new Float32Array(MAX_PARTICLES)
    
    this.prevPositions = new Float32Array(MAX_PARTICLES * 15 * 3)
    this.tailColors = new Float32Array(MAX_PARTICLES * 15 * 3)
    this.tailAlphas = new Float32Array(MAX_PARTICLES * 15)
    
    this.visibleCount = 0
    
    this.geometry = new THREE.BufferGeometry()
    this.tailGeometry = new THREE.BufferGeometry()
    
    this.material = new THREE.ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    
    this.tailMaterial = new THREE.ShaderMaterial({
      vertexShader: tailVertexShader,
      fragmentShader: tailFragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: 1 },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    })
    
    this.particles = new THREE.Points(this.geometry, this.material)
    this.tailParticles = new THREE.Points(this.tailGeometry, this.tailMaterial)
  }
  
  init(container: HTMLElement) {
    this.container = container
    
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    })
    this.renderer.setSize(container.clientWidth, container.clientHeight)
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.setClearColor(0x000000, 0)
    container.appendChild(this.renderer.domElement)
    
    this.material.uniforms.uPixelRatio.value = this.renderer.getPixelRatio()
    this.tailMaterial.uniforms.uPixelRatio.value = this.renderer.getPixelRatio()
    
    const initialCount = useStore.getState().particleCount
    this.initParticles(initialCount)
    
    this.scene.add(this.particles)
    this.scene.add(this.tailParticles)
    
    this.updateCameraAspect()
    
    this.unsubscribe = useStore.subscribe((state, prevState) => {
      if (state.particleCount !== prevState.particleCount) {
        this.setParticleCount(state.particleCount)
      }
      if (state.colorTheme !== prevState.colorTheme) {
        this.setColorTheme(state.colorTheme)
      }
      if (state.isResetting && !prevState.isResetting) {
        this.resetView()
      }
    })
    
    this.animate()
    
    window.addEventListener('resize', this.handleResize)
  }
  
  private initParticles(count: number) {
    const theme = useStore.getState().colorTheme
    const colors = colorThemes[theme]
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const radius = 300 + Math.random() * 200
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      
      const x = radius * Math.sin(phi) * Math.cos(theta)
      const y = radius * Math.sin(phi) * Math.sin(theta)
      const z = radius * Math.cos(phi) - 200 + Math.random() * 400
      
      this.positions[i * 3] = x
      this.positions[i * 3 + 1] = y
      this.positions[i * 3 + 2] = z
      
      this.originalPositions[i * 3] = x
      this.originalPositions[i * 3 + 1] = y
      this.originalPositions[i * 3 + 2] = z
      
      const colorGroup = Math.floor(Math.random() * 3)
      this.colorGroups[i] = colorGroup
      
      const colorPair = colors[colorGroup]
      const colorIndex = Math.random() > 0.5 ? 0 : 1
      const color = new THREE.Color(colorPair[colorIndex])
      
      this.colors[i * 3] = color.r
      this.colors[i * 3 + 1] = color.g
      this.colors[i * 3 + 2] = color.b
      
      this.originalColors[i * 3] = color.r
      this.originalColors[i * 3 + 1] = color.g
      this.originalColors[i * 3 + 2] = color.b
      
      this.targetColors[i * 3] = color.r
      this.targetColors[i * 3 + 1] = color.g
      this.targetColors[i * 3 + 2] = color.b
      
      const size = 1 + Math.random() * 2
      this.sizes[i] = size
      this.originalSizes[i] = size
      
      this.velocities[i * 3] = 0
      this.velocities[i * 3 + 1] = 0
      this.velocities[i * 3 + 2] = 0
      
      this.driftSpeeds[i] = 0.5 + Math.random() * 1.5
      this.driftFrequencies[i] = 0.2 + Math.random() * 0.6
      
      this.novaPhases[i] = 0
      
      this.alphas[i] = i < count ? 1 : 0
      
      this.driftPhase[i] = Math.random() * Math.PI * 2
      
      for (let j = 0; j < 15; j++) {
        this.prevPositions[(i * 15 + j) * 3] = x
        this.prevPositions[(i * 15 + j) * 3 + 1] = y
        this.prevPositions[(i * 15 + j) * 3 + 2] = z
        
        this.tailColors[(i * 15 + j) * 3] = color.r
        this.tailColors[(i * 15 + j) * 3 + 1] = color.g
        this.tailColors[(i * 15 + j) * 3 + 2] = color.b
        
        this.tailAlphas[i * 15 + j] = 0
      }
    }
    
    this.currentCount = count
    this.updateGeometryAttributes()
    this.updateTailGeometryAttributes()
  }
  
  private updateGeometryAttributes() {
    this.geometry.setAttribute('position', new THREE.BufferAttribute(this.positions, 3))
    this.geometry.setAttribute('originalPosition', new THREE.BufferAttribute(this.originalPositions, 3))
    this.geometry.setAttribute('color', new THREE.BufferAttribute(this.colors, 3))
    this.geometry.setAttribute('originalColor', new THREE.BufferAttribute(this.originalColors, 3))
    this.geometry.setAttribute('originalSize', new THREE.BufferAttribute(this.originalSizes, 1))
    this.geometry.setAttribute('novaPhase', new THREE.BufferAttribute(this.novaPhases, 1))
    this.geometry.setAttribute('alpha', new THREE.BufferAttribute(this.alphas, 1))
    
    this.geometry.setDrawRange(0, MAX_PARTICLES)
    
    this.geometry.attributes.position.needsUpdate = true
  }
  
  private updateTailGeometryAttributes() {
    this.tailGeometry.setAttribute('position', new THREE.BufferAttribute(this.prevPositions, 3))
    this.tailGeometry.setAttribute('prevPosition', new THREE.BufferAttribute(this.prevPositions, 3))
    this.tailGeometry.setAttribute('tailColor', new THREE.BufferAttribute(this.tailColors, 3))
    this.tailGeometry.setAttribute('tailAlpha', new THREE.BufferAttribute(this.tailAlphas, 1))
    
    this.tailGeometry.setDrawRange(0, MAX_PARTICLES * 15)
    
    this.tailGeometry.attributes.position.needsUpdate = true
  }
  
  private updateCameraAspect() {
    if (!this.container || !this.renderer) return
    this.camera.aspect = this.container.clientWidth / this.container.clientHeight
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(this.container.clientWidth, this.container.clientHeight)
  }
  
  private handleResize = () => {
    this.updateCameraAspect()
  }
  
  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
  }
  
  private hexToRgb(hex: string): { r: number; g: number; b: number } {
    const color = new THREE.Color(hex)
    return { r: color.r, g: color.g, b: color.b }
  }
  
  handleMouseMove(clientX: number, clientY: number) {
    if (!this.container) return
    
    const rect = this.container.getBoundingClientRect()
    this.mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
    this.mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
    
    this.mouseVelocity.x = this.mouse.x - this.lastMousePos.x
    this.mouseVelocity.y = this.mouse.y - this.lastMousePos.y
    this.lastMousePos.copy(this.mouse)
    
    const vector = new THREE.Vector3(this.mouse.x, this.mouse.y, 0.5)
    vector.unproject(this.camera)
    const dir = vector.sub(this.camera.position).normalize()
    const distance = -this.camera.position.z / dir.z
    this.mouseWorld.copy(this.camera.position).add(dir.multiplyScalar(distance))
    
    this.isMouseOver = true
  }
  
  handleMouseLeave() {
    this.isMouseOver = false
  }
  
  handleClick(clientX: number, clientY: number) {
    if (!this.container) return
    
    const rect = this.container.getBoundingClientRect()
    const x = ((clientX - rect.left) / rect.width) * 2 - 1
    const y = -((clientY - rect.top) / rect.height) * 2 + 1
    
    const vector = new THREE.Vector3(x, y, 0.5)
    vector.unproject(this.camera)
    const dir = vector.sub(this.camera.position).normalize()
    const distance = -this.camera.position.z / dir.z
    const clickWorld = this.camera.position.clone().add(dir.multiplyScalar(distance))
    
    this.novaData.active = true
    this.novaData.position.copy(clickWorld)
    this.novaData.time = 0
    this.novaData.particles = []
    
    const radius = 150
    
    for (let i = 0; i < this.currentCount; i++) {
      const px = this.positions[i * 3]
      const py = this.positions[i * 3 + 1]
      const pz = this.positions[i * 3 + 2]
      
      const dx = px - clickWorld.x
      const dy = py - clickWorld.y
      const dz = pz - clickWorld.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      
      if (dist < radius) {
        const direction = new THREE.Vector3(dx, dy, dz).normalize()
        const angleOffset = (Math.random() - 0.5) * Math.PI / 6
        const cos = Math.cos(angleOffset)
        const sin = Math.sin(angleOffset)
        const axis = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize()
        const rotatedDir = direction.clone().applyAxisAngle(axis, angleOffset)
        
        const originalSpeed = this.driftSpeeds[i] * 10
        this.novaData.particles.push({
          index: i,
          direction: rotatedDir,
          speed: originalSpeed,
          originalSpeed: originalSpeed,
        })
        
        this.novaPhases[i] = 0.001
      }
    }
  }
  
  setParticleCount(count: number) {
    if (count === this.currentCount) return
    
    const diff = count - this.currentCount
    
    if (diff > 0) {
      for (let i = 0; i < diff; i++) {
        const idx = this.currentCount + i
        
        const edge = Math.floor(Math.random() * 4)
        const width = this.container ? this.container.clientWidth : 800
        const height = this.container ? this.container.clientHeight : 600
        
        let startX: number, startY: number, startZ: number
        
        const endX = this.originalPositions[idx * 3]
        const endY = this.originalPositions[idx * 3 + 1]
        const endZ = this.originalPositions[idx * 3 + 2]
        
        switch (edge) {
          case 0:
            startX = -width
            startY = (Math.random() - 0.5) * height
            startZ = (Math.random() - 0.5) * 400
            break
          case 1:
            startX = width
            startY = (Math.random() - 0.5) * height
            startZ = (Math.random() - 0.5) * 400
            break
          case 2:
            startX = (Math.random() - 0.5) * width
            startY = -height
            startZ = (Math.random() - 0.5) * 400
            break
          default:
            startX = (Math.random() - 0.5) * width
            startY = height
            startZ = (Math.random() - 0.5) * 400
        }
        
        this.positions[idx * 3] = startX
        this.positions[idx * 3 + 1] = startY
        this.positions[idx * 3 + 2] = startZ
        
        this.alphas[idx] = 0
        
        this.transitionParticles.set(idx, {
          type: 'in',
          startTime: performance.now(),
          duration: 500,
          startPos: new THREE.Vector3(startX, startY, startZ),
          endPos: new THREE.Vector3(endX, endY, endZ),
        })
      }
    } else {
      for (let i = 0; i < -diff; i++) {
        const idx = this.currentCount - 1 - i
        
        const width = this.container ? this.container.clientWidth : 800
        const height = this.container ? this.container.clientHeight : 600
        
        const px = this.positions[idx * 3]
        const py = this.positions[idx * 3 + 1]
        const pz = this.positions[idx * 3 + 2]
        
        const angle = Math.atan2(py, px)
        const endX = Math.cos(angle) * width * 1.5
        const endY = Math.sin(angle) * height * 1.5
        const endZ = pz
        
        this.transitionParticles.set(idx, {
          type: 'out',
          startTime: performance.now(),
          duration: 500,
          startPos: new THREE.Vector3(px, py, pz),
          endPos: new THREE.Vector3(endX, endY, endZ),
        })
      }
    }
    
    this.currentCount = count
    
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.alpha.needsUpdate = true
  }
  
  setColorTheme(theme: ColorTheme) {
    const colors = colorThemes[theme]
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const colorGroup = this.colorGroups[i]
      const colorPair = colors[colorGroup]
      const colorIndex = Math.random() > 0.5 ? 0 : 1
      const color = this.hexToRgb(colorPair[colorIndex])
      
      this.targetColors[i * 3] = color.r
      this.targetColors[i * 3 + 1] = color.g
      this.targetColors[i * 3 + 2] = color.b
    }
    
    this.colorTransition.active = true
    this.colorTransition.startTime = performance.now()
  }
  
  resetView() {
    this.resetAnimation.active = true
    this.resetAnimation.startTime = performance.now()
    
    this.novaData.active = false
    this.novaData.particles = []
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.novaPhases[i] = 0
      this.velocities[i * 3] = 0
      this.velocities[i * 3 + 1] = 0
      this.velocities[i * 3 + 2] = 0
    }
    
    this.transitionParticles.clear()
    
    this.geometry.attributes.novaPhase.needsUpdate = true
  }
  
  private updateRepulsion(deltaTime: number) {
    if (!this.isMouseOver) return
    
    const repulsionRadius = 200
    const maxStrength = 500
    const lateralStrengthRatio = 0.2
    const time = this.clock.getElapsedTime()
    
    for (let i = 0; i < this.currentCount; i++) {
      const px = this.positions[i * 3]
      const py = this.positions[i * 3 + 1]
      const pz = this.positions[i * 3 + 2]
      
      const dx = px - this.mouseWorld.x
      const dy = py - this.mouseWorld.y
      const dz = pz - this.mouseWorld.z
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz)
      
      if (dist < repulsionRadius && dist > 0) {
        const strength = maxStrength / (dist * dist + 100)
        const nx = dx / dist
        const ny = dy / dist
        const nz = dz / dist
        
        this.velocities[i * 3] += nx * strength * deltaTime
        this.velocities[i * 3 + 1] += ny * strength * deltaTime
        this.velocities[i * 3 + 2] += nz * strength * deltaTime
        
        const distFactor = 1 - dist / repulsionRadius
        const lateralStrength = strength * lateralStrengthRatio * distFactor
        
        const phase = i * 0.37 + time * 1.5
        const swingAngle = Math.sin(phase) * 0.8 + Math.sin(phase * 2.3) * 0.3
        
        const tanX = -ny
        const tanY = nx
        const tanZ = 0
        const tanLen = Math.sqrt(tanX * tanX + tanY * tanY + tanZ * tanZ)
        
        if (tanLen > 0.001) {
          const tx = tanX / tanLen
          const ty = tanY / tanLen
          const tz = tanZ / tanLen
          
          const bx = ny * tz - nz * ty
          const by = nz * tx - nx * tz
          const bz = nx * ty - ny * tx
          
          const latX = tx * Math.cos(swingAngle) + bx * Math.sin(swingAngle)
          const latY = ty * Math.cos(swingAngle) + by * Math.sin(swingAngle)
          const latZ = tz * Math.cos(swingAngle) + bz * Math.sin(swingAngle)
          
          this.velocities[i * 3] += latX * lateralStrength * deltaTime
          this.velocities[i * 3 + 1] += latY * lateralStrength * deltaTime
          this.velocities[i * 3 + 2] += latZ * lateralStrength * deltaTime
        }
      }
    }
  }
  
  private updateNova(deltaTime: number) {
    if (this.novaData.active) {
      this.novaData.time += deltaTime
      
      const totalDuration = 1.5
      const accelerateTime = 0.3
      
      for (const particle of this.novaData.particles) {
        const i = particle.index
        
        if (this.novaData.time < accelerateTime) {
          const t = this.novaData.time / accelerateTime
          particle.speed = particle.originalSpeed * (1 + t * 9)
        } else if (this.novaData.time < totalDuration) {
          const t = (this.novaData.time - accelerateTime) / (totalDuration - accelerateTime)
          particle.speed = particle.originalSpeed * (10 - t * 9)
        } else {
          particle.speed = particle.originalSpeed
        }
        
        this.positions[i * 3] += particle.direction.x * particle.speed * deltaTime * 60
        this.positions[i * 3 + 1] += particle.direction.y * particle.speed * deltaTime * 60
        this.positions[i * 3 + 2] += particle.direction.z * particle.speed * deltaTime * 60
        
        if (this.novaData.time < totalDuration) {
          this.novaPhases[i] = Math.min(1, this.novaData.time / totalDuration)
        } else {
          this.novaPhases[i] = 0
        }
      }
      
      if (this.novaData.time >= totalDuration) {
        this.novaData.active = false
        this.novaData.particles = []
      }
      
      this.geometry.attributes.novaPhase.needsUpdate = true
    }
  }
  
  private updateDrift(deltaTime: number) {
    const time = this.clock.getElapsedTime()
    
    for (let i = 0; i < this.currentCount; i++) {
      const drift = Math.sin(time * this.driftFrequencies[i] + this.driftPhase[i]) * this.driftSpeeds[i] * deltaTime
      
      if (!this.novaData.particles.some(p => p.index === i) && !this.transitionParticles.has(i)) {
        this.positions[i * 3 + 2] += drift
      }
    }
  }
  
  private updateVelocity(deltaTime: number) {
    const totalFrames = deltaTime * 60
    
    for (let i = 0; i < this.currentCount; i++) {
      if (this.novaData.particles.some(p => p.index === i)) {
        continue
      }
      if (this.transitionParticles.has(i)) {
        continue
      }
      
      let vx = this.velocities[i * 3]
      let vy = this.velocities[i * 3 + 1]
      let vz = this.velocities[i * 3 + 2]
      
      let px = this.positions[i * 3]
      let py = this.positions[i * 3 + 1]
      let pz = this.positions[i * 3 + 2]
      
      if (!this.isMouseOver) {
        const ox = this.originalPositions[i * 3]
        const oy = this.originalPositions[i * 3 + 1]
        const oz = this.originalPositions[i * 3 + 2]
        
        const durationFrames = 60 + (i % 90)
        const lerpFactorPerFrame = 1 - Math.pow(0.01, 1 / durationFrames)
        const lerpFactor = 1 - Math.pow(1 - lerpFactorPerFrame, totalFrames)
        
        const easeT = 1 - Math.pow(1 - lerpFactor, 3)
        
        px = px + (ox - px) * easeT
        py = py + (oy - py) * easeT
        pz = pz + (oz - pz) * easeT
        
        vx *= 0.9
        vy *= 0.9
        vz *= 0.9
      } else {
        const dragFactor = Math.pow(0.98, totalFrames)
        
        px += vx * deltaTime
        py += vy * deltaTime
        pz += vz * deltaTime
        
        vx *= dragFactor
        vy *= dragFactor
        vz *= dragFactor
      }
      
      this.positions[i * 3] = px
      this.positions[i * 3 + 1] = py
      this.positions[i * 3 + 2] = pz
      
      this.velocities[i * 3] = vx
      this.velocities[i * 3 + 1] = vy
      this.velocities[i * 3 + 2] = vz
    }
  }
  
  private updateTransitions() {
    const now = performance.now()
    
    for (const [idx, transition] of this.transitionParticles) {
      const elapsed = now - transition.startTime
      const t = Math.min(1, elapsed / transition.duration)
      const easedT = this.easeInOut(t)
      
      const x = transition.startPos.x + (transition.endPos.x - transition.startPos.x) * easedT
      const y = transition.startPos.y + (transition.endPos.y - transition.startPos.y) * easedT
      const z = transition.startPos.z + (transition.endPos.z - transition.startPos.z) * easedT
      
      this.positions[idx * 3] = x
      this.positions[idx * 3 + 1] = y
      this.positions[idx * 3 + 2] = z
      
      if (transition.type === 'in') {
        this.alphas[idx] = easedT
      } else {
        this.alphas[idx] = 1 - easedT
      }
      
      if (t >= 1) {
        this.transitionParticles.delete(idx)
        if (transition.type === 'out') {
          this.alphas[idx] = 0
        } else {
          this.alphas[idx] = 1
        }
      }
    }
    
    this.geometry.attributes.alpha.needsUpdate = true
  }
  
  private updateColorTransition() {
    if (!this.colorTransition.active) return
    
    const now = performance.now()
    const elapsed = now - this.colorTransition.startTime
    const t = Math.min(1, elapsed / this.colorTransition.duration)
    
    for (let i = 0; i < MAX_PARTICLES; i++) {
      const r = this.originalColors[i * 3] + (this.targetColors[i * 3] - this.originalColors[i * 3]) * t
      const g = this.originalColors[i * 3 + 1] + (this.targetColors[i * 3 + 1] - this.originalColors[i * 3 + 1]) * t
      const b = this.originalColors[i * 3 + 2] + (this.targetColors[i * 3 + 2] - this.originalColors[i * 3 + 2]) * t
      
      this.colors[i * 3] = r
      this.colors[i * 3 + 1] = g
      this.colors[i * 3 + 2] = b
    }
    
    this.geometry.attributes.color.needsUpdate = true
    
    if (t >= 1) {
      this.colorTransition.active = false
      for (let i = 0; i < MAX_PARTICLES * 3; i++) {
        this.originalColors[i] = this.targetColors[i]
      }
    }
  }
  
  private updateResetAnimation() {
    if (!this.resetAnimation.active) return
    
    const now = performance.now()
    const elapsed = now - this.resetAnimation.startTime
    const t = Math.min(1, elapsed / this.resetAnimation.duration)
    const easedT = this.easeInOut(t)
    
    for (let i = 0; i < this.currentCount; i++) {
      const ox = this.originalPositions[i * 3]
      const oy = this.originalPositions[i * 3 + 1]
      const oz = this.originalPositions[i * 3 + 2]
      
      const px = this.positions[i * 3]
      const py = this.positions[i * 3 + 1]
      const pz = this.positions[i * 3 + 2]
      
      this.positions[i * 3] = px + (ox - px) * easedT
      this.positions[i * 3 + 1] = py + (oy - py) * easedT
      this.positions[i * 3 + 2] = pz + (oz - pz) * easedT
    }
    
    if (t >= 1) {
      this.resetAnimation.active = false
    }
  }
  
  private updateTails() {
    for (let i = 0; i < this.currentCount; i++) {
      for (let j = 14; j > 0; j--) {
        const prevIdx = (i * 15 + j - 1) * 3
        const currIdx = (i * 15 + j) * 3
        
        this.prevPositions[currIdx] = this.prevPositions[prevIdx]
        this.prevPositions[currIdx + 1] = this.prevPositions[prevIdx + 1]
        this.prevPositions[currIdx + 2] = this.prevPositions[prevIdx + 2]
        
        this.tailColors[currIdx] = this.tailColors[prevIdx]
        this.tailColors[currIdx + 1] = this.tailColors[prevIdx + 1]
        this.tailColors[currIdx + 2] = this.tailColors[prevIdx + 2]
        
        this.tailAlphas[i * 15 + j] = this.tailAlphas[i * 15 + j - 1] * 0.9
      }
      
      const firstIdx = (i * 15) * 3
      this.prevPositions[firstIdx] = this.positions[i * 3]
      this.prevPositions[firstIdx + 1] = this.positions[i * 3 + 1]
      this.prevPositions[firstIdx + 2] = this.positions[i * 3 + 2]
      
      this.tailColors[firstIdx] = this.colors[i * 3]
      this.tailColors[firstIdx + 1] = this.colors[i * 3 + 1]
      this.tailColors[firstIdx + 2] = this.colors[i * 3 + 2]
      
      const speed = Math.sqrt(
        this.velocities[i * 3] ** 2 +
        this.velocities[i * 3 + 1] ** 2 +
        this.velocities[i * 3 + 2] ** 2
      )
      this.tailAlphas[i * 15] = Math.min(1, speed / 50) * 0.3
    }
    
    this.tailGeometry.attributes.position.needsUpdate = true
    this.tailGeometry.attributes.tailAlpha.needsUpdate = true
  }
  
  update(deltaTime: number) {
    this.material.uniforms.uTime.value = this.clock.getElapsedTime()
    this.tailMaterial.uniforms.uTime.value = this.clock.getElapsedTime()
    
    if (!this.resetAnimation.active) {
      this.updateRepulsion(deltaTime)
      this.updateNova(deltaTime)
      this.updateDrift(deltaTime)
      this.updateVelocity(deltaTime)
    }
    
    this.updateTransitions()
    this.updateColorTransition()
    this.updateResetAnimation()
    this.updateTails()
    
    this.geometry.attributes.position.needsUpdate = true
    this.geometry.attributes.color.needsUpdate = true
  }
  
  private animate = () => {
    const deltaTime = Math.min(this.clock.getDelta(), 0.1)
    
    this.update(deltaTime)
    
    if (this.renderer) {
      this.renderer.render(this.scene, this.camera)
    }
    
    this.animationId = requestAnimationFrame(this.animate)
  }
  
  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
    }
    
    window.removeEventListener('resize', this.handleResize)
    
    if (this.unsubscribe) {
      this.unsubscribe()
    }
    
    if (this.renderer) {
      this.renderer.dispose()
      if (this.container && this.renderer.domElement.parentNode === this.container) {
        this.container.removeChild(this.renderer.domElement)
      }
    }
    
    this.geometry.dispose()
    this.tailGeometry.dispose()
    this.material.dispose()
    this.tailMaterial.dispose()
  }
}
