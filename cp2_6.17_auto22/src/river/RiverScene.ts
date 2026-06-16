import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { loadPaths, interpolateOnPath, type RiverPath } from './PathLoader'
import { createFlowParticles, type FlowParticlesSystem } from './FlowParticles'
import { useStore } from '../analytics/DataStore'

export interface RiverSceneAPI {
  dispose: () => void
  resize: (w: number, h: number) => void
  getThreeObjects: () => {
    renderer: THREE.WebGLRenderer
    camera: THREE.PerspectiveCamera
    scene: THREE.Scene
    points: THREE.Points
  }
}

export function createRiverScene(container: HTMLElement): RiverSceneAPI {
  const registerParticlePath = useStore.getState().registerParticlePath
  const selectPath = useStore.getState().selectPath
  const selectParticle = useStore.getState().selectParticle
  const recordFlowSample = useStore.getState().recordFlowSample
  const updatePathStats = useStore.getState().updatePathStats
  const getPathByParticleIndex = useStore.getState().getPathByParticleIndex

  const width = container.clientWidth
  const height = container.clientHeight

  const scene = new THREE.Scene()
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  canvas.width = 2
  canvas.height = 512
  const gradient = ctx.createLinearGradient(0, 0, 0, 512)
  gradient.addColorStop(0, '#0A0A2A')
  gradient.addColorStop(1, '#000000')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 2, 512)
  const bgTexture = new THREE.CanvasTexture(canvas)
  scene.background = bgTexture

  const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000)
  camera.position.set(0, 50, 80)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 40
  controls.maxDistance = 400
  controls.enablePan = true
  controls.target.set(0, 0, 0)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
  scene.add(ambientLight)
  const dirLight = new THREE.DirectionalLight(0xb0c4ff, 0.5)
  dirLight.position.set(50, 80, 30)
  scene.add(dirLight)

  const gridSize = 400
  const gridDivisions = 40
  const gridHelper = new THREE.GridHelper(gridSize, gridDivisions, 0xffffff, 0xffffff)
  gridHelper.position.y = -5
  gridHelper.material.transparent = true
  ;(gridHelper.material as THREE.Material).opacity = 0.1
  gridHelper.material.depthWrite = false
  scene.add(gridHelper)

  const starCount = 20
  const starPositions = new Float32Array(starCount * 3)
  const starColors = new Float32Array(starCount * 3)
  const starSizes = new Float32Array(starCount)
  for (let i = 0; i < starCount; i++) {
    const r = 120 + Math.random() * 80
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI * 0.5 + 0.2
    starPositions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    starPositions[i * 3 + 1] = r * Math.cos(phi)
    starPositions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
    starColors[i * 3] = 1
    starColors[i * 3 + 1] = 1
    starColors[i * 3 + 2] = 1
    starSizes[i] = 1 + Math.random() * 1
  }
  const starGeom = new THREE.BufferGeometry()
  starGeom.setAttribute('position', new THREE.BufferAttribute(starPositions, 3))
  starGeom.setAttribute('color', new THREE.BufferAttribute(starColors, 3))
  starGeom.setAttribute('size', new THREE.BufferAttribute(starSizes, 1))
  const starMat = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.3,
    sizeAttenuation: true,
    depthWrite: false
  })
  const stars = new THREE.Points(starGeom, starMat)
  scene.add(stars)

  const paths: RiverPath[] = loadPaths()
  const particleSystem: FlowParticlesSystem = createFlowParticles(paths)
  scene.add(particleSystem.points)

  const pathNameMap: Record<string, string> = {}
  for (const p of paths) pathNameMap[p.id] = p.name

  for (const p of particleSystem.particles) {
    registerParticlePath(p.index, p.pathId)
  }

  const avgSpeeds = particleSystem.getAverageSpeedByPath()
  for (const id of Object.keys(avgSpeeds)) {
    updatePathStats(id, {
      pathId: id,
      pathName: pathNameMap[id] ?? id,
      averageSpeed: avgSpeeds[id]
    })
  }

  let pathFlowMap: Record<string, number> = particleSystem.getParticlePathCounts()
  let totalParticles = particleSystem.getTotalParticleCount()
  const startTime = performance.now()
  let lastStatsTime = startTime

  const raycaster = new THREE.Raycaster()
  const mouse = new THREE.Vector2()
  let isDown = false
  let downX = 0
  let downY = 0

  function onPointerDown(e: PointerEvent) {
    isDown = true
    downX = e.clientX
    downY = e.clientY
  }

  function onPointerUp(e: PointerEvent) {
    if (!isDown) return
    isDown = false
    const dx = Math.abs(e.clientX - downX)
    const dy = Math.abs(e.clientY - downY)
    if (dx > 4 || dy > 4) return
    const rect = renderer.domElement.getBoundingClientRect()
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
    raycaster.setFromCamera(mouse, camera)
    const intersects = raycaster.intersectObject(particleSystem.points, false)
    if (intersects.length > 0) {
      const first = intersects[0]
      const idx = first.index
      if (idx !== undefined) {
        selectParticle(idx)
        const pid = getPathByParticleIndex(idx)
        if (pid) {
          selectPath(pid)
        }
        return
      }
    }
    selectParticle(null)
    selectPath(null)
  }

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointerup', onPointerUp)

  const clock = new THREE.Clock()
  let rafId = 0

  function animate() {
    const delta = clock.getDelta()
    const now = performance.now()

    if (now - lastStatsTime >= 5000) {
      lastStatsTime = now
      pathFlowMap = particleSystem.getParticlePathCounts()
      totalParticles = particleSystem.getTotalParticleCount()
      for (const pathId of Object.keys(pathFlowMap)) {
        recordFlowSample(pathId, pathFlowMap[pathId], now)
      }
    }

    const selectedParticleIdx = useStore.getState().selectedParticleIndex
    particleSystem.update(
      delta,
      paths,
      pathFlowMap,
      totalParticles,
      interpolateOnPath,
      selectedParticleIdx
    )

    controls.update()
    renderer.render(scene, camera)
    rafId = requestAnimationFrame(animate)
  }
  animate()

  return {
    resize(w: number, h: number) {
      camera.aspect = w / h
      camera.updateProjectionMatrix()
      renderer.setSize(w, h)
    },
    dispose() {
      cancelAnimationFrame(rafId)
      renderer.domElement.removeEventListener('pointerdown', onPointerDown)
      renderer.domElement.removeEventListener('pointerup', onPointerUp)
      controls.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode) {
        renderer.domElement.parentNode.removeChild(renderer.domElement)
      }
      particleSystem.geometry.dispose()
      particleSystem.material.dispose()
      starGeom.dispose()
      starMat.dispose()
      bgTexture.dispose()
    },
    getThreeObjects() {
      return {
        renderer,
        camera,
        scene,
        points: particleSystem.points
      }
    }
  }
}
