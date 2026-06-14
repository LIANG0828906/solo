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
 *   - 通过 MeshStandardMaterial.color / uniform 提交材质颜色
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
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
}

function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}

function buildLatheProfile(
  kind: 'ra' | 'la' | 'rv' | 'lv'
): THREE.Vector2[] {
  const points: THREE.Vector2[] = []
  const steps = 21

  if (kind === 'ra') {
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const y = 0.55 - t * 0.45
      const bulge = Math.sin(t * Math.PI) * 0.22
      const x = 0.18 + bulge + (1 - t) * 0.08
      points.push(new THREE.Vector2(x, y))
    }
  } else if (kind === 'la') {
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const y = 0.58 - t * 0.48
      const bulge = Math.sin(t * Math.PI) * 0.20
      const x = 0.16 + bulge + (1 - t) * 0.06
      points.push(new THREE.Vector2(x, y))
    }
  } else if (kind === 'rv') {
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const y = 0.1 - t * 0.85
      const taper = 1 - easeOutCubic(t) * 0.65
      const bulge = Math.sin(t * Math.PI * 0.9) * 0.12
      const x = (0.16 + bulge) * taper + 0.06
      points.push(new THREE.Vector2(x, y))
    }
  } else {
    for (let i = 0; i < steps; i++) {
      const t = i / (steps - 1)
      const y = 0.12 - t * 0.95
      const taper = 1 - easeOutCubic(t) * 0.7
      const bulge = Math.sin(t * Math.PI * 0.9) * 0.10
      const x = (0.20 + bulge) * taper + 0.08
      points.push(new THREE.Vector2(x, y))
    }
  }
  return points
}

function createChamberGeometry(
  profile: THREE.Vector2[],
  segments: number
): THREE.BufferGeometry {
  const outer = new THREE.LatheGeometry(profile, segments)
  outer.computeVertexNormals()

  const innerProfile = profile.map((p) => {
    const nx = Math.max(0.001, p.x - CHAMBER_THICKNESS)
    return new THREE.Vector2(nx, p.y)
  })
  const inner = new THREE.LatheGeometry(innerProfile, segments)
  inner.computeVertexNormals()
  inner.rotateY(Math.PI)
  inner.scale(-1, 1, 1)

  const merged = mergeGeometries([outer, inner])
  merged.computeVertexNormals()
  return merged
}

function mergeGeometries(geometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const result = new THREE.BufferGeometry()
  const positions: number[] = []
  const normals: number[] = []
  const indices: number[] = []
  let indexOffset = 0

  for (const geom of geometries) {
    const pos = geom.attributes.position.array as Float32Array
    const nor = geom.attributes.normal.array as Float32Array
    const idx = geom.getIndex()

    for (let i = 0; i < pos.length; i++) positions.push(pos[i])
    for (let i = 0; i < nor.length; i++) normals.push(nor[i])

    if (idx) {
      const arr = idx.array as Uint16Array | Uint32Array
      for (let i = 0; i < arr.length; i++) indices.push(arr[i] + indexOffset)
    } else {
      const count = geom.attributes.position.count
      for (let i = 0; i < count; i++) indices.push(i + indexOffset)
    }
    indexOffset += geom.attributes.position.count
  }

  result.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  result.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  result.setIndex(indices)
  return result
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
  const activationTimestamps: number[] = new Array(40).fill(0)
  const lastActivationValues: Float32Array = new Float32Array(40)
  const colorProgress: Float32Array = new Float32Array(4)
  let conductionVisible = true

  const LATHE_SEGMENTS = 25

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
    group.add(mesh)

    chambers.push({
      mesh,
      originalPositions: new Float32Array(geometry.attributes.position.array),
      originalNormals: new Float32Array(geometry.attributes.normal.array),
      activationStartIdx,
      isAtrium,
      segmentMap: buildSegmentMap(geometry.attributes.position.count),
    })
  }

  addChamber(
    'ra',
    materials.rightAtrium,
    0,
    true,
    new THREE.Vector3(-0.48, 0.15, 0.05),
    new THREE.Euler(0, 0, Math.PI * 0.08)
  )

  addChamber(
    'la',
    materials.leftAtrium,
    10,
    true,
    new THREE.Vector3(0.48, 0.18, -0.08),
    new THREE.Euler(0, 0, -Math.PI * 0.08)
  )

  addChamber(
    'rv',
    materials.rightVentricle,
    20,
    false,
    new THREE.Vector3(-0.38, 0.0, 0.12),
    new THREE.Euler(0, 0, Math.PI * 0.04)
  )

  addChamber(
    'lv',
    materials.leftVentricle,
    30,
    false,
    new THREE.Vector3(0.42, -0.05, -0.05),
    new THREE.Euler(0, 0, -Math.PI * 0.04)
  )

  function addValveLeaflet(
    basePosition: THREE.Vector3,
    restRotation: THREE.Euler,
    offsetAngle: number
  ): void {
    const mesh = new THREE