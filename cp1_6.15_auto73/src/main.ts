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
const ATTRACTOR1 = new THREE.Vector3(2, 1, 0)
const ATTRACTOR2 = new THREE.Vector3(-2, -1, 0)

let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let clock: THREE.Clock

let currentPoints: THREE.Points | null = null
let transitioningPoints: THREE.Points | null = null

let positionsArr: Float32Array
let velocitiesArr: Float32Array
let colorsArr: Float32Array
let sizesArr: Float32Array
let distancesArr: Float32Array
let alphasArr: Float32Array

let transitionPositionsArr: Float32Array
let transitionVelocitiesArr: Float32Array
let transitionColorsArr: Float32Array
let transitionSizesArr: Float32Array
let transitionDistancesArr: Float32Array
let transitionAlphasArr: Float32Array

const params: GalaxyParams = {
  particleCount: 3000,
  attractor1Strength: 0.5,
  attractor2Strength: 0.3,
  rotationSpeed: 0.5,
  moveSpeed: 1.0,
  paused: false,
  colorThemeIndex: 0
}

let particleTransition: ParticleTransitionState = {
  active: false,
  startTime: 0,
  duration: PARTICLE_TRANSITION_DURATION,
  oldCount: 0,
  newCount: 0
}

let colorTransition: ColorTransitionState = {
  active: false,
  startTime: 0,
  duration: COLOR_TRANSITION_DURATION,
  fromTheme: COLOR_THEMES[0],
  toTheme: COLOR_THEMES[0]
}

let fadeIn: FadeInState = {
  active: true,
  startTime: 0,
  duration: FADE_IN_DURATION
}

function allocateBuffers(max: number) {
  positionsArr = new Float32Array(max * 3)
  velocitiesArr = new Float32Array(max * 3)
  colorsArr = new Float32Array(max * 3)
  sizesArr = new Float32Array(max)
  distancesArr = new Float32Array(max)
  alphasArr = new Float32Array(max)

  transitionPositionsArr = new Float32Array(max * 3)
  transitionVelocitiesArr = new Float32Array(max * 3)
  transitionColorsArr = new Float32Array(max * 3)
  transitionSizesArr = new Float32Array(max)
  transitionDistancesArr = new Float32Array(max)
  transitionAlphasArr = new Float32Array(max)
}

function generateSpiralGalaxy(
  count: number,
  posArr: Float32Array,
  velArr: Float32Array,
  distArr: Float32Array,
  sizeArr: Float32Array,
  alphaArr: Float32Array
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
    posArr[i3] = x
    posArr[i3 + 1] = y
    posArr[i3 + 2] = z

    velArr[i3] = 0
    velArr[i3 + 1] = 0
    velArr[i3 + 2] = 0

    distArr[i] = radius / 5.0
    sizeArr[i] = 0.045 - distArr[i] * 0.02
    alphaArr[i] = 1.0
  }
}

function computeParticleColors(
  count: number,
  distArr: Float32Array,
  colArr: Float32Array,
  theme: ColorTheme
) {
  const cr = theme.centerColor[0]
  const cg = theme.centerColor[1]
  const cb = theme.centerColor[2]
  const er = theme.edgeColor[0]
  const eg = theme.edgeColor[1]
  const eb = theme.edgeColor[2]

  for (let i = 0; i < count; i++) {
    const t = distArr[i]
    const i3 = i * 3
    colArr[i3] = cr + (er - cr) * t
    colArr[i3 + 1] = cg + (eg - cg) * t
    colArr[i3 + 2] = cb + (eb - cb) * t
  }
}

function interpolateColorThemes(
  count: number,
  distArr: Float32Array,
  colArr: Float32Array,
  from: ColorTheme,
  to: ColorTheme,
  t: number
) {
  const cr = from.centerColor[0] + (to.centerColor[0] - from.centerColor[0]) * t
  const cg = from.centerColor[1] + (to.centerColor[1] - from.centerColor[1]) * t
  const cb = from.centerColor[2] + (to.centerColor[2] - from.centerColor[2]) * t
  const er = from.edgeColor[0] + (to.edgeColor[0] - from.edgeColor[0]) * t
  const eg = from.edgeColor[1] + (to.edgeColor[1] - from.edgeColor[1]) * t
  const eb = from.edgeColor[2] + (to.edgeColor[2] - from.edgeColor[2]) * t

  for (let i = 0; i < count; i++) {
    const d = distArr[i]
    const i3 = i * 3
    colArr[i3] = cr + (er - cr) * d
    colArr[i3 + 1] = cg + (eg - cg) * d
    colArr[i3 + 2] = cb + (eb - cb) * d
  }
}

function createPointsObject(
  count: number,
  posArr: Float32Array,
  colArr: Float32Array,
  sizeArr: Float32Array,
  opacity: number
): THREE.Points {
  const geometry = new THREE.BufferGeometry()
  const posAttr = new THREE.BufferAttribute(new Float32Array(posArr.buffer, 0, count * 3), 3)
  const colAttr = new THREE.BufferAttribute(new Float32Array(colArr.buffer, 0, count * 3), 3)
  posAttr.setUsage(THREE.DynamicDrawUsage)
  colAttr.setUsage(THREE.DynamicDrawUsage)
  geometry.setAttribute('position', posAttr)
  geometry.setAttribute('color', colAttr)

  const material = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    transparent: true,
    opacity: opacity,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true
  })

  const points = new THREE.Points(geometry, material)
  points.userData.count = count
  return points
}

function initScene() {
  const container = document.getElementById('canvas-container')
  if (!container) throw new Error('Canvas container not found')

  scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )
  camera.position.set(0, 2, 8)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(window.innerWidth, window.innerHeight)
  container.appendChild(renderer.domElement)

  clock = new THREE.Clock()

  window.addEventListener('resize', onResize)
}

function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
}

function initParticleSystem() {
  allocateBuffers(MAX_PARTICLES)
  generateSpiralGalaxy(
    params.particleCount,
    positionsArr,
    velocitiesArr,
    distancesArr,
    sizesArr,
    alphasArr
  )
  computeParticleColors(
    params.particleCount,
    distancesArr,
    colorsArr,
    COLOR_THEMES[params.colorThemeIndex]
  )
  currentPoints = createPointsObject(
    params.particleCount,
    positionsArr,
    colorsArr,
    sizesArr,
    0
  )
  scene.add(currentPoints)
  fadeIn.startTime = performance.now()
}

function updateParticlePositions(
  count: number,
  posArr: Float32Array,
  velArr: Float32Array,
  dt: number,
  speed: number,
  rotSpeed: number,
  a1s: number,
  a2s: number
) {
  const a1x = ATTRACTOR1.x
  const a1y = ATTRACTOR1.y
  const a1z = ATTRACTOR1.z
  const a2x = ATTRACTOR2.x
  const a2y = ATTRACTOR2.y
  const a2z = ATTRACTOR2.z
  const step = dt * speed
  const rot = rotSpeed * dt
  const cosR = Math.cos(rot)
  const sinR = Math.sin(rot)

  for (let i = 0; i < count; i++) {
    const i3 = i * 3
    let px = posArr[i3]
    let py = posArr[i3 + 1]
    let pz = posArr[i3 + 2]
    let vx = velArr[i3]
    let vy = velArr[i3 + 1]
    let vz = velArr[i3 + 2]

    let dx1 = a1x - px
    let dy1 = a1y - py
    let dz1 = a1z - pz
    let d1Sq = dx1 * dx1 + dy1 * dy1 + dz1 * dz1
    let d1 = Math.sqrt(d1Sq) + 0.01
    let f1 = a1s / (d1Sq + 0.1)

    let dx2 = a2x - px
    let dy2 = a2y - py
    let dz2 = a2z - pz
    let d2Sq = dx2 * dx2 + dy2 * dy2 + dz2 * dz2
    let d2 = Math.sqrt(d2Sq) + 0.01
    let f2 = a2s / (d2Sq + 0.1)

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
    px = nx
    pz = nz

    posArr[i3] = px
    posArr[i3 + 1] = py
    posArr[i3 + 2] = pz
    velArr[i3] = vx
    velArr[i3 + 1] = vy
    velArr[i3 + 2] = vz
  }
}

function updateBreathColors(
  count: number,
  distArr: Float32Array,
  colArr: Float32Array,
  elapsed: number,
  theme: ColorTheme
) {
  const breath = 0.08 * Math.sin(elapsed * 1.5)
  const cr = Math.min(1, theme.centerColor[0] + breath)
  const cg = Math.min(1, theme.centerColor[1] + breath)
  const cb = Math.min(1, theme.centerColor[2] + breath)
  const er = Math.min(1, theme.edgeColor[0] + breath * 0.5)
  const eg = Math.min(1, theme.edgeColor[1] + breath * 0.5)
  const eb = Math.min(1, theme.edgeColor[2] + breath * 0.5)

  for (let i = 0; i < count; i++) {
    const t = distArr[i]
    const i3 = i * 3
    colArr[i3] = cr + (er - cr) * t
    colArr[i3 + 1] = cg + (eg - cg) * t
    colArr[i3 + 2] = cb + (eb - cb) * t
  }
}

function syncBufferToGeometry(points: THREE.Points, count: number) {
  const geo = points.geometry
  const posAttr = geo.getAttribute('position') as THREE.BufferAttribute
  const colAttr = geo.getAttribute('color') as THREE.BufferAttribute
  posAttr.needsUpdate = true
  colAttr.needsUpdate = true
  points.userData.count = count
}

function beginParticleTransition(newCount: number) {
  if (particleTransition.active) return
  if (newCount === params.particleCount) return

  generateSpiralGalaxy(
    newCount,
    transitionPositionsArr,
    transitionVelocitiesArr,
    transitionDistancesArr,
    transitionSizesArr,
    transitionAlphasArr
  )

  const theme = colorTransition.active
    ? lerpTheme(colorTransition.fromTheme, colorTransition.toTheme,
        Math.min(1, (performance.now() - colorTransition.startTime) / colorTransition.duration))
    : COLOR_THEMES[params.colorThemeIndex]

  computeParticleColors(newCount, transitionDistancesArr, transitionColorsArr, theme)

  transitioningPoints = createPointsObject(
    newCount,
    transitionPositionsArr,
    transitionColorsArr,
    transitionSizesArr,
    0
  )
  scene.add(transitioningPoints)

  particleTransition = {
    active: true,
    startTime: performance.now(),
    duration: PARTICLE_TRANSITION_DURATION,
    oldCount: params.particleCount,
    newCount: newCount
  }
}

function lerpTheme(a: ColorTheme, b: ColorTheme, t: number): ColorTheme {
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

function beginColorTransition(toIndex: number) {
  if (toIndex === params.colorThemeIndex && !colorTransition.active) return
  const now = performance.now()

  const fromTheme = colorTransition.active
    ? lerpTheme(colorTransition.fromTheme, colorTransition.toTheme,
        Math.min(1, (now - colorTransition.startTime) / colorTransition.duration))
    : COLOR_THEMES[params.colorThemeIndex]

  colorTransition = {
    active: true,
    startTime: now,
    duration: COLOR_TRANSITION_DURATION,
    fromTheme: fromTheme,
    toTheme: COLOR_THEMES[toIndex]
  }
  params.colorThemeIndex = toIndex
}

function animate() {
  requestAnimationFrame(animate)

  const now = performance.now()
  const dt = Math.min(clock.getDelta(), 0.05)
  const elapsed = clock.getElapsedTime()

  if (fadeIn.active) {
    const t = Math.min(1, (now - fadeIn.startTime) / fadeIn.duration)
    if (currentPoints) {
      (currentPoints.material as THREE.PointsMaterial).opacity = t
    }
    if (t >= 1) fadeIn.active = false
  }

  let activeTheme = COLOR_THEMES[params.colorThemeIndex]
  if (colorTransition.active) {
    const t = Math.min(1, (now - colorTransition.startTime) / colorTransition.duration)
    activeTheme = lerpTheme(colorTransition.fromTheme, colorTransition.toTheme, t)
    if (t >= 1) {
      colorTransition.active = false
      params.colorThemeIndex = COLOR_THEMES.findIndex(th => th.name === colorTransition.toTheme.name)
    }
  }

  if (!params.paused && currentPoints) {
    updateParticlePositions(
      particleTransition.active ? particleTransition.oldCount : params.particleCount,
      positionsArr,
      velocitiesArr,
      dt,
      params.moveSpeed,
      params.rotationSpeed,
      params.attractor1Strength,
      params.attractor2Strength
    )
    const posAttr = currentPoints.geometry.getAttribute('position') as THREE.BufferAttribute
    const arr = posAttr.array as Float32Array
    const cnt = particleTransition.active ? particleTransition.oldCount : params.particleCount
    for (let i = 0; i < cnt * 3; i++) arr[i] = positionsArr[i]
    posAttr.needsUpdate = true
  }

  if (transitioningPoints && particleTransition.active) {
    if (!params.paused) {
      updateParticlePositions(
        particleTransition.newCount,
        transitionPositionsArr,
        transitionVelocitiesArr,
        dt,
        params.moveSpeed,
        params.rotationSpeed,
        params.attractor1Strength,
        params.attractor2Strength
      )
      const posAttr = transitioningPoints.geometry.getAttribute('position') as THREE.BufferAttribute
      const arr = posAttr.array as Float32Array
      for (let i = 0; i < particleTransition.newCount * 3; i++) arr[i] = transitionPositionsArr[i]
      posAttr.needsUpdate = true
    }

    const t = Math.min(1, (now - particleTransition.startTime) / particleTransition.duration)
    ;(transitioningPoints.material as THREE.PointsMaterial).opacity = t
    if (currentPoints) {
      (currentPoints.material as THREE.PointsMaterial).opacity = fadeIn.active
        ? Math.min(1, (now - fadeIn.startTime) / fadeIn.duration) * (1 - t)
        : (1 - t)
    }

    if (colorTransition.active || true) {
      const theme = colorTransition.active
        ? lerpTheme(colorTransition.fromTheme, colorTransition.toTheme,
            Math.min(1, (now - colorTransition.startTime) / colorTransition.duration))
        : activeTheme
      interpolateColorThemes(
        particleTransition.newCount,
        transitionDistancesArr,
        transitionColorsArr,
        theme, theme, 0
      )
      updateBreathColors(
        particleTransition.newCount,
        transitionDistancesArr,
        transitionColorsArr,
        elapsed,
        theme
      )
      const colAttr = transitioningPoints.geometry.getAttribute('color') as THREE.BufferAttribute
      const carr = colAttr.array as Float32Array
      for (let i = 0; i < particleTransition.newCount * 3; i++) carr[i] = transitionColorsArr[i]
      colAttr.needsUpdate = true
    }

    if (t >= 1) finishParticleTransition()
  }

  if (currentPoints) {
    const cnt = particleTransition.active ? particleTransition.oldCount : params.particleCount
    updateBreathColors(cnt, distancesArr, colorsArr, elapsed, activeTheme)
    if (colorTransition.active && !particleTransition.active) {
      const ct = Math.min(1, (now - colorTransition.startTime) / colorTransition.duration)
      interpolateColorThemes(
        cnt, distancesArr, colorsArr,
        colorTransition.fromTheme, colorTransition.toTheme, ct
      )
      const breath = 0.08 * Math.sin(elapsed * 1.5)
      for (let i = 0; i < cnt; i++) {
        const d = distancesArr[i]
        const i3 = i * 3
        colorsArr[i3] = Math.min(1, colorsArr[i3] + breath * (1 - d * 0.5))
        colorsArr[i3 + 1] = Math.min(1, colorsArr[i3 + 1] + breath * (1 - d * 0.5))
        colorsArr[i3 + 2] = Math.min(1, colorsArr[i3 + 2] + breath * (1 - d * 0.5))
      }
    }
    const colAttr = currentPoints.geometry.getAttribute('color') as THREE.BufferAttribute
    const carr = colAttr.array as Float32Array
    for (let i = 0; i < cnt * 3; i++) carr[i] = colorsArr[i]
    colAttr.needsUpdate = true
  }

  const camAngle = elapsed * 0.08
  camera.position.x = Math.sin(camAngle) * 8
  camera.position.z = Math.cos(camAngle) * 8
  camera.lookAt(0, 0, 0)

  renderer.render(scene, camera)
}

function finishParticleTransition() {
  if (!particleTransition.active) return

  const newCount = particleTransition.newCount
  for (let i = 0; i < newCount * 3; i++) {
    positionsArr[i] = transitionPositionsArr[i]
    velocitiesArr[i] = transitionVelocitiesArr[i]
    colorsArr[i] = transitionColorsArr[i]
  }
  for (let i = 0; i < newCount; i++) {
    distancesArr[i] = transitionDistancesArr[i]
    sizesArr[i] = transitionSizesArr[i]
    alphasArr[i] = transitionAlphasArr[i]
  }

  if (transitioningPoints) {
    scene.remove(transitioningPoints)
    transitioningPoints.geometry.dispose()
    ;(transitioningPoints.material as THREE.Material).dispose()
    transitioningPoints = null
  }

  if (currentPoints) {
    scene.remove(currentPoints)
    currentPoints.geometry.dispose()
    ;(currentPoints.material as THREE.Material).dispose()
  }

  params.particleCount = newCount
  currentPoints = createPointsObject(newCount, positionsArr, colorsArr, sizesArr, 1)
  scene.add(currentPoints)

  particleTransition.active = false
}

const controls: GalaxyControls = {
  setParticleCount(count: number, uiStartTime: number) {
    beginParticleTransition(count)
    const done = performance.now()
    console.log(`[UI Perf] 粒子数量更新耗时: ${(done - uiStartTime).toFixed(2)}ms`)
  },
  setAttractor1Strength(strength: number, uiStartTime: number) {
    params.attractor1Strength = strength
    const done = performance.now()
    console.log(`[UI Perf] 吸引子1强度更新耗时: ${(done - uiStartTime).toFixed(2)}ms`)
    monitorFPS()
  },
  setAttractor2Strength(strength: number, uiStartTime: number) {
    params.attractor2Strength = strength
    const done = performance.now()
    console.log(`[UI Perf] 吸引子2强度更新耗时: ${(done - uiStartTime).toFixed(2)}ms`)
    monitorFPS()
  },
  setColorTheme(index: number, uiStartTime: number) {
    beginColorTransition(index)
    const done = performance.now()
    console.log(`[UI Perf] 颜色主题更新耗时: ${(done - uiStartTime).toFixed(2)}ms`)
  },
  setMoveSpeed(speed: number, uiStartTime: number) {
    params.moveSpeed = speed
    const done = performance.now()
    console.log(`[UI Perf] 速度更新耗时: ${(done - uiStartTime).toFixed(2)}ms`)
  },
  togglePaused(uiStartTime: number): boolean {
    params.paused = !params.paused
    const done = performance.now()
    console.log(`[UI Perf] 暂停切换耗时: ${(done - uiStartTime).toFixed(2)}ms`)
    return params.paused
  },
  getParams() {
    return { ...params }
  }
}

let fpsFrames = 0
let fpsLastTime = 0
let fpsMonitoring = false
function monitorFPS() {
  if (fpsMonitoring) return
  fpsMonitoring = true
  fpsFrames = 0
  fpsLastTime = performance.now()
  setTimeout(() => {
    const elapsed = (performance.now() - fpsLastTime) / 1000
    const fps = fpsFrames / elapsed
    console.log(`[FPS Monitor] 吸引子调整后帧率: ${fps.toFixed(1)}fps (目标≥55fps)`)
    if (fps < 55) console.warn(`[FPS Warning] 帧率低于55fps阈值!`)
    fpsMonitoring = false
  }, 1000)
  const tick = () => {
    if (!fpsMonitoring) return
    fpsFrames++
    requestAnimationFrame(tick)
  }
  tick()
}

function init() {
  initScene()
  initParticleSystem()
  buildControls(controls)
  animate()
}

init()
