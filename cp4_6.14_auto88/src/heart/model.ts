import * as THREE from 'three'
import { HeartMaterials, createHeartMaterials, updateAllMaterials } from './material'

const SHRINK_AMOUNT = 0.05
const CHAMBER_THICKNESS = 0.05
const SEGMENTS_PER_CHAMBER = 10

export interface HeartModel {
  group: THREE.Group
  materials: HeartMaterials
  update: (activationArray: Float32Array, deltaTime: number, currentTime: number) => void
  setConductionVisible: (visible: boolean) => void
  resize: () => void
}

interface ChamberData {
  mesh: THREE.Mesh
  originalPositions: Float32Array
  originalNormals: Float32Array
  activationStartIdx: number
  isAtrium: boolean
}

export function createHeartModel(): HeartModel {
  const group = new THREE.Group()
  const materials = createHeartMaterials()

  const chambers: ChamberData[] = []
  const valveMeshes: THREE.Mesh[] = []
  let activationTimestamps: number[] = new Array(40).fill(0)
  let lastActivationValues: Float32Array = new Float32Array(40)
  let conductionVisible = true

  function createChamberGeometry(
    shape: THREE.Shape,
    depth: number,
    radialSegments: number
  ): THREE.BufferGeometry {
    const extrudeSettings = {
      depth: depth,
      bevelEnabled: true,
      bevelThickness: CHAMBER_THICKNESS * 0.5,
      bevelSize: CHAMBER_THICKNESS * 0.3,
      bevelSegments: 2,
      curveSegments: radialSegments,
    }
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)
    geometry.computeVertexNormals()
    return geometry
  }

  function createAtriumShape(scale: number = 1): THREE.Shape {
    const shape = new THREE.Shape()
    const points: THREE.Vector2[] = []
    const segments = 16
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const r = 0.4 * scale
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r * 0.7
      points.push(new THREE.Vector2(x, y))
    }
    
    shape.setFromPoints(points)
    return shape
  }

  function createVentricleShape(scale: number = 1): THREE.Shape {
    const shape = new THREE.Shape()
    const points: THREE.Vector2[] = []
    const segments = 20
    
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      const r = 0.5 * scale * (1 - 0.3 * Math.sin(angle * 0.5))
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r * 1.3
      points.push(new THREE.Vector2(x, y))
    }
    
    shape.setFromPoints(points)
    return shape
  }

  const raShape = createAtriumShape(1.0)
  const raGeometry = createChamberGeometry(raShape, 0.3, 16)
  const rightAtrium = new THREE.Mesh(raGeometry, materials.rightAtrium)
  rightAtrium.position.set(-0.5, 0.4, 0)
  rightAtrium.rotation.z = Math.PI * 0.1
  group.add(rightAtrium)
  chambers.push({
    mesh: rightAtrium,
    originalPositions: new Float32Array(raGeometry.attributes.position.array),
    originalNormals: new Float32Array(raGeometry.attributes.normal.array),
    activationStartIdx: 0,
    isAtrium: true,
  })

  const laShape = createAtriumShape(0.9)
  const laGeometry = createChamberGeometry(laShape, 0.35, 16)
  const leftAtrium = new THREE.Mesh(laGeometry, materials.leftAtrium)
  leftAtrium.position.set(0.5, 0.45, -0.1)
  leftAtrium.rotation.z = -Math.PI * 0.1
  group.add(leftAtrium)
  chambers.push({
    mesh: leftAtrium,
    originalPositions: new Float32Array(laGeometry.attributes.position.array),
    originalNormals: new Float32Array(laGeometry.attributes.normal.array),
    activationStartIdx: 10,
    isAtrium: true,
  })

  const rvShape = createVentricleShape(0.95)
  const rvGeometry = createChamberGeometry(rvShape, 0.45, 20)
  const rightVentricle = new THREE.Mesh(rvGeometry, materials.rightVentricle)
  rightVentricle.position.set(-0.4, -0.45, 0.05)
  rightVentricle.rotation.z = Math.PI * 0.05
  group.add(rightVentricle)
  chambers.push({
    mesh: rightVentricle,
    originalPositions: new Float32Array(rvGeometry.attributes.position.array),
    originalNormals: new Float32Array(rvGeometry.attributes.normal.array),
    activationStartIdx: 20,
    isAtrium: false,
  })

  const lvShape = createVentricleShape(1.05)
  const lvGeometry = createChamberGeometry(lvShape, 0.55, 20)
  const leftVentricle = new THREE.Mesh(lvGeometry, materials.leftVentricle)
  leftVentricle.position.set(0.45, -0.5, -0.1)
  leftVentricle.rotation.z = -Math.PI * 0.05
  group.add(leftVentricle)
  chambers.push({
    mesh: leftVentricle,
    originalPositions: new Float32Array(lvGeometry.attributes.position.array),
    originalNormals: new Float32Array(lvGeometry.attributes.normal.array),
    activationStartIdx: 30,
    isAtrium: false,
  })

  function createValveGeometry(): THREE.BufferGeometry {
    const geometry = new THREE.BufferGeometry()
    const vertices = new Float32Array(9)
    const indices = [0, 1, 2]
    
    const size = 0.25
    vertices[0] = -size / 2
    vertices[1] = 0
    vertices[2] = 0
    
    vertices[3] = size / 2
    vertices[4] = 0
    vertices[5] = 0
    
    vertices[6] = 0
    vertices[7] = size * 0.8
    vertices[8] = 0
    
    geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
    geometry.setIndex(indices)
    geometry.computeVertexNormals()
    
    return geometry
  }

  const tricuspidValve = new THREE.Mesh(createValveGeometry(), materials.valve)
  tricuspidValve.position.set(-0.45, 0.05, 0.15)
  tricuspidValve.rotation.x = Math.PI * 0.3
  group.add(tricuspidValve)
  valveMeshes.push(tricuspidValve)

  const mitralValve = new THREE.Mesh(createValveGeometry(), materials.valve)
  mitralValve.position.set(0.48, 0.1, 0.05)
  mitralValve.rotation.x = Math.PI * 0.3
  mitralValve.rotation.z = Math.PI * 0.1
  group.add(mitralValve)
  valveMeshes.push(mitralValve)

  function getSegmentActivation(
    activationArray: Float32Array,
    startIdx: number,
    segmentIndex: number,
    totalSegments: number
  ): number {
    const idx = startIdx + Math.floor((segmentIndex / totalSegments) * SEGMENTS_PER_CHAMBER)
    return activationArray[Math.min(idx, startIdx + SEGMENTS_PER_CHAMBER - 1)]
  }

  function updateChamberVertices(chamber: ChamberData, activationArray: Float32Array): void {
    const { mesh, originalPositions, originalNormals, activationStartIdx } = chamber
    const geometry = mesh.geometry
    const positionAttr = geometry.attributes.position
    const positions = positionAttr.array as Float32Array
    const vertexCount = positionAttr.count

    for (let i = 0; i < vertexCount; i++) {
      const segIdx = Math.floor((i / vertexCount) * SEGMENTS_PER_CHAMBER)
      const activation = getSegmentActivation(activationArray, activationStartIdx, segIdx, SEGMENTS_PER_CHAMBER)
      const shrinkFactor = activation * SHRINK_AMOUNT

      const px = originalPositions[i * 3]
      const py = originalPositions[i * 3 + 1]
      const pz = originalPositions[i * 3 + 2]

      const nx = originalNormals[i * 3]
      const ny = originalNormals[i * 3 + 1]
      const nz = originalNormals[i * 3 + 2]

      const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1
      positions[i * 3] = px - (nx / len) * shrinkFactor
      positions[i * 3 + 1] = py - (ny / len) * shrinkFactor
      positions[i * 3 + 2] = pz - (nz / len) * shrinkFactor
    }

    positionAttr.needsUpdate = true
    geometry.computeVertexNormals()
  }

  function updateValves(activationArray: Float32Array): void {
    const ventricleActivation = Math.max(
      activationArray[20],
      activationArray[25],
      activationArray[30],
      activationArray[35]
    )

    const targetAngle = ventricleActivation * (Math.PI / 4)

    valveMeshes.forEach((valve) => {
      const currentAngle = valve.rotation.x
      const newAngle = currentAngle + (targetAngle - (Math.PI * 0.3)) * 0.1
      valve.rotation.x = Math.PI * 0.3 + newAngle * 0.5
    })
  }

  function update(
    activationArray: Float32Array,
    _deltaTime: number,
    currentTime: number
  ): void {
    for (let i = 0; i < 40; i++) {
      if (activationArray[i] > lastActivationValues[i] && activationArray[i] > 0.1) {
        activationTimestamps[i] = currentTime
      }
      lastActivationValues[i] = activationArray[i]
    }

    chambers.forEach((chamber) => {
      updateChamberVertices(chamber, activationArray)
    })

    updateValves(activationArray)

    if (conductionVisible) {
      updateAllMaterials(materials, activationArray, activationTimestamps, currentTime)
    }
  }

  function setConductionVisible(visible: boolean): void {
    conductionVisible = visible
  }

  function resize(): void {
  }

  group.rotation.y = Math.PI * 0.25

  return {
    group,
    materials,
    update,
    setConductionVisible,
    resize,
  }
}
