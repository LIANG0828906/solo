import type { ElementType as ElementType, VeinNodeState } from './api'

export type { ElementType }

export const SHENG_MAP: Record<ElementType, ElementType> = {
  metal: 'water',
  water: 'wood',
  wood: 'fire',
  fire: 'earth',
  earth: 'metal',
}

export const KE_MAP: Record<ElementType, ElementType> = {
  metal: 'wood',
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'metal',
}

export const REVERSE_SHENG_MAP: Record<ElementType, ElementType> = {
  water: 'metal',
  wood: 'water',
  fire: 'wood',
  earth: 'fire',
  metal: 'earth',
}

export const REVERSE_KE_MAP: Record<ElementType, ElementType> = {
  wood: 'metal',
  earth: 'wood',
  water: 'earth',
  fire: 'water',
  metal: 'fire',
}

const SHENG_PAIR_SET = new Set<string>()
const KE_PAIR_SET = new Set<string>()

const ELEMENTS: ElementType[] = ['metal', 'wood', 'water', 'fire', 'earth']

for (const src of ELEMENTS) {
  SHENG_PAIR_SET.add(`${src}->${SHENG_MAP[src]}`)
  KE_PAIR_SET.add(`${src}->${KE_MAP[src]}`)
}

export function isSheng(from: ElementType, to: ElementType): boolean {
  return SHENG_PAIR_SET.has(`${from}->${to}`)
}

export function isKe(from: ElementType, to: ElementType): boolean {
  return KE_PAIR_SET.has(`${from}->${to}`)
}

export function getShengTarget(element: ElementType): ElementType {
  return SHENG_MAP[element]
}

export function getKeTarget(element: ElementType): ElementType {
  return KE_MAP[element]
}

export function getShengSource(element: ElementType): ElementType {
  return REVERSE_SHENG_MAP[element]
}

export function getKeSource(element: ElementType): ElementType {
  return REVERSE_KE_MAP[element]
}

export function detectResonationChain(
  activeOrder: ElementType[],
): { chainLength: number; isBurst: boolean; burstNodes: ElementType[] } {
  if (activeOrder.length < 2) {
    return { chainLength: activeOrder.length, isBurst: false, burstNodes: [] }
  }

  let chainLength = 1
  let isBurst = false
  const burstNodes: ElementType[] = []

  for (let i = 1; i < activeOrder.length; i++) {
    if (isSheng(activeOrder[i - 1], activeOrder[i])) {
      chainLength++
    } else {
      break
    }
  }

  if (chainLength === 5) {
    isBurst = true
    burstNodes.push(...activeOrder.slice(0, 5))
  }

  return { chainLength, isBurst, burstNodes }
}

export function calculateEnergyBalance(
  nodeId: ElementType,
  allNodes: VeinNodeState[],
): Record<ElementType, number> {
  const balance: Record<ElementType, number> = {
    metal: 0,
    wood: 0,
    water: 0,
    fire: 0,
    earth: 0,
  }

  const activeNodes = allNodes.filter((n) => n.isActive)

  for (const node of activeNodes) {
    const el = node.id as ElementType
    const energy = node.energy

    const target = SHENG_MAP[el]
    balance[target] += energy * 0.3

    const keTarget = KE_MAP[el]
    balance[keTarget] -= energy * 0.2

    balance[el] += energy * 0.5
  }

  const shengSource = REVERSE_SHENG_MAP[nodeId]
  const keSource = REVERSE_KE_MAP[nodeId]
  balance[shengSource] += 10
  balance[keSource] -= 5

  return balance
}

const ELEMENT_STAT_MAP: Record<ElementType, 'attack' | 'defense' | 'speed'> = {
  metal: 'attack',
  wood: 'defense',
  water: 'speed',
  fire: 'attack',
  earth: 'defense',
}

const SHENG_BONUS = 0.2
const KE_PENALTY = 0.15
const MAIN_MULTIPLIER = 1.5

export function calculateArtifactFinalStats(
  baseStats: { attack: number; defense: number; speed: number },
  soulHoles: (ElementType | null)[],
  resonationBoost: number,
): { mainElement: ElementType; finalStats: { attack: number; defense: number; speed: number }; bonuses: Record<string, number> } {
  const filledHoles = soulHoles.filter((h): h is ElementType => h !== null)

  if (filledHoles.length === 0) {
    return { mainElement: 'metal', finalStats: { ...baseStats }, bonuses: {} }
  }

  const frequency: Record<ElementType, number> = { metal: 0, wood: 0, water: 0, fire: 0, earth: 0 }
  for (const el of filledHoles) {
    frequency[el]++
  }

  let mainElement: ElementType = 'metal'
  let maxCount = 0
  for (const el of ELEMENTS) {
    if (frequency[el] > maxCount) {
      maxCount = frequency[el]
      mainElement = el
    }
  }

  const bonuses: Record<string, number> = {}
  const mainStat = ELEMENT_STAT_MAP[mainElement]
  const finalStats = { attack: baseStats.attack, defense: baseStats.defense, speed: baseStats.speed }

  finalStats[mainStat] = baseStats[mainStat] * MAIN_MULTIPLIER

  for (const el of filledHoles) {
    const stat = ELEMENT_STAT_MAP[el]
    if (el === mainElement) continue

    if (isSheng(el, mainElement)) {
      const key = `${el}_sheng_${mainElement}`
      const bonus = baseStats[stat] * SHENG_BONUS
      bonuses[key] = bonus
      finalStats[stat] += bonus
    } else if (isKe(el, mainElement)) {
      const key = `${el}_ke_${mainElement}`
      const penalty = baseStats[stat] * KE_PENALTY
      bonuses[key] = -penalty
      finalStats[stat] -= penalty
    }
  }

  const boostMultiplier = 1 + resonationBoost / 100
  finalStats.attack = Math.round(finalStats.attack * boostMultiplier * 100) / 100
  finalStats.defense = Math.round(finalStats.defense * boostMultiplier * 100) / 100
  finalStats.speed = Math.round(finalStats.speed * boostMultiplier * 100) / 100

  return { mainElement, finalStats, bonuses }
}
