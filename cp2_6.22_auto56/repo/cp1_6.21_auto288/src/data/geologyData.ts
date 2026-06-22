export interface GeologyPoint {
  id: string
  position: { x: number; y: number; z: number }
  depth: number
  lithology: string
  age: string
  sampleId: string
}

export interface Stratum {
  id: string
  name: string
  color: string
  position: [number, number, number]
  size: [number, number, number]
  age: string
  lithology: string
  minY: number
  maxY: number
}

export interface Fault {
  id: string
  name: string
  points: [number, number, number][]
  color: string
}

export interface ViewPreset {
  name: string
  icon: string
  position: [number, number, number]
  target: [number, number, number]
}

const strata: Stratum[] = [
  {
    id: 'stratum-1',
    name: '第四系',
    color: '#E8D5B7',
    position: [0, 4, 0],
    size: [12, 2, 10],
    age: '第四纪',
    lithology: '松散沉积物',
    minY: 3,
    maxY: 5,
  },
  {
    id: 'stratum-2',
    name: '新近系',
    color: '#C4A77D',
    position: [0, 2, 0],
    size: [12, 2, 10],
    age: '新近纪',
    lithology: '砂岩、泥岩',
    minY: 1,
    maxY: 3,
  },
  {
    id: 'stratum-3',
    name: '白垩系',
    color: '#8B7355',
    position: [0, 0, 0],
    size: [12, 2, 10],
    age: '白垩纪',
    lithology: '红色砂岩',
    minY: -1,
    maxY: 1,
  },
  {
    id: 'stratum-4',
    name: '侏罗系',
    color: '#5C8A5C',
    position: [0, -2, 0],
    size: [12, 2, 10],
    age: '侏罗纪',
    lithology: '煤层、页岩',
    minY: -3,
    maxY: -1,
  },
  {
    id: 'stratum-5',
    name: '三叠系',
    color: '#4A6B8A',
    position: [0, -4, 0],
    size: [12, 2, 10],
    age: '三叠纪',
    lithology: '石灰岩',
    minY: -5,
    maxY: -3,
  },
]

const faults: Fault[] = [
  {
    id: 'fault-1',
    name: '正断层 F1',
    color: '#FF6B6B',
    points: [
      [-4, 5, 0],
      [-2, 3, 0],
      [0, 1, 0],
      [2, -1, 0],
      [4, -3, 0],
    ],
  },
  {
    id: 'fault-2',
    name: '逆断层 F2',
    color: '#FFA94D',
    points: [
      [-2, 5, 3],
      [-1, 3, 2],
      [0, 1, 1],
      [1, -1, 0],
      [2, -3, -1],
    ],
  },
]

const viewPresets: ViewPreset[] = [
  {
    name: '俯视',
    icon: 'eye',
    position: [0, 20, 0.01],
    target: [0, 0, 0],
  },
  {
    name: '正视',
    icon: 'axis-3d',
    position: [20, 0, 0],
    target: [0, 0, 0],
  },
  {
    name: '剖面',
    icon: 'layers',
    position: [0, 0, 20],
    target: [0, 0, 0],
  },
]

function generateSampleId(stratumName: string, x: number, z: number): string {
  const prefix = stratumName.substring(0, 2).toUpperCase()
  const xStr = Math.round(x * 10).toString().padStart(3, '0')
  const zStr = Math.round(z * 10).toString().padStart(3, '0')
  return `${prefix}-${xStr}${zStr}`
}

export function getStrata(): Stratum[] {
  return strata
}

export function getFaults(): Fault[] {
  return faults
}

export function getViewPresets(): ViewPreset[] {
  return viewPresets
}

export function queryGeologyByPosition(
  position: { x: number; y: number; z: number }
): GeologyPoint | null {
  const { x, y, z } = position

  for (const stratum of strata) {
    const [sx, sy, sz] = stratum.position
    const [halfW, halfH, halfD] = stratum.size.map((s) => s / 2)

    if (
      x >= sx - halfW &&
      x <= sx + halfW &&
      y >= sy - halfH &&
      y <= sy + halfH &&
      z >= sz - halfD &&
      z <= sz + halfD
    ) {
      const depth = parseFloat((5 - y).toFixed(2))
      return {
        id: `point-${Date.now()}`,
        position: { x, y, z },
        depth,
        lithology: stratum.lithology,
        age: stratum.age,
        sampleId: generateSampleId(stratum.name, x, z),
      }
    }
  }

  return null
}
