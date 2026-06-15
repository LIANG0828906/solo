import * as THREE from 'three'
import type { PlantData, PlantNode, EnvironmentParams, SpeciesType } from './plantEngine'
import { captureSnapshot } from './photoCapture'

export interface SceneState {
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  renderer: THREE.WebGLRenderer
  soilMesh: THREE.Mesh
  soilSectionMesh?: THREE.Mesh
  sunLight: THREE.DirectionalLight
  ambientLight: THREE.AmbientLight
  hemisphereLight: THREE.HemisphereLight
  plantGroup: THREE.Group
  particlesGroup: THREE.Group
  seedMesh?: THREE.Mesh
  supportTrellis?: THREE.Group
  nodeMeshes: Map<string, THREE.Object3D>
  dustParticles: THREE.Points[]
}

export interface CameraState {
  target: THREE.Vector3
  spherical: {
    radius: number
    theta: number
    phi: number
  }
  panOffset: THREE.Vector3
}

const CAMERA_MIN_RADIUS = 1
const CAMERA_MAX_RADIUS = 15
const CAMERA_MIN_PHI = 0.1
const CAMERA_MAX_PHI = Math.PI / 2 - 0.05
const PAN_SPEED = 0.02

export function createScene(container: HTMLElement): SceneState {
  const scene = new THREE.Scene()
  scene.background = null
  scene.fog = new THREE.Fog(0xb3e0fc, 15, 40)

  const camera = new THREE.PerspectiveCamera(
    50,
    container.clientWidth / container.clientHeight,
    0.1,
    200
  )
  camera.position.set(4, 3, 5)
  camera.lookAt(0, 0.5, 0)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.2
  container.appendChild(renderer.domElement)

  const soilGeometry = new THREE.CylinderGeometry(2.2, 2.4, 0.4, 48)
  const soilMaterial = new THREE.MeshStandardMaterial({
    color: 0x4a2c1a,
    roughness: 0.95,
    metalness: 0.02
  })
  const soilMesh = new THREE.Mesh(soilGeometry, soilMaterial)
  soilMesh.position.y = -0.2
  soilMesh.receiveShadow = true
  scene.add(soilMesh)

  const soilDetailGeometry = new THREE.CircleGeometry(2.1, 48)
  const soilDetailMaterial = new THREE.MeshStandardMaterial({
    color: 0x3d2415,
    roughness: 1,
    metalness: 0
  })
  const soilDetail = new THREE.Mesh(soilDetailGeometry, soilDetailMaterial)
  soilDetail.rotation.x = -Math.PI / 2
  soilDetail.position.y = 0.001
  soilDetail.receiveShadow = true
  scene.add(soilDetail)

  const soilSectionGeometry = new THREE.BoxGeometry(4.4, 3, 0.05)
  const soilSectionMaterial = new THREE.MeshStandardMaterial({
    color: 0x5c3a21,
    transparent: true,
    opacity: 0,
    roughness: 0.9,
    side: THREE.DoubleSide
  })
  const soilSectionMesh = new THREE.Mesh(soilSectionGeometry, soilSectionMaterial)
  soilSectionMesh.position.set(0, -1.5, 0)
  soilSectionMesh.rotation.y = 0
  scene.add(soilSectionMesh)

  const gridHelper = new THREE.GridHelper(20, 40, 0x88a888, 0xa0c0a0)
  gridHelper.position.y = -0.001
  gridHelper.material.transparent = true
  gridHelper.material.opacity = 0.15
  scene.add(gridHelper)

  const ambientLight = new THREE.AmbientLight(0xffffff, 0.35)
  scene.add(ambientLight)

  const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x654321, 0.5)
  scene.add(hemisphereLight)

  const sunLight = new THREE.DirectionalLight(0xfff5e0, 1.2)
  sunLight.position.set(5, 8, 3)
  sunLight.castShadow = true
  sunLight.shadow.mapSize.width = 2048
  sunLight.shadow.mapSize.height = 2048
  sunLight.shadow.camera.near = 0.5
  sunLight.shadow.camera.far = 30
  sunLight.shadow.camera.left = -6
  sunLight.shadow.camera.right = 6
  sunLight.shadow.camera.top = 6
  sunLight.shadow.camera.bottom = -6
  sunLight.shadow.bias = -0.0005
  scene.add(sunLight)

  const plantGroup = new THREE.Group()
  scene.add(plantGroup)

  const particlesGroup = new THREE.Group()
  scene.add(particlesGroup)

  return {
    scene,
    camera,
    renderer,
    soilMesh,
    soilSectionMesh,
    sunLight,
    ambientLight,
    hemisphereLight,
    plantGroup,
    particlesGroup,
    nodeMeshes: new Map(),
    dustParticles: []
  }
}

export function createSupportTrellis(sceneState: SceneState, species: SpeciesType): void {
  if (sceneState.supportTrellis) {
    sceneState.scene.remove(sceneState.supportTrellis)
  }

  if (species !== 'vine') return

  const trellisGroup = new THREE.Group()
  const trellisMaterial = new THREE.MeshStandardMaterial({
    color: 0x88aacc,
    transparent: true,
    opacity: 0.3,
    metalness: 0.5,
    roughness: 0.3
  })

  const poleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 3.5, 8)
  for (let i = -1; i <= 1; i++) {
    const pole = new THREE.Mesh(poleGeometry, trellisMaterial)
    pole.position.set(i * 0.4, 1.75, 0)
    trellisGroup.add(pole)
  }

  const ringGeometry = new THREE.TorusGeometry(0.45, 0.015, 8, 24)
  for (let h = 0.8; h <= 3; h += 0.55) {
    const ring = new THREE.Mesh(ringGeometry, trellisMaterial)
    ring.position.set(0, h, 0)
    ring.rotation.x = Math.PI / 2
    trellisGroup.add(ring)
  }

  sceneState.supportTrellis = trellisGroup
  sceneState.scene.add(trellisGroup)
}

export function playSeedPlantingAnimation(
  sceneState: SceneState,
  onComplete: () => void
): void {
  const seedGeometry = new THREE.SphereGeometry(0.08, 16, 12)
  const seedMaterial = new THREE.MeshStandardMaterial({
    color: 0x6d4c2b,
    roughness: 0.8,
    metalness: 0.1
  })
  const seedMesh = new THREE.Mesh(seedGeometry, seedMaterial)
  seedMesh.castShadow = true
  sceneState.seedMesh = seedMesh
  sceneState.scene.add(seedMesh)

  const startY = 4
  const endY = 0.02
  const duration = 800
  const startTime = performance.now()

  spawnDustParticles(sceneState, new THREE.Vector3(0, 0, 0))

  function animate() {
    const elapsed = performance.now() - startTime
    const t = Math.min(1, elapsed / duration)
    const eased = 1 - Math.pow(1 - t, 3)

    seedMesh.position.y = startY - (startY - endY) * eased
    seedMesh.rotation.x = eased * Math.PI * 2
    seedMesh.rotation.z = eased * Math.PI

    if (t < 1) {
      requestAnimationFrame(animate)
    } else {
      setTimeout(() => {
        const buryStart = performance.now()
        const buryDuration = 400
        function buryAnimate() {
          const bt = Math.min(1, (performance.now() - buryStart) / buryDuration)
          seedMesh.position.y = endY - 0.05 * bt
          seedMesh.scale.setScalar(1 + bt * 0.3)
          if (bt < 1) {
            requestAnimationFrame(buryAnimate)
          } else {
            setTimeout(() => {
              seedMesh.visible = false
              onComplete()
            }, 300)
          }
        }
        buryAnimate()
      }, 200)
    }
  }
  animate()
}

function spawnDustParticles(sceneState: SceneState, origin: THREE.Vector3): void {
  const particleCount = 30
  const positions = new Float32Array(particleCount * 3)
  const velocities: THREE.Vector3[] = []
  const sizes = new Float32Array(particleCount)

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2
    const r = Math.random() * 0.3
    positions[i * 3] = origin.x + Math.cos(angle) * r
    positions[i * 3 + 1] = origin.y + 0.01
    positions[i * 3 + 2] = origin.z + Math.sin(angle) * r
    velocities.push(new THREE.Vector3(
      Math.cos(angle) * (0.5 + Math.random()),
      0.3 + Math.random() * 0.5,
      Math.sin(angle) * (0.5 + Math.random())
    ))
    sizes[i] = 0.02 + Math.random() * 0.04
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

  const material = new THREE.PointsMaterial({
    color: 0x8b7355,
    size: 0.04,
    transparent: true,
    opacity: 0.8,
    depthWrite: false,
    sizeAttenuation: true
  })

  const points = new THREE.Points(geometry, material)
  sceneState.scene.add(points)
  sceneState.dustParticles.push(points)

  const startTime = performance.now()
  const duration = 1200

  function animateDust() {
    const t = Math.min(1, (performance.now() - startTime) / duration)
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    
    for (let i = 0; i < particleCount; i++) {
      const vel = velocities[i]
      posAttr.setX(i, posAttr.getX(i) + vel.x * 0.016)
      posAttr.setY(i, posAttr.getY(i) + vel.y * 0.016 - 0.003)
      posAttr.setZ(i, posAttr.getZ(i) + vel.z * 0.016)
      vel.multiplyScalar(0.96)
    }
    posAttr.needsUpdate = true
    material.opacity = 0.8 * (1 - t)

    if (t < 1) {
      requestAnimationFrame(animateDust)
    } else {
      sceneState.scene.remove(points)
      geometry.dispose()
      material.dispose()
      const idx = sceneState.dustParticles.indexOf(points)
      if (idx > -1) sceneState.dustParticles.splice(idx, 1)
    }
  }
  animateDust()
}

export function spawnWiltingParticles(sceneState: SceneState, plantGroup: THREE.Group): void {
  const bbox = new THREE.Box3().setFromObject(plantGroup)
  const center = new THREE.Vector3()
  bbox.getCenter(center)
  const size = new THREE.Vector3()
  bbox.getSize(size)

  const particleCount = 80
  const positions = new Float32Array(particleCount * 3)
  const colors = new Float32Array(particleCount * 3)

  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = center.x + (Math.random() - 0.5) * size.x * 0.8
    positions[i * 3 + 1] = center.y + (Math.random() - 0.5) * size.y * 0.8
    positions[i * 3 + 2] = center.z + (Math.random() - 0.5) * size.z * 0.8

    const color = new THREE.Color().setHSL(
      0.08 + Math.random() * 0.05,
      0.5 + Math.random() * 0.3,
      0.3 + Math.random() * 0.3
    )
    colors[i * 3] = color.r
    colors[i * 3 + 1] = color.g
    colors[i * 3 + 2] = color.b
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.PointsMaterial({
    size: 0.06,
    vertexColors: true,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    sizeAttenuation: true
  })

  const points = new THREE.Points(geometry, material)
  sceneState.scene.add(points)

  const startTime = performance.now()
  const duration = 2000
  const velocities: THREE.Vector3[] = Array.from(
    { length: particleCount },
    () => new THREE.Vector3(
      (Math.random() - 0.5) * 0.3,
      -0.5 - Math.random() * 0.5,
      (Math.random() - 0.5) * 0.3
    )
  )

  function animate() {
    const t = Math.min(1, (performance.now() - startTime) / duration)
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute

    for (let i = 0; i < particleCount; i++) {
      const vel = velocities[i]
      posAttr.setX(i, posAttr.getX(i) + vel.x * 0.016)
      posAttr.setY(i, posAttr.getY(i) + vel.y * 0.016)
      posAttr.setZ(i, posAttr.getZ(i) + vel.z * 0.016)
      vel.y -= 0.01
    }
    posAttr.needsUpdate = true
    material.opacity = 1 - t

    if (t < 1) {
      requestAnimationFrame(animate)
    } else {
      sceneState.scene.remove(points)
      geometry.dispose()
      material.dispose()
    }
  }
  animate()
}

export function updatePlantMeshes(
  sceneState: SceneState,
  plantData: PlantData
): void {
  const { plantGroup, nodeMeshes } = sceneState

  nodeMeshes.forEach((mesh, id) => {
    if (!plantData.nodes.has(id)) {
      plantGroup.remove(mesh)
      disposeMesh(mesh)
      nodeMeshes.delete(id)
    }
  })

  plantData.nodes.forEach((node, id) => {
    if (node.growthProgress <= 0.001 && node.type !== 'seed') {
      if (nodeMeshes.has(id)) {
        const mesh = nodeMeshes.get(id)!
        mesh.visible = false
      }
      return
    }

    let mesh = nodeMeshes.get(id)
    if (!mesh) {
      mesh = createNodeMesh(node, plantData.species)
      if (mesh) {
        plantGroup.add(mesh)
        nodeMeshes.set(id, mesh)
      } else {
        return
      }
    }

    updateNodeMesh(mesh, node, plantData)
  })
}

function createNodeMesh(node: PlantNode, species: SpeciesType): THREE.Object3D | null {
  switch (node.type) {
    case 'seed':
      return createSeedMesh(node)
    case 'stem':
      return createStemMesh(node, species)
    case 'leaf':
      return createLeafMesh(node, species)
    case 'root':
      return createRootMesh(node)
    case 'flower':
      return createFlowerMesh(node)
    case 'thorn':
      return createThornMesh(node)
    default:
      return null
  }
}

function createSeedMesh(node: PlantNode): THREE.Object3D {
  const group = new THREE.Group()
  const geometry = new THREE.SphereGeometry(node.thickness, 16, 12)
  const material = new THREE.MeshStandardMaterial({
    color: node.color,
    roughness: 0.8,
    metalness: 0.1
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  return group
}

function createStemMesh(node: PlantNode, species: SpeciesType): THREE.Object3D {
  const group = new THREE.Group()
  
  let geometry: THREE.BufferGeometry
  if (species === 'cactus') {
    geometry = new THREE.CylinderGeometry(
      node.thickness * 0.85,
      node.thickness,
      node.length,
      8,
      1
    )
    const posAttr = geometry.getAttribute('position') as THREE.BufferAttribute
    for (let i = 0; i < posAttr.count; i++) {
      const y = posAttr.getY(i)
      if (Math.abs(y) < node.length / 2 - 0.01) {
        const angle = (i % 8) / 8 * Math.PI * 2
        const ridge = 1 + Math.sin(angle * 8 + y * 10) * 0.08
        posAttr.setX(i, posAttr.getX(i) * ridge)
        posAttr.setZ(i, posAttr.getZ(i) * ridge)
      }
    }
    posAttr.needsUpdate = true
    geometry.computeVertexNormals()
  } else if (species === 'vine') {
    geometry = new THREE.CylinderGeometry(
      node.thickness * 0.6,
      node.thickness,
      node.length,
      6,
      2
    )
  } else {
    geometry = new THREE.CylinderGeometry(
      node.thickness * 0.7,
      node.thickness,
      node.length,
      10,
      1
    )
  }

  const material = new THREE.MeshStandardMaterial({
    color: node.color,
    roughness: 0.75,
    metalness: 0.05
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  return group
}

function createLeafMesh(node: PlantNode, species: SpeciesType): THREE.Object3D {
  const group = new THREE.Group()
  
  let shape: THREE.Shape
  if (species === 'sunflower') {
    shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.bezierCurveTo(node.scale * 0.8, node.scale * 0.2, node.scale * 1.2, node.scale * 0.6, 0, node.length)
    shape.bezierCurveTo(-node.scale * 1.2, node.scale * 0.6, -node.scale * 0.8, node.scale * 0.2, 0, 0)
  } else {
    shape = new THREE.Shape()
    shape.moveTo(0, 0)
    shape.quadraticCurveTo(node.scale, node.length * 0.4, 0, node.length)
    shape.quadraticCurveTo(-node.scale, node.length * 0.4, 0, 0)
  }

  const geometry = new THREE.ShapeGeometry(shape, 8)
  geometry.translate(0, 0, 0.002)

  const material = new THREE.MeshStandardMaterial({
    color: node.color,
    roughness: 0.6,
    metalness: 0.05,
    side: THREE.DoubleSide,
    transparent: true
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)

  const veinGeometry = new THREE.BufferGeometry()
  const veinPoints = [
    new THREE.Vector3(0, 0, 0.004),
    new THREE.Vector3(0, node.length * 0.5, 0.004),
    new THREE.Vector3(0, node.length * 0.9, 0.004)
  ]
  veinGeometry.setFromPoints(veinPoints)
  const veinMaterial = new THREE.LineBasicMaterial({
    color: node.color.clone().multiplyScalar(0.7),
    transparent: true,
    opacity: 0.5
  })
  const vein = new THREE.Line(veinGeometry, veinMaterial)
  group.add(vein)

  return group
}

function createRootMesh(node: PlantNode): THREE.Object3D {
  const group = new THREE.Group()
  const geometry = new THREE.CylinderGeometry(
    node.thickness * 0.5,
    node.thickness,
    node.length,
    6,
    1
  )
  const material = new THREE.MeshStandardMaterial({
    color: node.color,
    roughness: 0.9,
    metalness: 0.02
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)
  return group
}

function createFlowerMesh(node: PlantNode): THREE.Object3D {
  const group = new THREE.Group()

  const petalCount = 18
  const petalShape = new THREE.Shape()
  petalShape.moveTo(0, 0)
  petalShape.quadraticCurveTo(node.scale * 0.25, node.length * 0.5, 0, node.length)
  petalShape.quadraticCurveTo(-node.scale * 0.25, node.length * 0.5, 0, 0)

  for (let i = 0; i < petalCount; i++) {
    const petalGeometry = new THREE.ShapeGeometry(petalShape, 4)
    const petalMaterial = new THREE.MeshStandardMaterial({
      color: node.color,
      roughness: 0.4,
      metalness: 0.1,
      side: THREE.DoubleSide
    })
    const petal = new THREE.Mesh(petalGeometry, petalMaterial)
    const angle = (i / petalCount) * Math.PI * 2
    petal.rotation.y = angle
    petal.rotation.x = Math.PI / 6
    petal.position.y = node.length * 0.2
    petal.castShadow = true
    group.add(petal)
  }

  const diskGeometry = new THREE.CylinderGeometry(
    node.scale * 0.4,
    node.scale * 0.5,
    node.scale * 0.15,
    24
  )
  const diskMaterial = new THREE.MeshStandardMaterial({
    color: 0x5d4037,
    roughness: 0.8,
    metalness: 0.05
  })
  const disk = new THREE.Mesh(diskGeometry, diskMaterial)
  disk.position.y = node.length * 0.25
  disk.castShadow = true
  group.add(disk)

  return group
}

function createThornMesh(node: PlantNode): THREE.Object3D {
  const group = new THREE.Group()
  const geometry = new THREE.ConeGeometry(node.thickness, node.length, 4)
  const material = new THREE.MeshStandardMaterial({
    color: node.color,
    roughness: 0.3,
    metalness: 0.6
  })
  const mesh = new THREE.Mesh(geometry, material)
  mesh.castShadow = true
  group.add(mesh)
  return group
}

function easeOutElastic(t: number): number {
  if (t === 0 || t === 1) return t
  const p = 0.3
  return Math.pow(2, -10 * t) * Math.sin((t - p / 4) * (2 * Math.PI) / p) + 1
}

function updateNodeMesh(
  mesh: THREE.Object3D,
  node: PlantNode,
  plantData: PlantData
): void {
  mesh.visible = true
  const progress = easeOutElastic(Math.min(1, node.growthProgress))

  mesh.position.copy(node.position)

  mesh.rotation.set(node.rotation.x, node.rotation.y, node.rotation.z)

  if (node.type === 'stem' || node.type === 'root') {
    const scaleY = Math.max(0.001, progress)
    const scaleXZ = 0.2 + 0.8 * progress
    mesh.scale.set(scaleXZ, scaleY, scaleXZ)

    mesh.userData.basePosition = mesh.userData.basePosition || node.position.clone()
    const bounce = Math.sin(node.currentAge * 0.3) * 0.003 * progress * (1 - progress)
    mesh.position.y = mesh.userData.basePosition.y + bounce

    if (mesh.children.length > 0) {
      const child = mesh.children[0] as THREE.Mesh
      if (child.material instanceof THREE.MeshStandardMaterial) {
        child.material.color.copy(node.color)
      }
    }
  } else if (node.type === 'leaf') {
    const leafProgress = Math.min(1, progress * 1.3)
    mesh.scale.setScalar(0.1 + 0.9 * leafProgress)
    
    const rotationZ = node.rotation.z + (1 - leafProgress) * 0.8
    mesh.rotation.z = rotationZ
    
    const unfoldRotation = (1 - leafProgress) * Math.PI * 0.6
    mesh.rotation.x = node.rotation.x - unfoldRotation

    if (mesh.children.length > 0) {
      const leafMesh = mesh.children[0] as THREE.Mesh
      if (leafMesh.material instanceof THREE.MeshStandardMaterial) {
        leafMesh.material.color.copy(node.color)
        leafMesh.material.opacity = 0.1 + 0.9 * leafProgress
      }
    }
  } else if (node.type === 'flower') {
    mesh.scale.setScalar(0.05 + 0.95 * easeOutElastic(Math.min(1, progress * 1.5)))
  } else if (node.type === 'thorn') {
    mesh.scale.setScalar(0.1 + 0.9 * progress)
  } else if (node.type === 'seed') {
    const swellProgress = Math.min(1, progress * 3)
    mesh.scale.setScalar(1 + swellProgress * 0.5)
    mesh.position.y = node.position.y - swellProgress * 0.05
  }
}

function disposeMesh(object: THREE.Object3D): void {
  object.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.geometry.dispose()
      if (Array.isArray(child.material)) {
        child.material.forEach((m) => m.dispose())
      } else {
        child.material.dispose()
      }
    }
  })
}

export function clearPlantMeshes(sceneState: SceneState): void {
  sceneState.nodeMeshes.forEach((mesh) => {
    sceneState.plantGroup.remove(mesh)
    disposeMesh(mesh)
  })
  sceneState.nodeMeshes.clear()

  if (sceneState.seedMesh) {
    sceneState.scene.remove(sceneState.seedMesh)
    disposeMesh(sceneState.seedMesh)
    sceneState.seedMesh = undefined
  }
}

export function setSoilSectionView(sceneState: SceneState, visible: boolean): void {
  if (sceneState.soilSectionMesh) {
    const material = sceneState.soilSectionMesh.material as THREE.MeshStandardMaterial
    const targetOpacity = visible ? 0.75 : 0
    animateOpacity(material, targetOpacity)

    sceneState.soilMesh.visible = !visible
  }

  sceneState.nodeMeshes.forEach((mesh, id) => {
    const node = [...sceneState.nodeMeshes.keys()].find((k) => k === id)
    if (node) {
      const nodeType = id
      mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          if (Array.isArray(child.material)) {
            child.material.forEach((m) => {
              if (m instanceof THREE.MeshStandardMaterial) {
                m.colorWrite = true
              }
            })
          }
        }
      })
    }
  })
}

function animateOpacity(material: THREE.MeshStandardMaterial, targetOpacity: number): void {
  const startOpacity = material.opacity
  const startTime = performance.now()
  const duration = 500

  function animate() {
    const t = Math.min(1, (performance.now() - startTime) / duration)
    material.opacity = startOpacity + (targetOpacity - startOpacity) * t
    material.transparent = material.opacity < 1
    if (t < 1) {
      requestAnimationFrame(animate)
    }
  }
  animate()
}

export function updateLighting(
  sceneState: SceneState,
  params: EnvironmentParams
): void {
  const lightFactor = params.light / 100
  sceneState.sunLight.intensity = 0.4 + lightFactor * 1.5
  sceneState.ambientLight.intensity = 0.2 + lightFactor * 0.3
  sceneState.hemisphereLight.intensity = 0.2 + lightFactor * 0.5

  const warmLight = new THREE.Color(0xfff5e0)
  const coolLight = new THREE.Color(0xb3d4ff)
  const sunColor = coolLight.clone().lerp(warmLight, lightFactor)
  sceneState.sunLight.color.copy(sunColor)

  const sunAngle = Math.PI * 0.15 + (1 - lightFactor) * Math.PI * 0.5
  sceneState.sunLight.position.set(
    Math.cos(sunAngle) * 6,
    3 + lightFactor * 7,
    Math.sin(sunAngle) * 4
  )

  const soilMat = sceneState.soilMesh.material as THREE.MeshStandardMaterial
  const dryColor = new THREE.Color(0x6b4423)
  const wetColor = new THREE.Color(0x3d2215)
  const waterFactor = params.water / 100
  soilMat.color.copy(dryColor).lerp(wetColor, waterFactor * 0.6)
}

export function initCameraState(): CameraState {
  return {
    target: new THREE.Vector3(0, 0.8, 0),
    spherical: {
      radius: 6,
      theta: Math.PI / 4,
      phi: Math.PI / 3
    },
    panOffset: new THREE.Vector3()
  }
}

export function updateCamera(
  state: SceneState,
  cameraState: CameraState,
  deltaTime: number
): void {
  cameraState.spherical.radius = Math.max(
    CAMERA_MIN_RADIUS,
    Math.min(CAMERA_MAX_RADIUS, cameraState.spherical.radius)
  )
  cameraState.spherical.phi = Math.max(
    CAMERA_MIN_PHI,
    Math.min(CAMERA_MAX_PHI, cameraState.spherical.phi)
  )

  const target = cameraState.target.clone().add(cameraState.panOffset)

  const x =
    target.x +
    cameraState.spherical.radius *
      Math.sin(cameraState.spherical.phi) *
      Math.cos(cameraState.spherical.theta)
  const y = target.y + cameraState.spherical.radius * Math.cos(cameraState.spherical.phi)
  const z =
    target.z +
    cameraState.spherical.radius *
      Math.sin(cameraState.spherical.phi) *
      Math.sin(cameraState.spherical.theta)

  state.camera.position.lerp(new THREE.Vector3(x, y, z), 0.15)
  state.camera.lookAt(target)
}

export function handleCameraInput(
  cameraState: CameraState,
  input: {
    rotateDelta?: { x: number; y: number }
    zoomDelta?: number
    panDelta?: { x: number; y: number }
  }
): void {
  if (input.rotateDelta) {
    cameraState.spherical.theta -= input.rotateDelta.x * 0.005
    cameraState.spherical.phi -= input.rotateDelta.y * 0.005
  }
  if (input.zoomDelta) {
    cameraState.spherical.radius += input.zoomDelta * cameraState.spherical.radius * 0.001
  }
  if (input.panDelta) {
    const panVec = new THREE.Vector3(
      -input.panDelta.x * PAN_SPEED,
      input.panDelta.y * PAN_SPEED,
      0
    )
    const rotMatrix = new THREE.Matrix4().makeRotationY(-cameraState.spherical.theta)
    panVec.applyMatrix4(rotMatrix)
    cameraState.panOffset.add(panVec)
  }
}

export function handleWASDPan(
  cameraState: CameraState,
  keys: Set<string>,
  deltaTime: number
): void {
  const speed = 2 * deltaTime
  const forward = new THREE.Vector3(
    -Math.sin(cameraState.spherical.theta),
    0,
    -Math.cos(cameraState.spherical.theta)
  )
  const right = new THREE.Vector3(
    Math.cos(cameraState.spherical.theta),
    0,
    -Math.sin(cameraState.spherical.theta)
  )

  if (keys.has('w') || keys.has('W')) {
    cameraState.panOffset.add(forward.clone().multiplyScalar(speed))
  }
  if (keys.has('s') || keys.has('S')) {
    cameraState.panOffset.add(forward.clone().multiplyScalar(-speed))
  }
  if (keys.has('a') || keys.has('A')) {
    cameraState.panOffset.add(right.clone().multiplyScalar(-speed))
  }
  if (keys.has('d') || keys.has('D')) {
    cameraState.panOffset.add(right.clone().multiplyScalar(speed))
  }
}

export function resizeRenderer(
  state: SceneState,
  width: number,
  height: number
): void {
  state.camera.aspect = width / height
  state.camera.updateProjectionMatrix()
  state.renderer.setSize(width, height)
}

export function takePhoto(state: SceneState): void {
  captureSnapshot(state.renderer, state.scene, state.camera)
}

export function disposeScene(state: SceneState): void {
  clearPlantMeshes(state)

  if (state.supportTrellis) {
    state.scene.remove(state.supportTrellis)
    disposeMesh(state.supportTrellis)
  }

  state.dustParticles.forEach((p) => {
    state.scene.remove(p)
    p.geometry.dispose()
    ;(p.material as THREE.Material).dispose()
  })
  state.dustParticles = []

  state.renderer.dispose()
  if (state.renderer.domElement.parentElement) {
    state.renderer.domElement.parentElement.removeChild(state.renderer.domElement)
  }
}
