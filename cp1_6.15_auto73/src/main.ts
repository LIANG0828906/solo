import * as THREE from 'three'
import { buildControls } from './controls'
import {
  GalaxyParams,
  GalaxyControls,
  ParticleTransitionState,
  ColorTransitionState,
  FadeInState,
  ColorTheme,
  COLOR_THEMES
} from './types'

const MAX_PARTICLES = 8000
const PARTICLE_TRANSITION_DURATION = 1000
const COLOR_TRANSITION_DURATION = 500
const FADE_IN_DURATION = 1000
const ATTRACTOR_1: [number, number, number] = [2, 1, 0]
const ATTRACTOR_2: [number, number, number] = [-2, -1, 0]

class ParticleSystem {
  private scene: THREE.Scene
  private maxCount: number

  private positions: Float32Array
  private velocities: Float32Array
  private colors: Float32Array
  private distances: Float32Array
  private sizes: Float32Array

  private geometry: THREE.BufferGeometry
  private posAttr: THREE.BufferAttribute
  private colAttr: THREE.BufferAttribute
  private material: THREE.PointsMaterial
  private points: THREE.Points

  private transitionPositions: Float32Array
  private transitionVelocities: Float32Array
  private transitionColors: Float32Array
  private transitionDistances: Float32Array
  private transitionSizes: Float32Array
  private transitionGeometry: THREE.BufferGeometry | null = null
  private transitionPosAttr: THREE.BufferAttribute | null = null
  private transitionColAttr: THREE.BufferAttribute | null = null
  private transitionMaterial: THREE.PointsMaterial | null = null
  private transitionPoints: THREE.Points | null = null

  public count: number
  public particleTransition: ParticleTransitionState
  public colorTransition: ColorTransitionState
  public fadeIn: FadeInState

  constructor(scene: THREE.Scene, maxCount: number, initialCount: number, initialTheme: ColorTheme) {
    this.scene = scene
    this.maxCount = maxCount
    this.count = initialCount

    this.positions = new Float32Array(maxCount * 3)
    this.velocities = new Float32Array(maxCount * 3)
    this.colors = new Float32Array(maxCount * 3)
    this.distances = new Float32Array(maxCount)
    this.sizes = new Float32Array(maxCount)

    this.transitionPositions = new Float32Array(maxCount * 3)
    this.transitionVelocities = new Float32Array(maxCount * 3)
    this.transitionColors = new Float32Array(maxCount * 3)
    this.transitionDistances = new Float32Array(maxCount)
    this.transitionSizes = new Float32Array(maxCount)

    this.particleTransition = {
      active: false,
      startTime: 0,
      duration: PARTICLE_TRANSITION_DURATION,
      oldCount: 0,
      newCount: 0
    }

    this.colorTransition = {
      active: false,
      startTime: 0,
      duration: COLOR_TRANSITION_DURATION,
      fromTheme: initialTheme,
      toTheme: initialTheme
    }

    this.fadeIn = {
      active: true,
      startTime: performance.now(),
      duration: FADE_IN_DURATION
    }

    this.generateSpiralGalaxy(this.count, this.positions, this.velocities, this.distances, this.sizes)
    this.computeColors(this.count, this.distances, this.colors, initialTheme)

    this.geometry = new THREE.BufferGeometry()
    this.posAttr = new THREE.BufferAttribute(this.positions.subarray(0, this.count * 3), 3)
    this.colAttr = new THREE.BufferAttribute(this.colors.subarray(0, this.count * 3), 3)
    this.posAttr.setUsage(THREE.DynamicDrawUsage)
    this.colAttr.setUsage(THREE.DynamicDrawUsage)
    this.geometry.setAttribute('position', this.posAttr)
    this.geometry.setAttribute('color', this.colAttr)

    this.material = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })

    this.points = new THREE.Points(this.geometry, this.material)
    this.scene.add(this.points)
  }

  private generateSpiralGalaxy(
    count: number,
    pos: Float32Array,
    vel: Float32Array,
    dist: Float32Array,
    size: Float32Array
  ) {
    const armCount = 4
    for (let i = 0; i < count; i++) {
      const arm = Math.floor(Math.random() * armCount)
      const radius = Math.pow(Math.random(), 1.5) * 5.0
      const baseAngle = arm * (Math.PI * 2 / armCount)
      const spiralAngle = radius * 2.5
      const spread = (1 - radius / 5) * 0.4 + 0.05
      const angle = baseAngle + spiralAngle + (Math.random() - 0.5) * spread

      const x = Math.cos(angle) * radius
      const z = Math.sin(angle) * radius
      const heightFactor = 1 - radius / 5
      const y = (Math.random() - 0.5) * 0.6 * heightFactor

      const i3 = i * 3
      pos[i3] = x
      pos[i3 + 1] = y
      pos[i3 + 2] = z
      vel[i3] = 0
      vel[i3 + 1] = 0
      vel[i3 + 2] = 0
      dist[i] = radius / 5.0
      size[i] = 0.045 - dist[i] * 0.02
    }
  }

  private computeColors(
    count: number,
    dist: Float32Array,
    col: Float32Array,
    theme: ColorTheme
  ) {
    const cr = theme.centerColor[0]
    const cg = theme.centerColor[1]
    const cb = theme.centerColor[2]
    const er = theme.edgeColor[0]
    const eg = theme.edgeColor[1]
    const eb = theme.edgeColor[2]
    for (let i = 0; i < count; i++) {
      const t = dist[i]
      const i3 = i * 3
      col[i3] = cr + (er - cr) * t
      col[i3 + 1] = cg + (eg - cg) * t
      col[i3 + 2] = cb + (eb - cb) * t
    }
  }

  private lerpTheme(a: ColorTheme, b: ColorTheme, t: number): ColorTheme {
    return {
      name: b.name,
      centerColor: [
        a.centerColor[0] + (b.centerColor[0] - a.centerColor[0]) * t,
        a.centerColor[1] + (b.centerColor[1] - a.centerColor[1]) * t,
        a.centerColor[2] + (b.centerColor[2] - a.centerColor[2]) * t
      ],
      edgeColor: [
        a.edgeColor[0] + (b.edgeColor[0] - a.edgeColor[0]) * t,
        a.edgeColor[1] + (b.edgeColor[1] - a.edgeColor[1]) * t,
        a.edgeColor[2] + (b.edgeColor[2] - a.edgeColor[2]) * t
      ]
    }
  }

  private getInterpolatedTheme(now: number): ColorTheme {
    if (this.colorTransition.active) {
      const t = Math.min(1, (now - this.colorTransition.startTime) / this.colorTransition.duration)
      return this.lerpTheme(this.colorTransition.fromTheme, this.colorTransition.toTheme, t)
    }
    return COLOR_THEMES[params.colorThemeIndex]
  }

  public updatePositions(count: number, dt: number, speed: number, rotSpeed: number, a1s: number, a2s: number) {
    const a1x = ATTRACTOR_1[0]
    const a1y = ATTRACTOR_1[1]
    const a1z = ATTRACTOR_1[2]
    const a2x = ATTRACTOR_2[0]
    const a2y = ATTRACTOR_2[1]
    const a2z = ATTRACTOR_2[2]
    const step = dt * speed
    const rot = rotSpeed * dt
    const cosR = Math.cos(rot)
    const sinR = Math.sin(rot)
    const pos = this.positions
    const vel = this.velocities

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      let px = pos[i3]
      let py = pos[i3 + 1]
      let pz = pos[i3 + 2]
      let vx = vel[i3]
      let vy = vel[i3 + 1]
      let vz = vel[i3 + 2]

      const dx1 = a1x - px
      const dy1 = a1y - py
      const dz1 = a1z - pz
      const d1Sq = dx1 * dx1 + dy1 * dy1 + dz1 * dz1
      const d1 = Math.sqrt(d1Sq) + 0.01
      const f1 = a1s / (d1Sq + 0.1)

      const dx2 = a2x - px
      const dy2 = a2y - py
      const dz2 = a2z - pz
      const d2Sq = dx2 * dx2 + dy2 * dy2 + dz2 * dz2
      const d2 = Math.sqrt(d2Sq) + 0.01
      const f2 = a2s / (d2Sq + 0.1)

      vx += ((dx1 / d1) * f1 + (dx2 / d2) * f2) * step
      vy += ((dy1 / d1) * f1 + (dy2 / d2) * f2) * step
      vz += ((dz1 / d1) * f1 + (dz2 / d2) * f2) * step

      vx *= 0.985
      vy *= 0.985
      vz *= 0.985

      px += vx * step
      py += vy * step
      pz += vz * step

      const nx = px * cosR - pz * sinR
      const nz = px * sinR + pz * cosR

      pos[i3] = nx
      pos[i3 + 1] = py
      pos[i3 + 2] = nz
      vel[i3] = vx
      vel[i3 + 1] = vy
      vel[i3 + 2] = vz
    }

    this.posAttr.needsUpdate = true
  }

  public updateTransitionPositions(count: number, dt: number, speed: number, rotSpeed: number, a1s: number, a2s: number) {
    if (!this.transitionPoints) return
    const a1x = ATTRACTOR_1[0]
    const a1y = ATTRACTOR_1[1]
    const a1z = ATTRACTOR_1[2]
    const a2x = ATTRACTOR_2[0]
    const a2y = ATTRACTOR_2[1]
    const a2z = ATTRACTOR_2[2]
    const step = dt * speed
    const rot = rotSpeed * dt
    const cosR = Math.cos(rot)
    const sinR = Math.sin(rot)
    const pos = this.transitionPositions
    const vel = this.transitionVelocities

    for (let i = 0; i < count; i++) {
      const i3 = i * 3
      let px = pos[i3]
      let py = pos[i3 + 1]
      let pz = pos[i3 + 2]
      let vx = vel[i3]
      let vy = vel[i3 + 1]
      let vz = vel[i3 + 2]

      const dx1 = a1x - px
      const dy1 = a1y - py
      const dz1 = a1z - pz
      const d1Sq = dx1 * dx1 + dy1 * dy1 + dz1 * dz1
      const d1 = Math.sqrt(d1Sq) + 0.01
      const f1 = a1s / (d1Sq + 0.1)

      const dx2 = a2x - px
      const dy2 = a2y - py
      const dz2 = a2z - pz
      const d2Sq = dx2 * dx2 + dy2 * dy2 + dz2 * dz2
      const d2 = Math.sqrt(d2Sq) + 0.01
      const f2 = a2s / (d2Sq + 0.1)

      vx += ((dx1 / d1) * f1 + (dx2 / d2) * f2) * step
      vy += ((dy1 / d1) * f1 + (dy2 / d2) * f2) * step
      vz += ((dz1 / d1) * f1 + (dz2 / d2) * f2) * step

      vx *= 0.985
      vy *= 0.985
      vz *= 0.985

      px += vx * step
      py += vy * step
      pz += vz * step

      const nx = px * cosR - pz * sinR
      const nz = px * sinR + pz * cosR

      pos[i3] = nx
      pos[i3 + 1] = py
      pos[i3 + 2] = nz
      vel[i3] = vx
      vel[i3 + 1] = vy
      vel[i3 + 2] = vz
    }

    if (this.transitionPosAttr) this.transitionPosAttr.needsUpdate = true
  }

  public updateColors(count: number, elapsed: number, now: number) {
    const theme = this.getInterpolatedTheme(now)
    const breath = 0.08 * Math.sin(elapsed * 1.5)
    const cr = Math.min(1, theme.centerColor[0] + breath)
    const cg = Math.min(1, theme.centerColor[1] + breath)
    const cb = Math.min(1, theme.centerColor[2] + breath)
    const er = Math.min(1, theme.edgeColor[0] + breath * 0.5)
    const eg = Math.min(1, theme.edgeColor[1] + breath * 0.5)
    const eb = Math.min(1, theme.edgeColor[2] + breath * 0.5)
    const col = this.colors
    const dist = this.distances

    if (this.colorTransition.active) {
      const t = Math.min(1, (now - this.colorTransition.startTime) / this.colorTransition.duration)
      const f = this.colorTransition.fromTheme
      const to = this.colorTransition.toTheme
      const icr = f.centerColor[0] + (to.centerColor[0] - f.centerColor[0]) * t
      const icg = f.centerColor[1] + (to.centerColor[1] - f.centerColor[1]) * t
      const icb = f.centerColor[2] + (to.centerColor[2] - f.centerColor[2]) * t
      const ier = f.edgeColor[0] + (to.edgeColor[0] - f.edgeColor[0]) * t
      const ieg = f.edgeColor[1] + (to.edgeColor[1] - f.edgeColor[1]) * t
      const ieb = f.edgeColor[2] + (to.edgeColor[2] - f.edgeColor[2]) * t
      for (let i = 0; i < count; i++) {
        const d = dist[i]
        const i3 = i * 3
        col[i3] = Math.min(1, (icr + (ier - icr) * d) + breath * (1 - d * 0.5))
        col[i3 + 1] = Math.min(1, (icg + (ieg - icg) * d) + breath * (1 - d * 0.5))
        col[i3 + 2] = Math.min(1, (icb + (ieb - icb) * d) + breath * (1 - d * 0.5))
      }
      if (t >= 1) {
        this.colorTransition.active = false
        params.colorThemeIndex = COLOR_THEMES.findIndex(th => th.name === this.colorTransition.toTheme.name)
      }
    } else {
      for (let i = 0; i < count; i++) {
        const t = dist[i]
        const i3 = i * 3
        col[i3] = cr + (er - cr) * t
        col[i3 + 1] = cg + (eg - cg) * t
        col[i3 + 2] = cb + (eb - cb) * t
      }
    }
    this.colAttr.needsUpdate = true
  }

  public updateTransitionColors(count: number, elapsed: number, now: number) {
    if (!this.transitionPoints) return
    const theme = this.getInterpolatedTheme(now)
    const breath = 0.08 * Math.sin(elapsed * 1.5)
    const col = this.transitionColors
    const dist = this.transitionDistances

    if (this.colorTransition.active) {
      const t = Math.min(1, (now - this.colorTransition.startTime) / this.colorTransition.duration)
      const f = this.colorTransition.fromTheme
      const to = this.colorTransition.toTheme
      const icr = f.centerColor[0] + (to.centerColor[0] - f.centerColor[0]) * t
      const icg = f.centerColor[1] + (to.centerColor[1] - f.centerColor[1]) * t
      const icb = f.centerColor[2] + (to.centerColor[2] - f.centerColor[2]) * t
      const ier = f.edgeColor[0] + (to.edgeColor[0] - f.edgeColor[0]) * t
      const ieg = f.edgeColor[1] + (to.edgeColor[1] - f.edgeColor[1]) * t
      const ieb = f.edgeColor[2] + (to.edgeColor[2] - f.edgeColor[2]) * t
      for (let i = 0; i < count; i++) {
        const d = dist[i]
        const i3 = i * 3
        col[i3] = Math.min(1, (icr + (ier - icr) * d) + breath * (1 - d * 0.5))
        col[i3 + 1] = Math.min(1, (icg + (ieg - icg) * d) + breath * (1 - d * 0.5))
        col[i3 + 2] = Math.min(1, (icb + (ieb - icb) * d) + breath * (1 - d * 0.5))
      }
    } else {
      const cr = Math.min(1, theme.centerColor[0] + breath)
      const cg = Math.min(1, theme.centerColor[1] + breath)
      const cb = Math.min(1, theme.centerColor[2] + breath)
      const er = Math.min(1, theme.edgeColor[0] + breath * 0.5)
      const eg = Math.min(1, theme.edgeColor[1] + breath * 0.5)
      const eb = Math.min(1, theme.edgeColor[2] + breath * 0.5)
      for (let i = 0; i < count; i++) {
        const t = dist[i]
        const i3 = i * 3
        col[i3] = cr + (er - cr) * t
        col[i3 + 1] = cg + (eg - cg) * t
        col[i3 + 2] = cb + (eb - cb) * t
      }
    }
    if (this.transitionColAttr) this.transitionColAttr.needsUpdate = true
  }

  public updateOpacity(now: number) {
    if (this.fadeIn.active) {
      const t = Math.min(1, (now - this.fadeIn.startTime) / this.fadeIn.duration)
      this.material.opacity = t
      if (t >= 1) this.fadeIn.active = false
    }

    if (this.particleTransition.active) {
      const t = Math.min(1, (now - this.particleTransition.startTime) / this.particleTransition.duration)
      if (this.transitionMaterial) {
        this.transitionMaterial.opacity = t
      }
      this.material.opacity = this.fadeIn.active
        ? Math.min(1, (now - this.fadeIn.startTime) / this.fadeIn.duration) * (1 - t)
        : (1 - t)

      if (t >= 1) {
        this.completeParticleTransition()
      }
    }
  }

  public startParticleTransition(newCount: number) {
    if (this.particleTransition.active) return
    if (newCount === this.count) return

    const now = performance.now()
    const theme = this.getInterpolatedTheme(now)

    this.generateSpiralGalaxy(
      newCount,
      this.transitionPositions,
      this.transitionVelocities,
      this.transitionDistances,
      this.transitionSizes
    )
    this.computeColors(newCount, this.transitionDistances, this.transitionColors, theme)

    this.transitionGeometry = new THREE.BufferGeometry()
    this.transitionPosAttr = new THREE.BufferAttribute(
      this.transitionPositions.subarray(0, newCount * 3), 3
    )
    this.transitionColAttr = new THREE.BufferAttribute(
      this.transitionColors.subarray(0, newCount * 3), 3
    )
    this.transitionPosAttr.setUsage(THREE.DynamicDrawUsage)
    this.transitionColAttr.setUsage(THREE.DynamicDrawUsage)
    this.transitionGeometry.setAttribute('position', this.transitionPosAttr)
    this.transitionGeometry.setAttribute('color', this.transitionColAttr)

    this.transitionMaterial = new THREE.PointsMaterial({
      size: 0.05,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    })

    this.transitionPoints = new THREE.Points(this.transitionGeometry, this.transitionMaterial)
    this.scene.add(this.transitionPoints)

    this.particleTransition = {
      active: true,
      startTime: now,
      duration: PARTICLE_TRANSITION_DURATION,
      oldCount: this.count,
      newCount: newCount
    }
  }

  private completeParticleTransition() {
    const newCount = this.particleTransition.newCount
    for (let i = 0; i < newCount * 3; i++) {
      this.positions[i] = this.transitionPositions[i]
      this.velocities[i] = this.transitionVelocities[i]
      this.colors[i] = this.transitionColors[i]
    }
    for (let i = 0; i < newCount; i++) {
      this.distances[i] = this.transitionDistances[i]
      this.sizes[i] = this.transitionSizes[i]
    }

    this.geometry.dispose()
    this.geometry = new THREE.BufferGeometry()
    this.posAttr = new THREE.BufferAttribute(this.positions.subarray(0, newCount * 3), 3)
    this.colAttr = new THREE.BufferAttribute(this.colors.subarray(0, newCount * 3), 3)
    this.posAttr.setUsage(THREE.DynamicDrawUsage)
    this.colAttr.setUsage(THREE.DynamicDrawUsage)
    this.geometry.setAttribute('position', this.posAttr)
    this.geometry.setAttribute('color', this.colAttr)
    this.points.geometry = this.geometry
    this.material.opacity = 1

    if (this.transitionPoints) {
      this.scene.remove(this.transitionPoints)
      this.transitionGeometry?.dispose()
      this.transitionMaterial?.dispose()
      this.transitionPoints = null
      this.transitionGeometry = null
      this.transitionMaterial = null
      this.transitionPosAttr = null
      this.transitionColAttr = null
    }

    this.count = newCount
    this.particleTransition.active = false
  }

  public startColorTransition(toIndex: number) {
    const now = performance.now()
    const fromTheme = this.colorTransition.active
      ? this.lerpTheme(
          this.colorTransition.fromTheme,
          this.colorTransition.toTheme,
          Math.min(1, (now - this.colorTransition.startTime) / this.colorTransition.duration)
        )
      : COLOR_THEMES[params.colorThemeIndex]

    if (fromTheme.name === COLOR_THEMES[toIndex].name && !this.colorTransition.active) return

    this.colorTransition = {
      active: true,
      startTime: now,
      duration: COLOR_TRANSITION_DURATION,
      fromTheme: fromTheme,
      toTheme: COLOR_THEMES[toIndex]
    }
    params.colorThemeIndex = toIndex
  }
}

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let clock: THREE.Clock
let particleSystem: ParticleSystem

const params: GalaxyParams = {
  particleCount: 3000,
  attractor1Strength: 0.5,
  attractor2Strength: 0.3,
  rotationSpeed: 0.5,
  moveSpeed: 1.0,
  paused: false,
  colorThemeIndex: 0
}

let fpsFrames = 0
let fpsLastTime = 0
let fpsMonitoring = false

function monitorFPS() {
  if (fpsMonitoring) return
  fpsMonitoring = true
  fpsFrames = 0
  fpsLastTime = performance.now()

  const measureTick = () => {
    if (!fpsMonitoring) return
    fpsFrames++
    requestAnimationFrame(measureTick)
  }
  measureTick()

  setTimeout(() => {
    const elapsed = (performance.now() - fpsLastTime) / 1000
    const fps = fpsFrames / elapsed
    console.log(`[FPS Monitor] 吸引子调整后帧率: ${fps.toFixed(1)}fps (目标≥55fps)`)
    if (fps < 55) console.warn(`[FPS Warning] 帧率低于55fps阈值!`)
    fpsMonitoring = false
  }, 1000)
}

function initScene() {
  const container = document.getElementById('canvas-container')
  if (!container) throw new Error('Canvas container not found')

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100)
  camera.position.set(0, 2, 8)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.appendChild(renderer.domElement)

  clock = new THREE.Clock()

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })
}

function initParticleSystem() {
  particleSystem = new ParticleSystem(
    scene,
    MAX_PARTICLES,
    params.particleCount,
    COLOR_THEMES[params.colorThemeIndex]
  )
}

function animate() {
  requestAnimationFrame(animate)

  const now = performance.now()
  const dt = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.getElapsedTime()

  const displayCount = particleSystem.particleTransition.active
    ? particleSystem.particleTransition.oldCount
    : particleSystem.count

  if (!params.paused) {
    particleSystem.updatePositions(
      displayCount,
      dt,
      params.moveSpeed,
      params.rotationSpeed,
      params.attractor1Strength,
      params.attractor2Strength
    )

    if (particleSystem.particleTransition.active && particleSystem.transitionPoints) {
      particleSystem.updateTransitionPositions(
        particleSystem.particleTransition.newCount,
        dt,
        params.moveSpeed,
        params.rotationSpeed,
        params.attractor1Strength,
        params.attractor2Strength
      )
    }
  }

  particleSystem.updateColors(displayCount, elapsed, now)

  if (particleSystem.particleTransition.active && particleSystem.transitionPoints) {
    particleSystem.updateTransitionColors(
      particleSystem.particleTransition.newCount,
      elapsed,
      now
    )
  }

  particleSystem.updateOpacity(now)

  const camAngle = elapsed * 0.08
  camera.position.x = Math.sin(camAngle) * 8
  camera.position.z = Math.cos(camAngle) * 8
  camera.lookAt(0, 0, 0)

  renderer.render(scene, camera)
}

const controls: GalaxyControls = {
  setParticleCount(count: number, uiStartTime: number) {
    const t0 = performance.now()
    particleSystem.startParticleTransition(count)
    const t1 = performance.now()
    const totalLatency = t1 - uiStartTime
    console.log(`[UI Perf] 粒子数量更新: UI响应=${(t0 - uiStartTime).toFixed(2)}ms, 总耗时=${totalLatency.toFixed(2)}ms`)
    if (totalLatency > 150) console.warn(`[Perf Warning] 粒子数量更新卡顿超过150ms!`)
  },

  setAttractor1Strength(strength: number, uiStartTime: number) {
    const t0 = performance.now()
    params.attractor1Strength = strength
    const t1 = performance.now()
    const totalLatency = t1 - uiStartTime
    console.log(`[UI Perf] 吸引子1强度更新: UI响应=${(t0 - uiStartTime).toFixed(2)}ms, 总耗时=${totalLatency.toFixed(2)}ms`)
    if (totalLatency > 150) console.warn(`[Perf Warning] 吸引子1调整卡顿超过150ms!`)
    if (totalLatency > 100) console.warn(`[UI Warning] UI响应超过100ms!`)
    monitorFPS()
  },

  setAttractor2Strength(strength: number, uiStartTime: number) {
    const t0 = performance.now()
    params.attractor2Strength = strength
    const t1 = performance.now()
    const totalLatency = t1 - uiStartTime
    console.log(`[UI Perf] 吸引子2强度更新: UI响应=${(t0 - uiStartTime).toFixed(2)}ms, 总耗时=${totalLatency.toFixed(2)}ms`)
    if (totalLatency > 150) console.warn(`[Perf Warning] 吸引子2调整卡顿超过150ms!`)
    if (totalLatency > 100) console.warn(`[UI Warning] UI响应超过100ms!`)
    monitorFPS()
  },

  setColorTheme(index: number, uiStartTime: number) {
    const t0 = performance.now()
    particleSystem.startColorTransition(index)
    const t1 = performance.now()
    const totalLatency = t1 - uiStartTime
    console.log(`[UI Perf] 颜色主题更新: UI响应=${(t0 - uiStartTime).toFixed(2)}ms, 总耗时=${totalLatency.toFixed(2)}ms`)
    if (totalLatency > 100) console.warn(`[UI Warning] UI响应超过100ms!`)
  },

  setMoveSpeed(speed: number, uiStartTime: number) {
    const t0 = performance.now()
    params.moveSpeed = speed
    const t1 = performance.now()
    const totalLatency = t1 - uiStartTime
    console.log(`[UI Perf] 速度更新: UI响应=${(t0 - uiStartTime).toFixed(2)}ms, 总耗时=${totalLatency.toFixed(2)}ms`)
    if (totalLatency > 100) console.warn(`[UI Warning] UI响应超过100ms!`)
  },

  togglePaused(uiStartTime: number): boolean {
    const t0 = performance.now()
    params.paused = !params.paused
    const t1 = performance.now()
    const totalLatency = t1 - uiStartTime
    console.log(`[UI Perf] 暂停切换: UI响应=${(t0 - uiStartTime).toFixed(2)}ms, 总耗时=${totalLatency.toFixed(2)}ms, 状态=${params.paused ? '已暂停' : '已恢复'}`)
    if (totalLatency > 100) console.warn(`[UI Warning] UI响应超过100ms!`)
    return params.paused
  },

  getParams() {
    return { ...params }
  }
}

function init() {
  initScene()
  initParticleSystem()
  buildControls(controls)
  animate()
}

init()
