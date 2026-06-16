import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import type { Lens } from '../../types/optical'

interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  lensMeshes: Map<string, THREE.Group>
  lightSourceMeshes: Map<string, THREE.Mesh>
  opticalAxis: THREE.Line | null
  gridHelper: THREE.GridHelper | null
  animationId: number | null
}

const LENS_COLOR = 0x87CEEB
const LIGHT_SOURCE_COLOR = 0xFFD700
const EDGE_COLOR = 0xffffff
const APERTURE_SEGMENTS = 64

export function setupScene(containerRef: React.RefObject<HTMLDivElement>): SceneContext | null {
  if (!containerRef.current) return null

  const container = containerRef.current
  const width = container.clientWidth
  const height = container.clientHeight

  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x1a1a2e)

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000)
  camera.position.set(0, 60, 180)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(width, height)
  renderer.setPixelRatio(window.devicePixelRatio)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.target.set(0, 0, 0)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4)
  scene.add(ambientLight)

  const pointLight1 = new THREE.PointLight(0xffffff, 1.2, 500)
  pointLight1.position.set(100, 100, 100)
  scene.add(pointLight1)

  const pointLight2 = new THREE.PointLight(0xffffff, 0.8, 500)
  pointLight2.position.set(-80, 60, -60)
  scene.add(pointLight2)

  const ctx: SceneContext = {
    scene,
    camera,
    renderer,
    controls,
    lensMeshes: new Map(),
    lightSourceMeshes: new Map(),
    opticalAxis: null,
    gridHelper: null,
    animationId: null
  }

  addOpticalAxis(ctx)
  startAnimationLoop(ctx)

  const handleResize = () => {
    if (!containerRef.current) return
    const w = containerRef.current.clientWidth
    const h = containerRef.current.clientHeight
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h)
  }
  window.addEventListener('resize', handleResize)

  return ctx
}

export function disposeScene(ctx: SceneContext) {
  if (ctx.animationId !== null) {
    cancelAnimationFrame(ctx.animationId)
  }
  window.removeEventListener('resize', () => {})
  ctx.lensMeshes.forEach((group) => disposeGroup(group))
  ctx.lightSourceMeshes.forEach((mesh) => disposeMesh(mesh))
  ctx.controls.dispose()
  ctx.renderer.dispose()
  if (ctx.renderer.domElement.parentNode) {
    ctx.renderer.domElement.parentNode.removeChild(ctx.renderer.domElement)
  }
}

function startAnimationLoop(ctx: SceneContext) {
  const animate = () => {
    ctx.animationId = requestAnimationFrame(animate)
    ctx.controls.update()
    ctx.renderer.render(ctx.scene, ctx.camera)
  }
  animate()
}

function disposeGroup(group: THREE.Group) {
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      disposeMesh(child)
    }
  })
}

function disposeMesh(mesh: THREE.Mesh) {
  mesh.geometry.dispose()
  if (Array.isArray(mesh.material)) {
    mesh.material.forEach((m) => m.dispose())
  } else {
    mesh.material.dispose()
  }
}

export function addOpticalAxis(ctx: SceneContext) {
  const axisPoints = [
    new THREE.Vector3(0, 0, -200),
    new THREE.Vector3(0, 0, 400)
  ]
  const axisGeometry = new THREE.BufferGeometry().setFromPoints(axisPoints)
  const axisMaterial = new THREE.LineDashedMaterial({
    color: 0x4a9eff,
    dashSize: 5,
    gapSize: 3,
    linewidth: 1
  })
  const axisLine = new THREE.Line(axisGeometry, axisMaterial)
  axisLine.computeLineDistances()
  ctx.scene.add(axisLine)
  ctx.opticalAxis = axisLine

  const gridHelper = new THREE.GridHelper(400, 40, 0x333355, 0x222244)
  gridHelper.rotation.x = Math.PI / 2
  gridHelper.position.y = 0
  ctx.scene.add(gridHelper)
  ctx.gridHelper = gridHelper
}

export function addLightSourceMesh(ctx: SceneContext, position: THREE.Vector3, id: string = 'default') {
  const existing = ctx.lightSourceMeshes.get(id)
  if (existing) {
    disposeMesh(existing)
    ctx.scene.remove(existing)
  }

  const geometry = new THREE.SphereGeometry(2.5, 32, 32)
  const material = new THREE.MeshStandardMaterial({
    color: LIGHT_SOURCE_COLOR,
    emissive: LIGHT_SOURCE_COLOR,
    emissiveIntensity: 0.8,
    metalness: 0.2,
    roughness: 0.3
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(position)
  ctx.scene.add(mesh)
  ctx.lightSourceMeshes.set(id, mesh)
  return mesh
}

export function createLensMesh(lens: Lens, ctx: SceneContext): THREE.Group {
  const existing = ctx.lensMeshes.get(lens.id)
  if (existing) {
    disposeGroup(existing)
    ctx.scene.remove(existing)
  }

  const group = new THREE.Group()

  if (lens.type === 'doublet') {
    buildDoubletLens(lens, group)
  } else {
    buildSimpleLens(lens, group)
  }

  group.position.z = lens.positionZ
  ctx.scene.add(group)
  ctx.lensMeshes.set(lens.id, group)
  return group
}

function getCurvatureRadius(surface: { curvatureRadius?: number; radius?: number }): number {
  return surface.curvatureRadius ?? surface.radius ?? 50
}

function buildSimpleLens(lens: Lens, group: THREE.Group) {
  const aperture = lens.aperture
  const surfaces = lens.surfaces
  const front = surfaces[0]
  const back = surfaces[surfaces.length - 1]
  if (!front || !back) return
  const thickness = surfaces.slice(0, -1).reduce((sum, s) => sum + s.thickness, 0)

  const lensMaterial = createLensMaterial()
  const edgeMaterial = createEdgeMaterial()

  const profile = generateLensProfile(
    getCurvatureRadius(front),
    getCurvatureRadius(back),
    thickness,
    aperture
  )

  const geometry = new THREE.LatheGeometry(profile, APERTURE_SEGMENTS)
  const mesh = new THREE.Mesh(geometry, lensMaterial)
  group.add(mesh)

  const edges = new THREE.EdgesGeometry(geometry, 15)
  const edgeLine = new THREE.LineSegments(edges, edgeMaterial)
  group.add(edgeLine)
}

function buildDoubletLens(lens: Lens, group: THREE.Group) {
  const aperture = lens.aperture
  const s1 = lens.surfaces[0]
  const s2 = lens.surfaces[1]
  const s3 = lens.surfaces[2]
  if (!s1 || !s2 || !s3) return

  const t1 = s1.thickness
  const t2 = s2.thickness

  const lensMaterial1 = createLensMaterial(0.58)
  const lensMaterial2 = createLensMaterial(0.62)
  const edgeMaterial = createEdgeMaterial()

  const profile1 = generateLensProfile(
    getCurvatureRadius(s1),
    getCurvatureRadius(s2),
    t1,
    aperture
  )
  const geo1 = new THREE.LatheGeometry(profile1, APERTURE_SEGMENTS)
  const mesh1 = new THREE.Mesh(geo1, lensMaterial1)
  group.add(mesh1)

  const edges1 = new THREE.EdgesGeometry(geo1, 15)
  const edgeLine1 = new THREE.LineSegments(edges1, edgeMaterial)
  group.add(edgeLine1)

  const profile2 = generateLensProfile(
    getCurvatureRadius(s2),
    getCurvatureRadius(s3),
    t2,
    aperture
  )
  const geo2 = new THREE.LatheGeometry(profile2, APERTURE_SEGMENTS)
  const mesh2 = new THREE.Mesh(geo2, lensMaterial2)
  mesh2.position.z = t1
  group.add(mesh2)

  const edges2 = new THREE.EdgesGeometry(geo2, 15)
  const edgeLine2 = new THREE.LineSegments(edges2, edgeMaterial)
  edgeLine2.position.z = t1
  group.add(edgeLine2)
}

function generateLensProfile(
  r1: number,
  r2: number,
  thickness: number,
  aperture: number
): THREE.Vector2[] {
  const points: THREE.Vector2[] = []
  const yMax = aperture / 2
  const steps = 32
  const sagScale = 0.8

  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const y = yMax * (1 - t)
    const sag1 = calculateSag(r1, y) * sagScale
    points.push(new THREE.Vector2(sag1, y))
  }

  for (let i = steps; i >= 0; i--) {
    const t = i / steps
    const y = yMax * (1 - t)
    const sag2 = calculateSag(r2, y) * sagScale
    points.push(new THREE.Vector2(thickness - sag2, y))
  }

  return points
}

function calculateSag(radius: number, y: number): number {
  if (Math.abs(radius) < 0.001) return 0
  const r2 = radius * radius
  const y2 = y * y
  if (y2 >= r2) return 0
  return Math.abs(radius) - Math.sign(radius) * Math.sqrt(r2 - y2)
}

function createLensMaterial(opacity: number = 0.6): THREE.MeshPhysicalMaterial {
  return new THREE.MeshPhysicalMaterial({
    color: LENS_COLOR,
    transparent: true,
    opacity,
    transmission: 0.7,
    roughness: 0.05,
    metalness: 0.0,
    thickness: 2,
    ior: 1.5,
    side: THREE.DoubleSide
  })
}

function createEdgeMaterial(): THREE.LineBasicMaterial {
  return new THREE.LineBasicMaterial({
    color: EDGE_COLOR,
    transparent: true,
    opacity: 0.8
  })
}

export function updateLensMeshes(lenses: Lens[], ctx: SceneContext) {
  const validIds = new Set(lenses.map((l) => l.id))

  ctx.lensMeshes.forEach((group, id) => {
    if (!validIds.has(id)) {
      disposeGroup(group)
      ctx.scene.remove(group)
      ctx.lensMeshes.delete(id)
    }
  })

  lenses.forEach((lens) => {
    const existing = ctx.lensMeshes.get(lens.id)
    if (existing) {
      disposeGroup(existing)
      ctx.scene.remove(existing)
      ctx.lensMeshes.delete(lens.id)
    }
    createLensMesh(lens, ctx)
  })
}

export function autoFocusCamera(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  lenses: Lens[]
) {
  if (lenses.length === 0) {
    controls.target.set(0, 0, 50)
    camera.position.set(0, 60, 180)
    controls.update()
    return
  }

  let minZ = Infinity
  let maxZ = -Infinity
  let maxAperture = 0

  lenses.forEach((lens) => {
    const totalThickness = lens.surfaces.reduce((sum, s) => sum + s.thickness, 0)
    minZ = Math.min(minZ, lens.positionZ)
    maxZ = Math.max(maxZ, lens.positionZ + totalThickness)
    maxAperture = Math.max(maxAperture, lens.aperture)
  })

  const centerZ = (minZ + maxZ) / 2
  const spanZ = Math.max(maxZ - minZ, 50)
  const spanY = Math.max(maxAperture * 2, 60)

  controls.target.set(0, 0, centerZ)

  const distance = Math.max(spanZ * 1.5, spanY * 2.5, 100)
  const cameraY = spanY * 1.2

  camera.position.set(0, cameraY, centerZ + distance)
  controls.update()
}
