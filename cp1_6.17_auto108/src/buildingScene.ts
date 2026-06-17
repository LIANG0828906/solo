import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface BuildingData {
  boundingBox: THREE.Box3
  position: THREE.Vector3
  width: number
  height: number
  depth: number
  wakeZone: THREE.Box3
}

export interface SceneContext {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  controls: OrbitControls
  buildings: BuildingData[]
}

export function createBuildingScene(container: HTMLElement): SceneContext {
  const scene = new THREE.Scene()
  scene.background = null

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  )
  camera.position.set(35, 28, 35)
  camera.lookAt(0, 0, 0)

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor(0x1E2A38, 1)
  container.appendChild(renderer.domElement)

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.08
  controls.minDistance = 5
  controls.maxDistance = 80
  controls.target.set(0, 4, 0)
  controls.update()

  const ambientLight = new THREE.AmbientLight(0x606080, 1.2)
  scene.add(ambientLight)

  const dirLight = new THREE.DirectionalLight(0xffffff, 1.0)
  dirLight.position.set(25, 40, 15)
  dirLight.castShadow = false
  scene.add(dirLight)

  const hemiLight = new THREE.HemisphereLight(0x87CEEB, 0x362E28, 0.4)
  scene.add(hemiLight)

  createGround(scene)

  const buildings = createBuildings(scene)

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  })

  return { scene, camera, renderer, controls, buildings }
}

function createGround(scene: THREE.Scene): void {
  const size = 80
  const gridHelper = new THREE.GridHelper(size, 40, 0x6B8E23, 0x6B8E23)
  const gridMat = gridHelper.material as THREE.Material
  gridMat.transparent = true
  gridMat.opacity = 0.4
  scene.add(gridHelper)

  const groundGeo = new THREE.PlaneGeometry(size, size)
  const groundMat = new THREE.MeshBasicMaterial({
    color: 0x6B8E23,
    transparent: true,
    opacity: 0.12,
    side: THREE.DoubleSide
  })
  const ground = new THREE.Mesh(groundGeo, groundMat)
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.01
  scene.add(ground)
}

function createBuildings(scene: THREE.Scene): BuildingData[] {
  const buildings: BuildingData[] = []
  const count = 10 + Math.floor(Math.random() * 6)

  const placements: { x: number; z: number }[] = []
  const gridCols = 4
  const gridRows = 4
  const spacing = 9

  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      placements.push({
        x: (c - (gridCols - 1) / 2) * spacing,
        z: (r - (gridRows - 1) / 2) * spacing
      })
    }
  }

  const shuffled = placements.sort(() => Math.random() - 0.5).slice(0, count)

  const colorA = new THREE.Color(0xD3D3D3)
  const colorB = new THREE.Color(0xA9A9A9)
  const minHeight = 3
  const maxHeight = 16

  for (const pos of shuffled) {
    const width = 2.5 + Math.random() * 2.5
    const depth = 2.5 + Math.random() * 2.5
    const height = minHeight + Math.random() * (maxHeight - minHeight)

    const t = (height - minHeight) / (maxHeight - minHeight)
    const bodyColor = new THREE.Color().lerpColors(colorA, colorB, t)

    const x = pos.x + (Math.random() - 0.5) * 2
    const z = pos.z + (Math.random() - 0.5) * 2

    const geo = new THREE.BoxGeometry(width, height, depth)
    const mat = new THREE.MeshPhongMaterial({
      color: bodyColor,
      flatShading: true
    })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.set(x, height / 2, z)
    scene.add(mesh)

    const roofGeo = new THREE.BoxGeometry(width + 0.3, 0.4, depth + 0.3)
    const roofColor = bodyColor.clone().multiplyScalar(0.65)
    const roofMat = new THREE.MeshPhongMaterial({
      color: roofColor,
      flatShading: true
    })
    const roof = new THREE.Mesh(roofGeo, roofMat)
    roof.position.set(x, height + 0.2, z)
    scene.add(roof)

    const boundingBox = new THREE.Box3(
      new THREE.Vector3(x - width / 2, 0, z - depth / 2),
      new THREE.Vector3(x + width / 2, height, z + depth / 2)
    )

    const wakeExtent = Math.max(width, depth) * 1.2
    const wakeZone = new THREE.Box3(
      new THREE.Vector3(x + width / 2, 0, z - depth / 2 - 1),
      new THREE.Vector3(x + width / 2 + wakeExtent, height * 1.3, z + depth / 2 + 1)
    )

    buildings.push({
      boundingBox,
      position: new THREE.Vector3(x, height / 2, z),
      width,
      height,
      depth,
      wakeZone
    })
  }

  return buildings
}
