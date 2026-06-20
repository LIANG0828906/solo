import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { v4 as uuidv4 } from 'uuid'
import { VoxelData, VoxelizationResult } from './types'

const VOXEL_SIZE = 4
const MAX_VOXELS = 5000

interface RawVertex {
  position: THREE.Vector3
  normal: THREE.Vector3
  uv: THREE.Vector2 | null
  color: THREE.Color | null
}

interface GridCell {
  vertices: RawVertex[]
  hasInterior: boolean
}

function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result ? [
    parseInt(result[1], 16) / 255,
    parseInt(result[2], 16) / 255,
    parseInt(result[3], 16) / 255,
  ] : [1, 1, 1]
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function lerpColor(c1: [number, number, number], c2: [number, number, number], t: number): [number, number, number] {
  return [lerp(c1[0], c2[0], t), lerp(c1[1], c2[1], t), lerp(c1[2], c2[2], t)]
}

export function getVoxelColor(
  voxel: VoxelData, mode: 'original' | 'monochrome' | 'gradient',
  monochromeHex: string, yMin: number, yMax: number
): [number, number, number] {
  if (mode === 'original') {
    return voxel.originalColor
  } else if (mode === 'monochrome') {
    return hexToRgb(monochromeHex)
  } else {
    const gradientStart: [number, number, number] = hexToRgb('#1E3A5F')
    const gradientEnd: [number, number, number] = hexToRgb('#FFB74D')
    const range = yMax - yMin
    const t = range > 0 ? (voxel.worldY - yMin) / range : 0.5
    return lerpColor(gradientStart, gradientEnd, Math.max(0, Math.min(1, t)))
  }
}

function collectMeshData(object: THREE.Object3D): THREE.Mesh[] {
  const meshes: THREE.Mesh[] = []
  object.traverse((child) => {
    if (child as THREE.Mesh) meshes.push(child as THREE.Mesh)
  })
  return meshes
}

function extractRawVertices(mesh: THREE.Mesh): RawVertex[] {
  const geometry = mesh.geometry.clone()
  geometry.computeVertexNormals()

  const positionAttr = geometry.getAttribute('position')
  const normalAttr = geometry.getAttribute('normal')
  const uvAttr = geometry.getAttribute('uv')
  const colorAttr = geometry.getAttribute('color')

  const vertices: RawVertex[] = []
  const vertexColor = (mesh.material as THREE.MeshStandardMaterial)?.color

  for (let i = 0; i < positionAttr.count; i++) {
    const position = new THREE.Vector3(
      positionAttr.getX(i),
      positionAttr.getY(i),
      positionAttr.getZ(i)
    )
    position.applyMatrix4(mesh.matrixWorld)

    const normal = new THREE.Vector3(
      normalAttr?.getX(i) || 0,
      normalAttr?.getY(i) || 1,
      normalAttr?.getZ(i) || 0
    )
    normal.transformDirection(mesh.matrixWorld)

    const uv = uvAttr
      ? new THREE.Vector2(uvAttr.getX(i), uvAttr.getY(i))
      : null

    let color: THREE.Color | null = null
    if (colorAttr) {
      color = new THREE.Color(
        colorAttr.getX(i),
        colorAttr.getY(i),
        colorAttr.getZ(i)
      )
    } else if (vertexColor) {
      color = vertexColor.clone()
    }

    vertices.push({ position, normal, uv, color })
  }

  geometry.dispose()
  return vertices
}

function pointInTriangle(
  px: number, pz: number,
  ax: number, az: number,
  bx: number, bz: number,
  cx: number, cz: number
): boolean {
  const d1 = (px - bx) * (az - bz) - (ax - bx) * (pz - bz)
  const d2 = (px - cx) * (bz - cz) - (bx - cx) * (pz - cz)
  const d3 = (px - ax) * (cz - az) - (cx - ax) * (pz - az)
  const hasNeg = (d1 < 0) || (d2 < 0) || (d3 < 0)
  const hasPos = (d1 > 0) || (d2 > 0) || (d3 > 0)
  return !(hasNeg && hasPos)
}

function getTriangleYIntersectY(
  y: number,
  v0: THREE.Vector3, v1: THREE.Vector3, v2: THREE.Vector3
): boolean {
  const y0 = v0.y, y1 = v1.y, y2 = v2.y
  const minY = Math.min(y0, y1, y2)
  const maxY = Math.max(y0, y1, y2)
  return y >= minY && y <= maxY
}

export async function voxelizeModel(file: File, onProgress?: (progress: number) => void): Promise<VoxelizationResult> {
  return new Promise((resolve, reject) => {
    const fileName = file.name.toLowerCase()
    const reader = new FileReader()

    const processGeometry = (object: THREE.Object3D) => {
      try {
        onProgress?.(0.2)

        const meshes = collectMeshData(object)
        if (meshes.length === 0) {
          reject(new Error('No mesh data found in model'))
          return
        }

        const allTriangles: Array<[THREE.Vector3, THREE.Vector3, THREE.Vector3]> = []
        const allVertices: RawVertex[] = []

        meshes.forEach((mesh) => {
          const geometry = mesh.geometry.clone()
          geometry.computeVertexNormals()
          geometry.computeBoundingBox()

          const positionAttr = geometry.getAttribute('position')
          const indexAttr = geometry.getIndex()

          const rawVertices = extractRawVertices(mesh)
          allVertices.push(...rawVertices)

          if (indexAttr) {
            for (let i = 0; i < indexAttr.count; i += 3) {
              const i0 = indexAttr.getX(i)
              const i1 = indexAttr.getX(i + 1)
              const i2 = indexAttr.getX(i + 2)

              const v0 = new THREE.Vector3(
                positionAttr.getX(i0), positionAttr.getY(i0), positionAttr.getZ(i0)
              ).applyMatrix4(mesh.matrixWorld)
              const v1 = new THREE.Vector3(
                positionAttr.getX(i1), positionAttr.getY(i1), positionAttr.getZ(i1)
              ).applyMatrix4(mesh.matrixWorld)
              const v2 = new THREE.Vector3(
                positionAttr.getX(i2), positionAttr.getY(i2), positionAttr.getZ(i2)
              ).applyMatrix4(mesh.matrixWorld)

              allTriangles.push([v0, v1, v2])
            }
          } else {
            for (let i = 0; i < positionAttr.count; i += 3) {
              const v0 = new THREE.Vector3(
                positionAttr.getX(i), positionAttr.getY(i), positionAttr.getZ(i)
              ).applyMatrix4(mesh.matrixWorld)
              const v1 = new THREE.Vector3(
                positionAttr.getX(i + 1), positionAttr.getY(i + 1), positionAttr.getZ(i + 1)
              ).applyMatrix4(mesh.matrixWorld)
              const v2 = new THREE.Vector3(
                positionAttr.getX(i + 2), positionAttr.getY(i + 2), positionAttr.getZ(i + 2)
              ).applyMatrix4(mesh.matrixWorld)

              allTriangles.push([v0, v1, v2])
            }
          }

          geometry.dispose()
        })

        onProgress?.(0.35)

        const bbox = new THREE.Box3()
        allTriangles.forEach(([v0, v1, v2]) => {
          bbox.expandByPoint(v0)
          bbox.expandByPoint(v1)
          bbox.expandByPoint(v2)
        })

        const minX = Math.floor(bbox.min.x / VOXEL_SIZE) * VOXEL_SIZE
        const maxX = Math.ceil(bbox.max.x / VOXEL_SIZE) * VOXEL_SIZE
        const minY = Math.floor(bbox.min.y / VOXEL_SIZE) * VOXEL_SIZE
        const maxY = Math.ceil(bbox.max.y / VOXEL_SIZE) * VOXEL_SIZE
        const minZ = Math.floor(bbox.min.z / VOXEL_SIZE) * VOXEL_SIZE
        const maxZ = Math.ceil(bbox.max.z / VOXEL_SIZE) * VOXEL_SIZE

        const gridSizeX = Math.ceil((maxX - minX) / VOXEL_SIZE)
        const gridSizeY = Math.ceil((maxY - minY) / VOXEL_SIZE)
        const gridSizeZ = Math.ceil((maxZ - minZ) / VOXEL_SIZE)

        const voxels: VoxelData[] = []
        const spatialHash = new Map<string, GridCell>()

        const getKey = (gx: number, gy: number, gz: number) => `${gx},${gy},${gz}`

        const halfSize = VOXEL_SIZE / 2

        allTriangles.forEach(([v0, v1, v2]) => {
          const triMinX = Math.min(v0.x, v1.x, v2.x)
          const triMaxX = Math.max(v0.x, v1.x, v2.x)
          const triMinY = Math.min(v0.y, v1.y, v2.y)
          const triMaxY = Math.max(v0.y, v1.y, v2.y)
          const triMinZ = Math.min(v0.z, v1.z, v2.z)
          const triMaxZ = Math.max(v0.z, v1.z, v2.z)

          const gxStart = Math.max(0, Math.floor((triMinX - minX) / VOXEL_SIZE))
          const gxEnd = Math.min(gridSizeX - 1, Math.floor((triMaxX - minX) / VOXEL_SIZE))
          const gyStart = Math.max(0, Math.floor((triMinY - minY) / VOXEL_SIZE))
          const gyEnd = Math.min(gridSizeY - 1, Math.floor((triMaxY - minY) / VOXEL_SIZE))
          const gzStart = Math.max(0, Math.floor((triMinZ - minZ) / VOXEL_SIZE))
          const gzEnd = Math.min(gridSizeZ - 1, Math.floor((triMaxZ - minZ) / VOXEL_SIZE))

          for (let gx = gxStart; gx <= gxEnd; gx++) {
            for (let gy = gyStart; gy <= gyEnd; gy++) {
              for (let gz = gzStart; gz <= gzEnd; gz++) {
                const key = getKey(gx, gy, gz)
                if (!spatialHash.has(key)) {
                  spatialHash.set(key, { vertices: [], hasInterior: false })
                }
              }
            }
          }
        })

        onProgress?.(0.5)

        let processed = 0
        const totalKeys = spatialHash.size

        spatialHash.forEach((cell, key) => {
          const [gxStr, gyStr, gzStr] = key.split(',')
          const gx = parseInt(gxStr, 10)
          const gy = parseInt(gyStr, 10)
          const gz = parseInt(gzStr, 10)

          const cellMinX = minX + gx * VOXEL_SIZE
          const cellMaxX = minX + (gx + 1) * VOXEL_SIZE
          const cellMinY = minY + gy * VOXEL_SIZE
          const cellMaxY = minY + (gy + 1) * VOXEL_SIZE
          const cellMinZ = minZ + gz * VOXEL_SIZE
          const cellMaxZ = minZ + (gz + 1) * VOXEL_SIZE

          const centerX = (cellMinX + cellMaxX) / 2
          const centerZ = (cellMinZ + cellMaxZ) / 2

          let intersectCount = 0
          const testY = cellMinY - 100

          allTriangles.forEach(([v0, v1, v2]) => {
            if (getTriangleYIntersectY(testY, v0, v1, v2)) {
              const minTX = Math.min(v0.x, v1.x, v2.x)
              const maxTX = Math.max(v0.x, v1.x, v2.x)
              const minTZ = Math.min(v0.z, v1.z, v2.z)
              const maxTZ = Math.max(v0.z, v1.z, v2.z)

              if (centerX >= minTX && centerX <= maxTX && centerZ >= minTZ && centerZ <= maxTZ) {
                if (pointInTriangle(centerX, centerZ, v0.x, v0.z, v1.x, v1.z, v2.x, v2.z)) {
                  intersectCount++
                }
              }
            }
          })

          if (intersectCount % 2 === 1) {
            cell.hasInterior = true
          }

          processed++
          if (processed % 100 === 0) {
            onProgress?.(0.5 + 0.3 * (processed / totalKeys))
          }
        })

        const validCells: string[] = []
        spatialHash.forEach((cell, key) => {
          let hasSurfaceIntersect = false
          const [gxStr, gyStr, gzStr] = key.split(',')
          const gx = parseInt(gxStr, 10)
          const gy = parseInt(gyStr, 10)
          const gz = parseInt(gzStr, 10)
          const cellMinX2 = minX + gx * VOXEL_SIZE
          const cellMinY2 = minY + gy * VOXEL_SIZE
          const cellMinZ2 = minZ + gz * VOXEL_SIZE
          const cellMaxX2 = cellMinX2 + VOXEL_SIZE
          const cellMaxY2 = cellMinY2 + VOXEL_SIZE
          const cellMaxZ2 = cellMinZ2 + VOXEL_SIZE

          for (let i = 0; i < allTriangles.length && !hasSurfaceIntersect; i++) {
            const [v0, v1, v2] = allTriangles[i]
            const triMinX = Math.min(v0.x, v1.x, v2.x)
            const triMaxX = Math.max(v0.x, v1.x, v2.x)
            const triMinY = Math.min(v0.y, v1.y, v2.y)
            const triMaxY = Math.max(v0.y, v1.y, v2.y)
            const triMinZ = Math.min(v0.z, v1.z, v2.z)
            const triMaxZ = Math.max(v0.z, v1.z, v2.z)

            if (
              cellMaxX2 >= triMinX && cellMinX2 <= triMaxX &&
              cellMaxY2 >= triMinY && cellMinY2 <= triMaxY &&
              cellMaxZ2 >= triMinZ && cellMinZ2 <= triMaxZ
            ) {
              hasSurfaceIntersect = true
            }
          }

          if (cell.hasInterior || hasSurfaceIntersect) {
            validCells.push(key)
          }
        })

        onProgress?.(0.85)

        const sampleColorMap = new Map<string, [number, number, number]>()

        validCells.forEach((key) => {
          const [gxStr, gyStr, gzStr] = key.split(',')
          const gx = parseInt(gxStr, 10)
          const gy = parseInt(gyStr, 10)
          const gz = parseInt(gzStr, 10)

          const cellMinX = minX + gx * VOXEL_SIZE
          const cellMinY = minY + gy * VOXEL_SIZE
          const cellMinZ = minZ + gz * VOXEL_SIZE
          const cellMaxX = cellMinX + VOXEL_SIZE
          const cellMaxY = cellMinY + VOXEL_SIZE
          const cellMaxZ = cellMinZ + VOXEL_SIZE

          let totalR = 0, totalG = 0, totalB = 0
          let colorCount = 0

          allVertices.forEach((v) => {
            if (
              v.position.x >= cellMinX && v.position.x <= cellMaxX &&
              v.position.y >= cellMinY && v.position.y <= cellMaxY &&
              v.position.z >= cellMinZ && v.position.z <= cellMaxZ
            ) {
              if (v.color) {
                totalR += v.color.r
                totalG += v.color.g
                totalB += v.color.b
                colorCount++
              }
            }
          })

          let finalColor: [number, number, number]
          if (colorCount > 0) {
            finalColor = [
              Math.max(0, Math.min(1, totalR / colorCount)),
              Math.max(0, Math.min(1, totalG / colorCount)),
              Math.max(0, Math.min(1, totalB / colorCount)),
            ]
          } else {
            const hue = ((gx + gy * 3 + gz * 7) % 100) / 100
            finalColor = [
              0.5 + 0.3 * Math.sin(hue * Math.PI * 2),
              0.6 + 0.2 * Math.cos(hue * Math.PI * 2),
              0.7 + 0.2 * Math.sin(hue * Math.PI * 3),
            ]
          }

          sampleColorMap.set(key, finalColor)
        })

        let voxelId = 0
        validCells.forEach((key) => {
          if (voxelId < MAX_VOXELS) {
            const [gxStr, gyStr, gzStr] = key.split(',')
            const gx = parseInt(gxStr, 10)
            const gy = parseInt(gyStr, 10)
            const gz = parseInt(gzStr, 10)

            const worldX = minX + gx * VOXEL_SIZE + halfSize
            const worldY = minY + gy * VOXEL_SIZE + halfSize
            const worldZ = minZ + gz * VOXEL_SIZE + halfSize
            const color = sampleColorMap.get(key) || [0.8, 0.8, 0.8]

            voxels.push({
              id: uuidv4(),
              gridX: gx,
              gridY: gy,
              gridZ: gz,
              worldX,
              worldY,
              worldZ,
              color: [...color] as [number, number, number],
              originalColor: [...color] as [number, number, number],
            })
            voxelId++
          }
        })

        onProgress?.(1.0)

        resolve({
          voxels,
          maxLayers: gridSizeY,
          boundingBox: {
            minX: bbox.min.x,
            maxX: bbox.max.x,
            minY: bbox.min.y,
            maxY: bbox.max.y,
            minZ: bbox.min.z,
            maxZ: bbox.max.z,
          },
        })
      } catch (error) {
        reject(error)
      }
    }

    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer
      try {
        if (fileName.endsWith('.obj')) {
          const loader = new OBJLoader()
          const text = new TextDecoder().decode(buffer)
          const object = loader.parse(text)
          processGeometry(object)
        } else if (fileName.endsWith('.gltf') || fileName.endsWith('.glb')) {
          const loader = new GLTFLoader()
          loader.parse(buffer, '', (gltf) => {
            processGeometry(gltf.scene)
          }, (error) => {
            reject(error)
          })
        } else {
          reject(new Error('Unsupported file format'))
        }
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = () => reject(new Error('File read error'))

    if (fileName.endsWith('.glb')) {
      reader.readAsArrayBuffer(file)
    } else {
      reader.readAsText(file)
    }
  })
}
