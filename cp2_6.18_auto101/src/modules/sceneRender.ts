import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { Pipe, CollisionPair, usePipeStore } from '../store/pipeStore'
import { getPipeTypeColor, getPipeTypeName, getPipeTypeAbbr } from './pipeData'

interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  raycaster: THREE.Raycaster
  mouse: THREE.Vector2
}

const pipeMeshes: Map<string, THREE.Mesh> = new Map()
const collisionMarkers: THREE.Mesh[] = []
let sceneContext: SceneContext | null = null
let animationId: number | null = null
let clock: THREE.Clock | null = null

const createPipeMesh = (pipe: Pipe): THREE.Mesh => {
  const direction = new THREE.Vector3().subVectors(pipe.end, pipe.start)
  const length = direction.length()

  const geometry = new THREE.CylinderGeometry(
    pipe.radius,
    pipe.radius,
    length,
    16
  )

  const color = getPipeTypeColor(pipe.type)
  const material = new THREE.MeshPhysicalMaterial({
    color: color,
    transparent: true,
    opacity: 0.7,
    roughness: 0.3,
    metalness: 0.6,
    clearcoat: 0.5,
    clearcoatRoughness: 0.2
  })

  const mesh = new THREE.Mesh(geometry, material)
  mesh.userData = { pipeId: pipe.id, pipe }

  const midPoint = new THREE.Vector3()
    .addVectors(pipe.start, pipe.end)
    .multiplyScalar(0.5)
  mesh.position.copy(midPoint)

  const up = new THREE.Vector3(0, 1, 0)
  const dirNormalized = direction.clone().normalize()
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, dirNormalized)
  mesh.quaternion.copy(quaternion)

  return mesh
}

const createCollisionMarker = (position: THREE.Vector3): THREE.Mesh => {
  const geometry = new THREE.SphereGeometry(0.4, 16, 16)
  const material = new THREE.MeshBasicMaterial({
    color: 0xFF1744,
    transparent: true,
    opacity: 0.8
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.position.copy(position)
  mesh.userData = { isCollisionMarker: true }
  return mesh
}

export const initScene = (container: HTMLElement): SceneContext => {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x0A0F1E)

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  )
  const { cameraState } = usePipeStore.getState()
  camera.position.copy(cameraState.position)
  camera.lookAt(cameraState.target)

  const renderer = new THREE.WebGLRenderer({ antialias: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.05
  controls.screenSpacePanning = true
  controls.minDistance = 5
  controls.maxDistance = 100
  controls.target.copy(cameraState.target)

  const ambientLight = new THREE.AmbientLight(0x404060, 0.6)
  scene.add(ambientLight)

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
  directionalLight.position.set(30, 40, 30)
  directionalLight.castShadow = true
  directionalLight.shadow.mapSize.width = 2048
  directionalLight.shadow.mapSize.height = 2048
  scene.add(directionalLight)

  const pointLight1 = new THREE.PointLight(0x2196F3, 0.5, 50)
  pointLight1.position.set(-20, 0, 20)
  scene.add(pointLight1)

  const pointLight2 = new THREE.PointLight(0xFF9800, 0.5, 50)
  pointLight2.position.set(20, 0, -20)
  scene.add(pointLight2)

  const gridHelper = new THREE.GridHelper(60, 30, 0x1E293B, 0x0f1a2e)
  gridHelper.position.y = -15
  scene.add(gridHelper)

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()

  sceneContext = { scene, camera, renderer, controls, raycaster, mouse }
  clock = new THREE.Clock()

  return sceneContext
}

export const updatePipes = (pipes: Pipe[]): void => {
  if (!sceneContext) return

  const { scene } = sceneContext

  pipeMeshes.forEach((mesh, id) => {
    if (!pipes.find(p => p.id === id)) {
      scene.remove(mesh)
      pipeMeshes.delete(id)
    }
  })

  pipes.forEach(pipe => {
    let mesh = pipeMeshes.get(pipe.id)
    if (!mesh) {
      mesh = createPipeMesh(pipe)
      scene.add(mesh)
      pipeMeshes.set(pipe.id, mesh)
    }
  })
}

export const updateCollisionMarkers = (collisions: CollisionPair[]): void => {
  if (!sceneContext) return

  const { scene } = sceneContext
  const { markersVisible } = usePipeStore.getState()

  collisionMarkers.forEach(marker => {
    scene.remove(marker)
  })
  collisionMarkers.length = 0

  collisions.forEach(collision => {
    const marker = createCollisionMarker(collision.closestPoint)
    marker.visible = markersVisible
    scene.add(marker)
    collisionMarkers.push(marker)
  })
}

const updateHoverEffect = (hoveredId: string | null): void => {
  pipeMeshes.forEach((mesh, id) => {
    const material = mesh.material as THREE.MeshPhysicalMaterial
    const baseColor = getPipeTypeColor((mesh.userData.pipe as Pipe).type)
    const targetOpacity = id === hoveredId ? 1.0 : 0.7
    const targetEmissive = id === hoveredId ? new THREE.Color(baseColor).multiplyScalar(0.5) : new THREE.Color(0x000000)

    material.opacity = THREE.MathUtils.lerp(material.opacity, targetOpacity, 0.15)
    
    if (material.emissive) {
      material.emissive.lerp(targetEmissive, 0.15)
    }
  })
}

export const updateCollisionListUI = (collisions: CollisionPair[]): void => {
  const listElement = document.getElementById('collisionList')
  if (!listElement) return

  if (collisions.length === 0) {
    listElement.innerHTML = '<div style="color: #ffffff60; font-size: 12px;">暂无冲突</div>'
    return
  }

  listElement.innerHTML = collisions.map(collision => {
    const abbrA = getPipeTypeAbbr(collision.pipeA.type)
    const abbrB = getPipeTypeAbbr(collision.pipeB.type)
    const pair = `${abbrA}-${abbrB}`
    const distance = collision.minDistance.toFixed(2)
    return `
      <div class="collision-item">
        <span class="collision-pair">${pair}</span>
        <span class="collision-distance">${distance}m</span>
      </div>
    `
  }).join('')
}

export const showPropertyPanel = (pipe: Pipe, collisions: CollisionPair[]): void => {
  const panel = document.getElementById('propertyPanel')
  if (!panel) return

  panel.classList.add('active')

  document.getElementById('propertyType')!.textContent = getPipeTypeName(pipe.type)
  document.getElementById('propertyStart')!.textContent = 
    `(${pipe.start.x.toFixed(1)}, ${pipe.start.y.toFixed(1)}, ${pipe.start.z.toFixed(1)})`
  document.getElementById('propertyEnd')!.textContent = 
    `(${pipe.end.x.toFixed(1)}, ${pipe.end.y.toFixed(1)}, ${pipe.end.z.toFixed(1)})`
  document.getElementById('propertyDiameter')!.textContent = `${(pipe.radius * 2).toFixed(2)}m`
  document.getElementById('propertyDepth')!.textContent = `${pipe.depth.toFixed(2)}m`

  const conflictsDiv = document.getElementById('propertyConflicts')!
  const pipeConflicts = collisions.filter(
    c => c.pipeA.id === pipe.id || c.pipeB.id === pipe.id
  )

  if (pipeConflicts.length > 0) {
    const conflictPipes = pipeConflicts.map(c => 
      c.pipeA.id === pipe.id ? c.pipeB : c.pipeA
    )
    conflictsDiv.innerHTML = `
      <div class="property-conflicts-title">冲突管线 (${conflictPipes.length})</div>
      ${conflictPipes.map(p => `
        <div class="conflict-pipe">${getPipeTypeName(p.type)}</div>
      `).join('')}
    `
  } else {
    conflictsDiv.innerHTML = ''
  }
}

export const hidePropertyPanel = (): void => {
  const panel = document.getElementById('propertyPanel')
  if (panel) {
    panel.classList.remove('active')
  }
}

export const updateTooltip = (
  visible: boolean,
  pipe: Pipe | null,
  x: number,
  y: number
): void => {
  const tooltip = document.getElementById('tooltip')
  if (!tooltip) return

  if (visible && pipe) {
    tooltip.classList.add('visible')
    document.getElementById('tooltipType')!.textContent = getPipeTypeName(pipe.type)
    document.getElementById('tooltipDiameter')!.textContent = 
      `管径: ${(pipe.radius * 2).toFixed(2)}m`
    tooltip.style.left = `${x + 15}px`
    tooltip.style.top = `${y + 15}px`
  } else {
    tooltip.classList.remove('visible')
  }
}

export const animate = (): void => {
  if (!sceneContext || !clock) return

  const { scene, camera, renderer, controls } = sceneContext
  const elapsedTime = clock.getElapsedTime()

  collisionMarkers.forEach(marker => {
    const material = marker.material as THREE.MeshBasicMaterial
    material.opacity = 0.4 + Math.sin(elapsedTime * Math.PI * 2) * 0.4
  })

  const { hoveredPipeId, selectedPipeId } = usePipeStore.getState()
  updateHoverEffect(hoveredPipeId || selectedPipeId)

  controls.update()
  renderer.render(scene, camera)

  animationId = requestAnimationFrame(animate)
}

export const getSceneContext = (): SceneContext | null => sceneContext

export const resetCamera = (): void => {
  if (!sceneContext) return

  const { camera, controls } = sceneContext
  const initialState = {
    position: new THREE.Vector3(30, 30, 30),
    target: new THREE.Vector3(0, 0, 0)
  }

  const startPos = camera.position.clone()
  const startTarget = controls.target.clone()
  const duration = 500
  const startTime = performance.now()

  const animateCamera = () => {
    const elapsed = performance.now() - startTime
    const t = Math.min(elapsed / duration, 1)
    const eased = 1 - Math.pow(1 - t, 3)

    camera.position.lerpVectors(startPos, initialState.position, eased)
    controls.target.lerpVectors(startTarget, initialState.target, eased)
    controls.update()

    if (t < 1) {
      requestAnimationFrame(animateCamera)
    }
  }

  animateCamera()
}

export const clearMarkers = (): void => {
  usePipeStore.getState().setMarkersVisible(false)
  collisionMarkers.forEach(marker => {
    marker.visible = false
  })
}

export const showMarkers = (): void => {
  usePipeStore.getState().setMarkersVisible(true)
  collisionMarkers.forEach(marker => {
    marker.visible = true
  })
}

export const handleResize = (): void => {
  if (!sceneContext) return

  const { camera, renderer } = sceneContext
  const container = renderer.domElement.parentElement
  if (!container) return

  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.clientWidth, container.clientHeight)
}

export const getPipeMeshes = (): Map<string, THREE.Mesh> => pipeMeshes

let prevPipesKey = ''
let prevCollisionsKey = ''

const getPipesKey = (pipes: Pipe[]): string => {
  return pipes.map(p => 
    `${p.id}-${p.start.x}-${p.start.y}-${p.start.z}-${p.end.x}-${p.end.y}-${p.end.z}-${p.radius}`
  ).join('|')
}

const getCollisionsKey = (collisions: CollisionPair[]): string => {
  return collisions.map(c => 
    `${c.pipeA.id}-${c.pipeB.id}-${c.minDistance.toFixed(3)}`
  ).join('|')
}

export const setupStoreSubscriptions = (): (() => void) => {
  const unsubscribe = usePipeStore.subscribe((state) => {
    const pipesKey = getPipesKey(state.pipes)
    if (pipesKey !== prevPipesKey) {
      prevPipesKey = pipesKey
      updatePipes(state.pipes)
    }

    const collisionsKey = getCollisionsKey(state.collisions)
    if (collisionsKey !== prevCollisionsKey) {
      prevCollisionsKey = collisionsKey
      updateCollisionMarkers(state.collisions)
      updateCollisionListUI(state.collisions)
    }
  })

  return unsubscribe
}

export const disposeScene = (): void => {
  if (animationId) {
    cancelAnimationFrame(animationId)
    animationId = null
  }

  if (sceneContext) {
    sceneContext.renderer.dispose()
    sceneContext = null
  }

  pipeMeshes.clear()
  collisionMarkers.length = 0
}
