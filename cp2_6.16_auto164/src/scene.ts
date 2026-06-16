import * as THREE from 'three'
import { v4 as uuidv4 } from 'uuid'
import {
  Microplastic,
  PlasticType,
  Region,
  PLASTIC_COLORS,
  REGIONS
} from './store'

const OCEAN_RADIUS = 10
const PARTICLE_COUNT = 1500
const MICROPLASTIC_COUNT = 2500

interface OceanScene {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  oceanSphere: THREE.Mesh
  currentParticles: Microplastic[]
  particleSystem: THREE.Points
  microplasticMesh: THREE.InstancedMesh
  ambientLight: THREE.AmbientLight
  directionalLight: THREE.DirectionalLight
  pointLight: THREE.PointLight
  highlightMesh: THREE.Mesh | null
  trajectoryLine: THREE.Line | null
  trajectoryPoints: THREE.Vector3[]
  selectedInstanceIndex: number
  raycaster: THREE.Raycaster
  mouse: THREE.Vector2
  animationId: number
  time: number
  currentRegion: Region
  currentDepth: number
  targetDepth: number
  depthTransitionProgress: number
  cameraTargetPos: THREE.Vector3
  cameraLookAt: THREE.Vector3
  onParticleClick: (particle: Microplastic) => void
  onParticleLongPress: (particle: Microplastic) => void
  onParticleRelease: () => void
  mouseDownTime: number
  mouseDownParticle: Microplastic | null
  longPressTriggered: boolean
  getFilteredCount: () => number
  getDensity: () => number
}

let sceneInstance: OceanScene | null = null
const dummy = new THREE.Object3D()

function gaussianRandom(mean: number, std: number): number {
  let u = 0, v = 0
  while (u === 0) u = Math.random()
  while (v === 0) v = Math.random()
  return mean + std * Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v)
}

function regionToSpherical(lat: number, lon: number, radius: number): THREE.Vector3 {
  const phi = (90 - lat) * (Math.PI / 180)
  const theta = (lon + 180) * (Math.PI / 180)
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  )
}

function generateOceanParticles(): Float32Array {
  const positions = new Float32Array(PARTICLE_COUNT * 3)
  const colors = new Float32Array(PARTICLE_COUNT * 3)
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    const depth = Math.random() * 5000
    const lat = (Math.random() - 0.5) * 180
    const lon = (Math.random() - 0.5) * 360
    const depthRatio = depth / 5000
    const r = OCEAN_RADIUS * (0.98 - depthRatio * 0.4)
    const noise = gaussianRandom(0, 0.02)
    const pos = regionToSpherical(lat, lon, r + noise)
    positions[i * 3] = pos.x
    positions[i * 3 + 1] = pos.y
    positions[i * 3 + 2] = pos.z
    const t = depthRatio
    const color = new THREE.Color('#7EC8E3').lerp(
      new THREE.Color('#1A3A5C'), t
    ).lerp(new THREE.Color('#5C1A1A'), t * 0.6)
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }
  return positions
}

function generateMicroplastics(region: Region): Microplastic[] {
  const center = REGIONS[region]
  const particles: Microplastic[] = []
  const types: PlasticType[] = ['fiber', 'fragment', 'film']
  for (let i = 0; i < MICROPLASTIC_COUNT; i++) {
    const type = types[Math.floor(Math.random() * types.length)]
    const depth = gaussianRandom(2500, 1500)
    const lat = gaussianRandom(center.center.lat, 15)
    const lon = gaussianRandom(center.center.lon, 30)
    const depthRatio = Math.max(0, Math.min(5000, depth))
    const r = OCEAN_RADIUS * (0.95 - (depthRatio / 5000) * 0.9)
    const pos = regionToSpherical(lat, lon, r)
    particles.push({
      id: uuidv4(),
      type,
      size: 0.08 + Math.random() * 0.12,
      depth: depthRatio,
      position: { x: pos.x, y: pos.y, z: pos.z },
      originDepth: depthRatio,
      velocity: {
        x: (Math.random() - 0.5) * 0.005,
        y: (Math.random() - 0.5) * 0.002,
        z: (Math.random() - 0.5) * 0.005
      }
    })
  }
  return particles
}

function createNoiseTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 512
  const ctx = canvas.getContext('2d')!
  const imageData = ctx.createImageData(512, 512)
  for (let i = 0; i < imageData.data.length; i += 4) {
    const v = Math.floor(Math.random() * 255)
    imageData.data[i] = v
    imageData.data[i + 1] = v
    imageData.data[i + 2] = v
    imageData.data[i + 3] = 255
  }
  ctx.putImageData(imageData, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.RepeatWrapping
  return texture
}

export function initScene(
  container: HTMLElement,
  callbacks: {
    onParticleClick: (p: Microplastic) => void
    onParticleLongPress: (p: Microplastic) => void
    onParticleRelease: () => void
  }
): OceanScene {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#0A1128')
  scene.fog = new THREE.FogExp2('#0A1128', 0.05)

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.set(0, 5, 20)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  container.appendChild(renderer.domElement)

  const oceanGeometry = new THREE.SphereGeometry(OCEAN_RADIUS, 64, 64)
  const noiseTexture = createNoiseTexture()
  const oceanMaterial = new THREE.MeshStandardMaterial({
    color: '#1A3A5C',
    transparent: true,
    opacity: 0.65,
    roughness: 0.8,
    metalness: 0.1,
    side: THREE.DoubleSide,
    bumpMap: noiseTexture,
    bumpScale: 0.2
  })
  const oceanSphere = new THREE.Mesh(oceanGeometry, oceanMaterial)
  scene.add(oceanSphere)

  const innerSphere = new THREE.Mesh(
    new THREE.SphereGeometry(OCEAN_RADIUS * 0.6, 32, 32),
    new THREE.MeshStandardMaterial({
      color: '#0A1128',
      transparent: true,
      opacity: 0.95
    })
  )
  scene.add(innerSphere)

  const particleGeom = new THREE.BufferGeometry()
  const positions = generateOceanParticles()
  particleGeom.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const particleColors = new Float32Array(PARTICLE_COUNT * 3)
  particleGeom.setAttribute('color', new THREE.BufferAttribute(particleColors, 3))
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particleColors[i * 3] = 0.5
    particleColors[i * 3 + 1] = 0.8
    particleColors[i * 3 + 2] = 1.0
  }
  const particleMat = new THREE.PointsMaterial({
    size: 0.08,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  })
  const particleSystem = new THREE.Points(particleGeom, particleMat)
  scene.add(particleSystem)

  const microGeom = new THREE.SphereGeometry(1, 8, 8)
  const microMat = new THREE.MeshStandardMaterial({
    color: '#ffffff'
  })
  const microplasticMesh = new THREE.InstancedMesh(
    microGeom,
    microMat,
    MICROPLASTIC_COUNT
  )
  microplasticMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
  scene.add(microplasticMesh)

  const ambientLight = new THREE.AmbientLight('#406080', 0.5)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight('#A8D0E6', 1.2)
  directionalLight.position.set(10, 20, 15)
  scene.add(directionalLight)

  const pointLight = new THREE.PointLight('#7EC8E3', 0.8, 50)
  pointLight.position.set(0, 10, 0)
  scene.add(pointLight)

  const starsGeometry = new THREE.BufferGeometry()
  const starPositions = new Float32Array(2000 * 3)
  for (let i = 0; i < 2000; i++) {
    starPositions[i * 3] = (Math.random() - 0.5) * 200
    starPositions[i * 3 + 1] = (Math.random() - 0.5) * 200
    starPositions[i * 3 + 2] = (Math.random() - 0.5) * 200
  }
  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  const starsMaterial = new THREE.PointsMaterial({
    color: '#ffffff',
    size: 0.15,
    transparent: true,
    opacity: 0.6
  })
  const stars = new THREE.Points(starsGeometry, starsMaterial)
  scene.add(stars)

  const currentParticles = generateMicroplastics('pacific')

  const sceneObj: OceanScene = {
    scene,
    camera,
    renderer,
    oceanSphere,
    currentParticles,
    particleSystem,
    microplasticMesh,
    ambientLight,
    directionalLight,
    pointLight,
    highlightMesh: null,
    trajectoryLine: null,
    trajectoryPoints: [],
    selectedInstanceIndex: -1,
    raycaster: new THREE.Raycaster(),
    mouse: new THREE.Vector2(),
    animationId: 0,
    time: 0,
    currentRegion: 'pacific',
    currentDepth: 0,
    targetDepth: 0,
    depthTransitionProgress: 1,
    cameraTargetPos: new THREE.Vector3(0, 5, 20),
    cameraLookAt: new THREE.Vector3(0, 0, 0),
    onParticleClick: callbacks.onParticleClick,
    onParticleLongPress: callbacks.onParticleLongPress,
    onParticleRelease: callbacks.onParticleRelease,
    mouseDownTime: 0,
    mouseDownParticle: null,
    longPressTriggered: false,
    getFilteredCount: () => 0,
    getDensity: () => 0
  }

  sceneObj.getFilteredCount = function() {
    const depthMin = this.currentDepth - 200
    const depthMax = this.currentDepth + 200
    return this.currentParticles.filter(p =>
      p.depth >= depthMin && p.depth <= depthMax
    ).length
  }

  sceneObj.getDensity = function() {
    const volume = (4 / 3) * Math.PI * Math.pow(OCEAN_RADIUS * 0.1, 3)
    return this.getFilteredCount() / volume
  }

  setupEventListeners(sceneObj, container)
  updateMicroplasticInstances(sceneObj)
  startAnimationLoop(sceneObj)

  sceneInstance = sceneObj
  return sceneObj
}

function setupEventListeners(scene: OceanScene, container: HTMLElement) {
  const onMouseMove = (event: MouseEvent) => {
    const rect = container.getBoundingClientRect()
    scene.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
    scene.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
  }

  const onMouseDown = (event: MouseEvent) => {
    scene.mouseDownTime = performance.now()
    scene.longPressTriggered = false
    const p = findClickedParticle(scene)
    scene.mouseDownParticle = p
  }

  const onMouseUp = () => {
    const elapsed = performance.now() - scene.mouseDownTime
    if (!scene.longPressTriggered) {
      if (elapsed < 500 && scene.mouseDownParticle) {
        scene.onParticleClick(scene.mouseDownParticle)
      } else {
        scene.onParticleRelease()
      }
    }
    scene.mouseDownParticle = null
  }

  container.addEventListener('mousemove', onMouseMove)
  container.addEventListener('mousedown', onMouseDown)
  container.addEventListener('mouseup', onMouseUp)
  container.addEventListener('mouseleave', onMouseUp)

  const onTouchStart = (event: TouchEvent) => {
    if (event.touches.length > 0) {
      const touch = event.touches[0]
      const rect = container.getBoundingClientRect()
      scene.mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1
      scene.mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1
      scene.mouseDownTime = performance.now()
      scene.longPressTriggered = false
      const p = findClickedParticle(scene)
      scene.mouseDownParticle = p
    }
  }

  const onTouchEnd = () => {
    const elapsed = performance.now() - scene.mouseDownTime
    if (!scene.longPressTriggered) {
      if (elapsed < 500 && scene.mouseDownParticle) {
        scene.onParticleClick(scene.mouseDownParticle)
      } else {
        scene.onParticleRelease()
      }
    }
    scene.mouseDownParticle = null
  }

  container.addEventListener('touchstart', onTouchStart, { passive: true })
  container.addEventListener('touchend', onTouchEnd)

  let isDragging = false
  let previousMouse = { x: 0, y: 0 }
  let spherical = new THREE.Spherical(20, Math.PI / 3, 0)

  const onDragStart = (e: MouseEvent) => {
    if (e.button === 0 || e.button === undefined) {
      isDragging = true
      previousMouse = { x: e.clientX, y: e.clientY }
    }
  }

  const onDragMove = (e: MouseEvent) => {
    if (isDragging) {
      const deltaX = e.clientX - previousMouse.x
      const deltaY = e.clientY - previousMouse.y
      spherical.theta -= deltaX * 0.005
      spherical.phi = Math.max(0.1, Math.min(Math.PI - 0.1,
        spherical.phi - deltaY * 0.005
      ))
      const pos = new THREE.Vector3().setFromSpherical(spherical)
      scene.cameraTargetPos.copy(pos)
      previousMouse = { x: e.clientX, y: e.clientY }
    }
  }

  const onDragEnd = () => {
    isDragging = false
  }

  container.addEventListener('mousedown', onDragStart)
  container.addEventListener('mousemove', onDragMove)
  container.addEventListener('mouseup', onDragEnd)

  const onWheel = (e: WheelEvent) => {
    e.preventDefault()
    spherical.radius = Math.max(12, Math.min(40, spherical.radius + e.deltaY * 0.01))
    const pos = new THREE.Vector3().setFromSpherical(spherical)
    scene.cameraTargetPos.copy(pos)
  }
  container.addEventListener('wheel', onWheel, { passive: false })

  const onResize = () => {
    scene.camera.aspect = window.innerWidth / window.innerHeight
    scene.camera.updateProjectionMatrix()
    scene.renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onResize)
}

function findClickedParticle(scene: OceanScene): Microplastic | null {
  scene.raycaster.setFromCamera(scene.mouse, scene.camera)
  const intersects = scene.raycaster.intersectObject(scene.microplasticMesh)
  if (intersects.length > 0) {
    const idx = intersects[0].instanceId
    if (idx !== undefined && idx >= 0 && idx < scene.currentParticles.length) {
      return scene.currentParticles[idx]
    }
  }
  return null
}

function updateMicroplasticInstances(scene: OceanScene) {
  const colors: Record<PlasticType, THREE.Color> = {
    fiber: new THREE.Color(PLASTIC_COLORS.fiber),
    fragment: new THREE.Color(PLASTIC_COLORS.fragment),
    film: new THREE.Color(PLASTIC_COLORS.film)
  }
  for (let i = 0; i < scene.currentParticles.length; i++) {
    const p = scene.currentParticles[i]
    dummy.position.set(p.position.x, p.position.y, p.position.z)
    dummy.scale.setScalar(p.size)
    dummy.updateMatrix()
    scene.microplasticMesh.setMatrixAt(i, dummy.matrix)
    scene.microplasticMesh.setColorAt(i, colors[p.type])
  }
  scene.microplasticMesh.instanceMatrix.needsUpdate = true
  if (scene.microplasticMesh.instanceColor) {
    scene.microplasticMesh.instanceColor.needsUpdate = true
  }
}

function startAnimationLoop(scene: OceanScene) {
  const animate = () => {
    scene.animationId = requestAnimationFrame(animate)
    scene.time += 0.016

    const positions = scene.particleSystem.geometry.attributes.position.array as Float32Array
    const colors = scene.particleSystem.geometry.attributes.color.array as Float32Array
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const idx = i * 3
      const x = positions[idx]
      const y = positions[idx + 1]
      const z = positions[idx + 2]
      const depth = (1 - Math.sqrt(x * x + y * y + z * z) / OCEAN_RADIUS) * 5000 / 0.5
      const speed = 0.02 + (depth / 5000) * 0.03
      const angle = scene.time * speed + i * 0.1
      const cx = x * Math.cos(angle * 0.01) - z * Math.sin(angle * 0.01)
      const cz = x * Math.sin(angle * 0.01) + z * Math.cos(angle * 0.01)
      positions[idx] = cx + Math.sin(scene.time * 0.5 + i) * 0.002
      positions[idx + 2] = cz + Math.cos(scene.time * 0.3 + i) * 0.002

      const depthRatio = Math.max(0, Math.min(1, depth / 5000))
      const dist = Math.abs(depth - scene.currentDepth) / 200
      const opacity = Math.max(0, 1 - dist)
      const t = depthRatio
      colors[idx] = (0.5 * (1 - t) + 0.9 * t * 0.4) * opacity
      colors[idx + 1] = (0.8 * (1 - t) + 0.2 * t) * opacity
      colors[idx + 2] = (1 * (1 - t) + 0.3 * t) * opacity
    }
    scene.particleSystem.geometry.attributes.position.needsUpdate = true
    scene.particleSystem.geometry.attributes.color.needsUpdate = true

    scene.currentDepth += (scene.targetDepth - scene.currentDepth) * 0.03

    for (let i = 0; i < scene.currentParticles.length; i++) {
      const p = scene.currentParticles[i]
      const dist = Math.abs(p.depth - scene.currentDepth)
      const visible = dist < 250 ? 1 : 0.01
      dummy.position.set(p.position.x, p.position.y, p.position.z)
      dummy.scale.setScalar(p.size * visible)
      dummy.updateMatrix()
      scene.microplasticMesh.setMatrixAt(i, dummy.matrix)
    }
    scene.microplasticMesh.instanceMatrix.needsUpdate = true

    const material = scene.oceanSphere.material as THREE.MeshStandardMaterial
    if (material.bumpMap) {
      material.bumpMap.offset.x = scene.time * 0.02
      material.bumpMap.offset.y = scene.time * 0.015
    }

    scene.camera.position.lerp(scene.cameraTargetPos, 0.03)
    scene.camera.lookAt(scene.cameraLookAt)

    if (scene.highlightMesh) {
      scene.highlightMesh.rotation.y += 0.02
      const scale = 1 + Math.sin(scene.time * 3) * 0.1
      scene.highlightMesh.scale.setScalar(scale)
    }

    scene.renderer.render(scene.scene, scene.camera)

    if (scene.mouseDownParticle && !scene.longPressTriggered) {
      const elapsed = performance.now() - scene.mouseDownTime
      if (elapsed >= 500) {
        scene.longPressTriggered = true
        scene.onParticleLongPress(scene.mouseDownParticle)
      }
    }
  }
  animate()
}

export function setRegion(scene: OceanScene, region: Region) {
  scene.currentRegion = region
  scene.currentParticles = generateMicroplastics(region)
  updateMicroplasticInstances(scene)
  const center = REGIONS[region]
  const pos = regionToSpherical(center.center.lat, center.center.lon, 20)
  scene.cameraTargetPos.copy(pos)
  scene.cameraLookAt.set(0, 0, 0)
}

export function setDepth(scene: OceanScene, depth: number) {
  scene.targetDepth = depth
}

export function highlightParticle(scene: OceanScene, particle: Microplastic | null) {
  if (scene.highlightMesh) {
    scene.scene.remove(scene.highlightMesh)
    scene.highlightMesh.geometry.dispose()
    ;(scene.highlightMesh.material as THREE.Material).dispose()
    scene.highlightMesh = null
  }
  if (particle) {
    const ringGeom = new THREE.RingGeometry(
      particle.size * 1.2,
      particle.size * 1.8,
      32
    )
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#ffffff',
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending
    })
    scene.highlightMesh = new THREE.Mesh(ringGeom, ringMat)
    scene.highlightMesh.position.set(
      particle.position.x,
      particle.position.y,
      particle.position.z
    )
    scene.scene.add(scene.highlightMesh)
  }
}

export function showTrajectory(
  scene: OceanScene,
  particle: Microplastic | null
) {
  if (scene.trajectoryLine) {
    scene.scene.remove(scene.trajectoryLine)
    scene.trajectoryLine.geometry.dispose()
    ;(scene.trajectoryLine.material as THREE.Material).dispose()
    scene.trajectoryLine = null
    scene.trajectoryPoints = []
  }
  if (particle) {
    scene.trajectoryPoints = []
    const start = new THREE.Vector3(
      particle.position.x,
      particle.position.y,
      particle.position.z
    )
    let current = start.clone()
    for (let i = 0; i < 100; i++) {
      scene.trajectoryPoints.push(current.clone())
      const dir = new THREE.Vector3(
        -particle.velocity.x * 50,
        -particle.velocity.y * 50,
        -particle.velocity.z * 50
      )
      current.add(dir)
      current.normalize().multiplyScalar(current.length() * 0.995)
    }
    const geometry = new THREE.BufferGeometry().setFromPoints(
      scene.trajectoryPoints
    )
    const material = new THREE.LineBasicMaterial({
      color: PLASTIC_COLORS[particle.type],
      transparent: true,
      opacity: 0.3,
      linewidth: 2
    })
    scene.trajectoryLine = new THREE.Line(geometry, material)
    scene.scene.add(scene.trajectoryLine)
  }
}

export function disposeScene(scene: OceanScene) {
  cancelAnimationFrame(scene.animationId)
  scene.renderer.dispose()
  scene.renderer.domElement.remove()
}

export { updateMicroplasticInstances }
