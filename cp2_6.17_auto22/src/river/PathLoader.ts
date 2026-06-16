import * as THREE from 'three'

export interface PathPoint {
  x: number
  y: number
  z: number
}

export interface RiverPath {
  id: string
  name: string
  controlPoints: [PathPoint, PathPoint, PathPoint, PathPoint]
  curve: THREE.CubicBezierCurve3
  sampledPoints: THREE.Vector3[]
  arcLength: number
}

const PATH_CONTROL_DATA: Array<{
  id: string
  name: string
  points: [PathPoint, PathPoint, PathPoint, PathPoint]
}> = [
  {
    id: 'river-a',
    name: '主河道',
    points: [
      { x: -80, y: 0, z: -40 },
      { x: -40, y: 3, z: -20 },
      { x: 0, y: 2, z: 15 },
      { x: 60, y: 0, z: 50 }
    ]
  },
  {
    id: 'river-b',
    name: '支流A',
    points: [
      { x: -95, y: 10, z: 30 },
      { x: -60, y: 8, z: 15 },
      { x: -25, y: 5, z: 5 },
      { x: 0, y: 1, z: 0 }
    ]
  },
  {
    id: 'river-c',
    name: '支流B',
    points: [
      { x: 60, y: 15, z: -90 },
      { x: 35, y: 10, z: -60 },
      { x: 15, y: 6, z: -30 },
      { x: 0, y: 1, z: 0 }
    ]
  },
  {
    id: 'river-d',
    name: '支流C',
    points: [
      { x: -105, y: 5, z: 10 },
      { x: -70, y: 4, z: 0 },
      { x: -35, y: 3, z: 10 },
      { x: 10, y: 1, z: 20 }
    ]
  },
  {
    id: 'river-e',
    name: '支流D',
    points: [
      { x: 110, y: 14, z: 55 },
      { x: 75, y: 9, z: 48 },
      { x: 40, y: 5, z: 35 },
      { x: 5, y: 1, z: 15 }
    ]
  },
  {
    id: 'river-f',
    name: '支流E',
    points: [
      { x: -80, y: 18, z: 85 },
      { x: -50, y: 12, z: 60 },
      { x: -20, y: 7, z: 40 },
      { x: 10, y: 1, z: 20 }
    ]
  },
  {
    id: 'river-g',
    name: '支流F',
    points: [
      { x: 60, y: 15, z: -105 },
      { x: 45, y: 10, z: -75 },
      { x: 25, y: 6, z: -45 },
      { x: 5, y: 1, z: -15 }
    ]
  },
  {
    id: 'river-h',
    name: '支流G',
    points: [
      { x: -35, y: 10, z: 105 },
      { x: -15, y: 7, z: 75 },
      { x: 10, y: 4, z: 50 },
      { x: 30, y: 1, z: 25 }
    ]
  },
  {
    id: 'river-i',
    name: '支流H',
    points: [
      { x: 105, y: 5, z: -55 },
      { x: 70, y: 4, z: -40 },
      { x: 35, y: 3, z: -20 },
      { x: 10, y: 1, z: -5 }
    ]
  },
  {
    id: 'river-j',
    name: '支流I',
    points: [
      { x: -95, y: 12, z: 85 },
      { x: -65, y: 8, z: 60 },
      { x: -35, y: 5, z: 42 },
      { x: -5, y: 1, z: 22 }
    ]
  }
]

const SAMPLE_COUNT = 200

export function loadPaths(): RiverPath[] {
  const paths = PATH_CONTROL_DATA.map((data) => {
    const [p0, p1, p2, p3] = data.points
    const v0 = new THREE.Vector3(p0.x, p0.y, p0.z)
    const v1 = new THREE.Vector3(p1.x, p1.y, p1.z)
    const v2 = new THREE.Vector3(p2.x, p2.y, p2.z)
    const v3 = new THREE.Vector3(p3.x, p3.y, p3.z)
    const curve = new THREE.CubicBezierCurve3(v0, v1, v2, v3)
    const sampledPoints = curve.getPoints(SAMPLE_COUNT)
    const arcLength = curve.getLength()
    return {
      id: data.id,
      name: data.name,
      controlPoints: data.points,
      curve,
      sampledPoints,
      arcLength
    }
  })

  console.log('[GeoFlow] 路径长度验证:')
  paths.forEach((path) => {
    const valid = path.arcLength >= 100 && path.arcLength <= 200
    console.log(`  ${path.name} (${path.id}): ${path.arcLength.toFixed(2)} 单位 ${valid ? '✓' : '✗ (超出范围)'}`)
  })

  return paths
}

export function interpolateOnPath(path: RiverPath, t: number): THREE.Vector3 {
  const clampedT = Math.max(0, Math.min(1, t))
  const index = clampedT * (path.sampledPoints.length - 1)
  const i0 = Math.floor(index)
  const i1 = Math.min(i0 + 1, path.sampledPoints.length - 1)
  const localT = index - i0
  const v = new THREE.Vector3()
  v.lerpVectors(path.sampledPoints[i0], path.sampledPoints[i1], localT)
  return v
}
