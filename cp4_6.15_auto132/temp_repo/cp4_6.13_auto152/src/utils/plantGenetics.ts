export type PlantStage = 'seed' | 'germination' | 'cotyledon' | 'trueLeaf' | 'stem' | 'flower'

export interface PlantParams {
  light: number
  water: number
  soil: number
}

export interface PlantState {
  stage: PlantStage
  stageProgress: number
  stemHeight: number
  leafSize: number
  flowerSize: number
}

export const stageNames: Record<PlantStage, string> = {
  seed: '种子',
  germination: '种子萌发',
  cotyledon: '子叶展开',
  trueLeaf: '真叶长出',
  stem: '花茎伸长',
  flower: '开花'
}

export const stageDurations: Record<PlantStage, number> = {
  seed: 0,
  germination: 4000,
  cotyledon: 4000,
  trueLeaf: 4000,
  stem: 5000,
  flower: 5000
}

export function getFlowerColor(light: number, water: number): string {
  const lightHigh = light > 50
  const waterHigh = water > 50
  
  if (lightHigh && waterHigh) return '#FF4500'
  if (lightHigh && !waterHigh) return '#FF8C00'
  if (!lightHigh && waterHigh) return '#8A2BE2'
  return '#FFC0CB'
}

export function getLeafColor(light: number): string {
  const intensity = light / 100
  const r = Math.floor(34 + intensity * 45)
  const g = Math.floor(139 + intensity * 86)
  const b = Math.floor(34 + intensity * 45)
  return `rgb(${r}, ${g}, ${b})`
}

export function getStemColor(soil: number): string {
  const intensity = soil / 100
  const r = Math.floor(144 + intensity * 20)
  const g = Math.floor(238 + intensity * 17)
  const b = Math.floor(144 + intensity * 20)
  return `rgb(${r}, ${g}, ${b})`
}

export interface PlantVariety {
  id: string
  name: string
  flowerColor: string
  leafType: 'heart' | 'spotted'
  params: PlantParams
}

export function classifyPlant(params: PlantParams): PlantVariety {
  const flowerColor = getFlowerColor(params.light, params.water)
  const leafType = params.soil > 60 ? 'heart' : 'spotted'
  
  let name = ''
  switch (flowerColor) {
    case '#FF4500':
      name = leafType === 'heart' ? '红心' : '红心斑叶'
      break
    case '#FF8C00':
      name = leafType === 'heart' ? '橙心' : '橙心斑叶'
      break
    case '#8A2BE2':
      name = leafType === 'heart' ? '紫心' : '紫心斑叶'
      break
    case '#FFC0CB':
      name = leafType === 'heart' ? '粉心' : '粉心斑叶'
      break
    default:
      name = '绿叶'
  }
  
  return {
    id: `${flowerColor}-${leafType}-${Date.now()}`,
    name,
    flowerColor,
    leafType,
    params
  }
}

export function generateRandomStemHeight(): number {
  return 80 + Math.random() * 70
}

export function generatePetalCount(): number {
  return 5 + Math.floor(Math.random() * 4)
}

export function lerp(start: number, end: number, t: number): number {
  return start + (end - start) * t
}

export function easeOutCubic(t: number): number {
  return 1 - Math.pow(1 - t, 3)
}