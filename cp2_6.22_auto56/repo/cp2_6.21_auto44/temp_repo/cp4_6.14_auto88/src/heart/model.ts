/*
 * ============================================================
 * 模块调用关系与数据流向
 * ============================================================
 *
 * 数据流入：
 *   - 接收 simulation.ts 通过 Zustand store (useHeartStore) 传来的
 *     长度为 40 的 Float32Array 激活数组 activationArray
 *   - 每个索引对应一个激活段：
 *       RA (右心房):  0-9
 *       LA (左心房): 10-19
 *       RV (右心室): 20-29
 *       LV (左心室): 30-39
 *
 * 内部处理：
 *   1. 根据每个顶点所在腔室的位置映射到对应激活段的激活值
 *   2. 沿顶点法线方向向内收缩腔室几何（收缩量 0.05 * activation）
 *   3. 平滑插值更新瓣膜角度（舒张 0° → 收缩 45°）
 *   4. 更新材质颜色（深红色 ↔ 亮黄色 ease-in-out 过渡）
 *   5. 设置 BufferAttribute.needsUpdate = true 提交给 GPU
 *
 * 数据流出：
 *   - 通过 Three.js BufferAttribute (position, normal) 提交顶点数据给渲染器
 *   - 通过 MeshStandardMaterial.color 提交材质颜色给渲染器
 *
 * 调用方：
 *   - scene.ts 在其 requestAnimationFrame 动画循环中调用 update()
 * ============================================================
 */

import * as THREE from 'three'
import { HeartMaterials, createHeartMaterials } from './material'

const SHRINK_AMOUNT = 0.05
const CHAMBER_THICKNESS = 0.05
const SEGMENTS_PER_CHAMBER = 10
const VALVE_CLOSED_ANGLE = Math.PI / 4
const VALVE_OPEN_ANGLE = 0
const VALVE_SMOOTH = 0.12

const REST_COLOR_VENTRICLE = new THREE.Color('#b91c1c')
const REST_COLOR_ATRIUM = new THREE.Color('#ef4444')
const ACTIVATED_COLOR = new THREE.Color('#fcd34d')
const ACTIVATE_DURATION = 0.3
const DECAY_DURATION = 0.5

export interface HeartModel {
  group: THREE.Group
  materials: HeartMaterials
  update: (activationArray: Float32Array, deltaTime: number, currentTime: number) => void
  setConductionVisible: (visible: boolean) => void
  resize: () => void
  getTotalVertexCount: () => number
}

interface ChamberData {
  mesh: THREE.Mesh
  originalPositions: Float32Array
  originalNormals: Float32Array
  activationStartIdx: number
  isAtrium: boolean
  segmentMap: Uint8Array
}

interface ValveLeafData {
  mesh: THREE.Mesh
  targetAngle: number
  currentAngle: number
  restRotation: THREE.Euler
  hingeAxis: THREE.Vector3
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function buildLatheProfile(kind: 'ra' | 'la' | 'rv' | 'lv'): THREE.Vector2[] {
  const points: THREE.Vector2[] = []
  const steps = 20

  if (kind === 'ra') {
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const y = 0.22 - t * 0.32
      const bulge = Math.sin(t * Math.PI) * 0.15
      const x = 0.08 + bulge + (1 - t) * 0.06
      points.push(new THREE.Vector2(x, y))
    }
  } else if (kind === 'la') {
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const y = 0.24 - t * 0.34
      const bulge = Math.sin(t * Math.PI) * 0.14
      const x = 0.07 + bulge + (1 - t) * 0.05
      points.push(new THREE.Vector2(x, y))
    }
  } else if (kind === 'rv') {
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const y = 0.0 - t * 0.55
      const taper = 1 - easeOutCubic(t) * 0.55
      const bulge = Math.sin(t * Math.PI * 0.85) * 0.08
      const x = (0.09 + bulge) * taper + 0.05
      points.push(new THREE.Vector2(x, y))
    }
  } else {
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const y = 0.02 - t * 0.65
      const taper = 1 - easeOutCubic(t) * 0.6
      const bulge = Math.sin(t * Math.PI * 0.85) * 0.07
      const x = (0.11 + bulge) * taper + 0.06
      points.push(new THREE.Vector2(x, y))
    }
  }
  return points
}

function createChamberGeometry(profile: THREE.Vector2[], segments: number): THREE.BufferGeometry {
  const outerGeom = new THREE.LatheGeometry(profile, segments)
  
  const innerProfile = profile.map((p, i) => {
    let nx = p.x - CHAMBER_THICKNESS
    if (i === 0 || i === profile.length - 1) {
      nx = Math.max(0.005, p.x - CHAMBER_THICKNESS * 0.5)
    }
    return new THREE.Vector2(Math.max(0.005, nx), p.y)
  })
  
  const innerGeom = new THREE.LatheGeometry(innerProfile, segments)
  
  const outerPos = outerGeom.attributes.position.array as Float32Array
  const outerNor = outerGeom.attributes.normal.array as Float32Array
  const outerIdx = outerGeom.getIndex()?.array as Uint32Array | Uint16Array
  
  const innerPos = innerGeom.attributes.position.array as Float32Array
  const innerNor = innerGeom.attributes.normal.array as Float32Array
  const innerIdx = innerGeom.getIndex()?.array as Uint32Array | Uint16Array
  
  const vertexCount = outerGeom.attributes.position.count + innerGeom.attributes.position.count
  const positions = new Float32Array(vertexCount * 3)
  const normals = new Float32Array(vertexCount * 3)
  
  positions.set(outerPos, 0)
  normals.set(outerNor, 0)
  positions.set(innerPos, outerPos.length)
  for (let i = 0; i < innerNor.length; i++) {
    normals[outerNor.length + i] = -innerNor[i]
  }
  
  const outerIndexCount = outerIdx ? outerIdx.length : outerGeom.attributes.position.count
  const innerIndexCount = innerIdx ? innerIdx.length : innerGeom.attributes.position.count
  const totalIndices = outerIndexCount + innerIndexCount
  const indices = new Uint32Array(totalIndices)
  
  if (outerIdx) {
    for (let i = 0; i < outerIdx.length; i++) {
      indices[i] = outerIdx[i]
    }
  }
  
  if (innerIdx) {
    const offset = outerGeom.attributes.position.count
    for (let i = 0; i < innerIdx.length; i++) {
      indices[outerIndexCount + innerIdx.length - 1 - i] = offset + innerIdx[i]
    }
  }
  
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.BufferAttribute(normals, 3))
  geometry.setIndex(new THREE.BufferAttribute(indices, 1))
  geometry.computeVertexNormals()
  
  return geometry
}

function createValveLeafletGeometry(): THREE.BufferGeometry {
  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array(9)
  const indices = [0, 1, 2]

  const size = 0.22
  vertices[0] = -size / 2
  vertices[1] = 0
  vertices[2] = 0

  vertices[3] = size / 2
  vertices[4] = 0
  vertices[5] = 0

  vertices[6] = 0
  vertices[7] = size * 0.85
  vertices[8] = 0

  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
  geometry.setIndex(indices)
  geometry.computeVertexNormals()
  return geometry
}

function buildSegmentMap(vertexCount: number): Uint8Array {
  const map = new Uint8Array(vertexCount)
  for (let i = 0; i < vertexCount; i++) {
    const t = i / Math.max(1, vertexCount - 1)
    map[i] = Math.min(SEGMENTS_PER_CHAMBER - 1, Math.floor(t * SEGMENTS_PER_CHAMBER))
  }
  return map
}

function updateMaterialColor(
  material: THREE.MeshStandardMaterial,
  baseColor: THREE.Color,
  transitionProgress: number
): void {
  const t = Math.max(0, Math.min(1, transitionProgress))
  const r = baseColor.r + (ACTIVATED_COLOR.r - baseColor.r) * t
  const g = baseColor.g + (ACTIVATED_COLOR.g - baseColor.g) * t
  const b = baseColor.b + (ACTIVATED_COLOR.b - baseColor.b) * t
  material.color.setRGB(r, g, b)
}

export function createHeartModel(): HeartModel {
  const group = new THREE.Group()
  const materials = createHeartMaterials()

  const chambers: ChamberData[] = []
  const valveLeaflets: ValveLeafData[] = []
  const activationTimestamps: number[] = new Array(40).fill(-10)
  const lastActivationValues: Float32Array = new Float32Array(40)
  const colorProgress: Float32Array = new Float32Array(4)
  let conductionVisible = true
  let totalVertexCount = 0

  const LATHE_SEGMENTS = 24

  function addChamber(
    kind: 'ra' | 'la' | 'rv' | 'lv',
    material: THREE.MeshStandardMaterial,
    activationStartIdx: number,
    isAtrium: boolean,
    position: THREE.Vector3,
    rotation: THREE.Euler
  ): void {
    const profile = buildLatheProfile(kind)
    const geometry = createChamberGeometry(profile, LATHE_SEGMENTS)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.position.copy(position)
    mesh.rotation.copy(rotation)
    mesh.castShadow = true
    mesh.receiveShadow = true
    group.add(mesh)

    const vertexCount = geometry.attributes.position.count
    totalVertexCount += vertexCount

    chambers.push({
      mesh,
      originalPositions: new Float32Array(geometry.attributes.position.array),
      originalNormals: new Float32Array(geometry.attributes.normal.array),
      activationStartIdx,
      isAtrium,
      segmentMap: buildSegmentMap(vertexCount),
    })
  }

  addChamber(
    'ra',
    materials.rightAtrium,
    0,
    true,
    new THREE.Vector3(-0.22, 0.12, 0.08),
    new THREE.Euler(0, 0.3, Math.PI * 0.12)
  )

  addChamber(
    'la',
    materials.leftAtrium,
    10,
    true,
    new THREE.Vector3(0.24, 0.14, -0.06),
    new THREE.Euler(0, -0.3 + Math.PI, -Math.PI * 0.12)
  )

  addChamber(
    'rv',
    materials.rightVentricle,
    20,
    false,
    new THREE.Vector3(-0.18, -0.08, 0.12),
    new THREE.Euler(0, 0.2, Math.PI * 0.06)
  )

  addChamber(
    'lv',
    materials.leftVentricle,
    30,
    false,
    new THREE.Vector3(0.2, -0.12, -0.04),
    new THREE.Euler(0, -0.2 + Math.PI, -Math.PI * 0.06)
  )

  function addValveLeaflet(
    basePosition: THREE.Vector3,
    restRotation: THREE.Euler,
    hingeAxis: THREE.Vector3
  ): void {
    const geometry = createValveLeafletGeometry()
    const mesh = new THREE.Mesh(geometry, materials.valve)
    mesh.position.copy(basePosition)
    mesh.rotation.copy(restRotation)
    group.add(mesh)

    valveLeaflets.push({
      mesh,
      targetAngle: VALVE_OPEN_ANGLE,
      currentAngle: VALVE_OPEN_ANGLE,
      restRotation: restRotation.clone(),
      hingeAxis: hingeAxis.clone(),
    })
  }

  const tricuspidPos = new THREE.Vector3(-0.42, -0.02, 0.18)
  addValveLeaflet(
    tricuspidPos.clone().add(new THREE.Vector3(-0.08, 0, 0)),
    new THREE.Euler(Math.PI * 0.15, 0, Math.PI * 0.2),
    new THREE.Vector3(0, 1, 0.3)
  )
  addValveLeaflet(
    tricuspidPos.clone().add(new THREE.Vector3(0.08, 0, 0.02)),
    new THREE.Euler(Math.PI * 0.15, 0, -Math.PI * 0.25),
    new THREE.Vector3(0, 1, -0.3)
  )
  addValveLeaflet(
    tricuspidPos.clone().add(new THREE.Vector3(0, 0, 0.08)),
    new THREE.Euler(Math.PI * 0.15, Math.PI * 0.5, 0),
    new THREE.Vector3(0.5, 1, 0)
  )

  const mitralPos = new THREE.Vector3(0.45, 0.02, 0.02)
  addValveLeaflet(
    mitralPos.clone().add(new THREE.Vector3(0.08, 0, 0)),
    new THREE.Euler(-Math.PI * 0.15, Math.PI, -Math.PI * 0.2),
    new THREE.Vector3(0, 1, 0.3)
  )
  addValveLeaflet(
    mitralPos.clone().add(new THREE.Vector3(-0.08, 0, 0.02)),
    new THREE.Euler(-Math.PI * 0.15, Math.PI, Math.PI * 0.25),
    new THREE.Vector3(0, 1, -0.3)
  )
  addValveLeaflet(
    mitralPos.clone().add(new THREE.Vector3(0, 0, 0.08)),
    new THREE.Euler(-Math.PI * 0.15, -Math.PI * 0.5, 0),
    new THREE.Vector3(-0.5, 1, 0)
  )

  function getSegmentActivation(
    activationArray: Float32Array,
    startIdx: number,
    segIdx: number
  ): number {
    const arrIdx = startIdx + segIdx
    if (arrIdx < 0 || arrIdx >= activationArray.length) return 0
    return activationArray[arrIdx]
  }

  function updateChamberVertices(chamber: ChamberData, activationArray: Float32Array): void {
    const { mesh, originalPositions, originalNormals, activationStartIdx, segmentMap } = chamber
    const geometry = mesh.geometry
    const positionAttr = geometry.attributes.position
    const normalAttr = geometry.attributes.normal
    const positions = positionAttr.array as Float32Array
    const normals = normalAttr.array as Float32Array
    const vertexCount = positionAttr.count

    for (let i = 0; i < vertexCount; i++) {
      const segIdx = segmentMap[i]
      const activation = getSegmentActivation(activationArray, activationStartIdx, segIdx)
      const shrinkFactor = activation * SHRINK_AMOUNT

      const px = originalPositions[i * 3]
      const py = originalPositions[i * 3 + 1]
      const pz = originalPositions[i * 3 + 2]

      const nx = originalNormals[i * 3]
      const ny = originalNormals[i * 3 + 1]
      const nz = originalNormals[i * 3 + 2]

      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1

      positions[i * 3] = px - (nx / nLen) * shrinkFactor
      positions[i * 3 + 1] = py - (ny / nLen) * shrinkFactor
      positions[i * 3 + 2] = pz - (nz / nLen) * shrinkFactor

      normals[i * 3] = nx / nLen
      normals[i * 3 + 1] = ny / nLen
      normals[i * 3 + 2] = nz / nLen
    }

    positionAttr.needsUpdate = true
    normalAttr.needsUpdate = true
    geometry.computeVertexNormals()
  }

  function updateValves(activationArray: Float32Array, deltaTime: number): void {
    const rvActivation = Math.max(
      activationArray[20],
      activationArray[22],
      activationArray[25]
    )
    const lvActivation = Math.max(
      activationArray[30],
      activationArray[32],
      activationArray[35]
    )

    valveLeaflets.forEach((leaflet, idx) => {
      const isTricuspid = idx < 3
      const activation = isTricuspid ? rvActivation : lvActivation
      
      leaflet.targetAngle = VALVE_OPEN_ANGLE + (VALVE_CLOSED_ANGLE - VALVE_OPEN_ANGLE) * activation

      const angleDiff = leaflet.targetAngle - leaflet.currentAngle
      leaflet.currentAngle += angleDiff * VALVE_SMOOTH

      const quaternion = new THREE.Quaternion()
      quaternion.setFromAxisAngle(leaflet.hingeAxis, leaflet.currentAngle)
      
      const restQuat = new THREE.Quaternion()
      restQuat.setFromEuler(leaflet.restRotation)
      
      leaflet.mesh.quaternion.copy(restQuat)
      leaflet.mesh.quaternion.multiply(quaternion)
    })
  }

  function updateColors(
    activationArray: Float32Array,
    currentTime: number
  ): void {
    if (!conductionVisible) return

    chambers.forEach((chamber, chamberIdx) => {
      const { activationStartIdx, isAtrium, mesh } = chamber
      const baseColor = isAtrium ? REST_COLOR_ATRIUM : REST_COLOR_VENTRICLE

      let maxActivation = 0
      let earliestActivationTime = Infinity

      for (let i = 0; i < SEGMENTS_PER_CHAMBER; i++) {
        const arrIdx = activationStartIdx + i
        const act = activationArray[arrIdx]
        if (act > maxActivation) {
          maxActivation = act
        }
        if (act > 0.01 && activationTimestamps[arrIdx] < earliestActivationTime) {
          earliestActivationTime = activationTimestamps[arrIdx]
        }
      }

      let progress: number

      if (maxActivation > 0.01) {
        const timeSince = currentTime - earliestActivationTime
        if (timeSince < ACTIVATE_DURATION) {
          progress = easeInOut(timeSince / ACTIVATE_DURATION)
        } else {
          progress = maxActivation
        }
      } else {
        const timeSinceDecay = currentTime - activationTimestamps[activationStartIdx + 5]
        if (timeSinceDecay < DECAY_DURATION && colorProgress[chamberIdx] > 0) {
          progress = Math.max(0, colorProgress[chamberIdx] * (1 - timeSinceDecay / DECAY_DURATION))
        } else {
          progress = 0
        }
      }

      progress = Math.max(0, Math.min(1, progress))
      colorProgress[chamberIdx] = progress
      updateMaterialColor(mesh.material as THREE.MeshStandardMaterial, baseColor, progress)
    })
  }

  function trackActivationStarts(activationArray: Float32Array, currentTime: number): void {
    for (let i = 0; i < 40; i++) {
      if (activationArray[i] > 0.05 && lastActivationValues[i] <= 0.05) {
        activationTimestamps[i] = currentTime
      }
      lastActivationValues[i] = activationArray[i]
    }
  }

  function update(
    activationArray: Float32Array,
    deltaTime: number,
    currentTime: number
  ): void {
    trackActivationStarts(activationArray, currentTime)

    chambers.forEach((chamber) => {
      updateChamberVertices(chamber, activationArray)
    })

    updateValves(activationArray, deltaTime)
    updateColors(activationArray, currentTime)
  }

  function setConductionVisible(visible: boolean): void {
    conductionVisible = visible
    if (!visible) {
      chambers.forEach((chamber, idx) => {
        const baseColor = chamber.isAtrium ? REST_COLOR_ATRIUM : REST_COLOR_VENTRICLE
        updateMaterialColor(chamber.mesh.material as THREE.MeshStandardMaterial, baseColor, 0)
        colorProgress[idx] = 0
      })
    }
  }

  function resize(): void {}

  function getTotalVertexCount(): number {
    return totalVertexCount
  }

  group.rotation.y = Math.PI * 0.25

  return {
    group,
    materials,
    update,
    setConductionVisible,
    resize,
    getTotalVertexCount,
  }
}
