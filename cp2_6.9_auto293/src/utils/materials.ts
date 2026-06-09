export interface CopperAlloy {
  id: string
  name: string
  color: string
  meltingPoint: number
  reflectivity: number
  roughness: number
  metalness: number
}

export interface PolishTool {
  id: string
  name: string
  roughnessChange: number
  reflectivityChange: number
  scratchIntensity: number
}

export const copperAlloys: CopperAlloy[] = [
  {
    id: 'pure-copper',
    name: '纯铜',
    color: '#b87333',
    meltingPoint: 1085,
    reflectivity: 0.7,
    roughness: 0.4,
    metalness: 1.0
  },
  {
    id: 'tin-bronze',
    name: '锡青铜',
    color: '#8a6e45',
    meltingPoint: 950,
    reflectivity: 0.75,
    roughness: 0.35,
    metalness: 1.0
  },
  {
    id: 'lead-bronze',
    name: '铅青铜',
    color: '#9e7e5a',
    meltingPoint: 900,
    reflectivity: 0.65,
    roughness: 0.45,
    metalness: 0.95
  },
  {
    id: 'white-copper',
    name: '白铜',
    color: '#c0c0c0',
    meltingPoint: 1150,
    reflectivity: 0.85,
    roughness: 0.3,
    metalness: 1.0
  }
]

export const polishTools: PolishTool[] = [
  {
    id: 'coarse',
    name: '粗砂磨石',
    roughnessChange: -0.15,
    reflectivityChange: 0.1,
    scratchIntensity: 0.6
  },
  {
    id: 'fine',
    name: '细砂磨石',
    roughnessChange: -0.08,
    reflectivityChange: 0.15,
    scratchIntensity: 0.3
  },
  {
    id: 'polish',
    name: '羊皮抛光轮',
    roughnessChange: -0.03,
    reflectivityChange: 0.25,
    scratchIntensity: 0.05
  }
]

export const processSteps = [
  { id: 'select', name: '选料', description: '选取铜料配方' },
  { id: 'smelt', name: '熔炼', description: '高温熔炼金属' },
  { id: 'cast', name: '翻模', description: '浇铸入范成型' },
  { id: 'cool', name: '冷却', description: '静待冷却凝固' },
  { id: 'polish', name: '研磨', description: '打磨抛光镜面' },
  { id: 'finish', name: '成品', description: '铜镜铸造完成' }
] as const

export type ProcessStep = typeof processSteps[number]['id']
