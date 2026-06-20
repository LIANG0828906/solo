import { v4 as uuidv4 } from 'uuid'
import type { Fragment, Rune, ElementType, Rarity, SlotType } from '../types'

export const elementColors: Record<ElementType, string> = {
  fire: '#ff4500',
  water: '#00bfff',
  thunder: '#ffd700',
  wind: '#32cd32',
  dark: '#9932cc',
}

export const elementNames: Record<ElementType, string> = {
  fire: '火',
  water: '水',
  thunder: '雷',
  wind: '风',
  dark: '暗',
}

export const slotNames: Record<SlotType, string> = {
  weapon: '武器',
  offhand: '副手',
  helmet: '头盔',
  chest: '胸甲',
  bracers: '护腕',
  ring: '戒指',
}

export const rarityStars = (rarity: Rarity): string => '★'.repeat(rarity)

export const getElementParticleColors = (element: ElementType): { primary: string; secondary: string; glow: string } => {
  const colorMap: Record<ElementType, { primary: string; secondary: string; glow: string }> = {
    fire: { primary: '#ff6347', secondary: '#ff8c00', glow: '#ff4500' },
    water: { primary: '#87ceeb', secondary: '#4169e1', glow: '#00bfff' },
    thunder: { primary: '#ffff00', secondary: '#ffa500', glow: '#ffd700' },
    wind: { primary: '#98fb98', secondary: '#00fa9a', glow: '#32cd32' },
    dark: { primary: '#da70d6', secondary: '#8a2be2', glow: '#9932cc' },
  }
  return colorMap[element]
}

export const calculateSuccessRate = (fragments: Array<Fragment | null>): number => {
  const filled = fragments.filter((f): f is Fragment => f !== null)
  if (filled.length < 3) return 0
  const avgRarity = filled.reduce((sum, f) => sum + f.rarity, 0) / filled.length
  const baseRate = 0.3 + avgRarity * 0.12
  return Math.min(0.95, baseRate)
}

export const determineRuneElement = (fragments: Array<Fragment | null>): ElementType => {
  const filled = fragments.filter((f): f is Fragment => f !== null)
  const elementCounts: Record<string, number> = {}
  filled.forEach((f) => {
    elementCounts[f.element] = (elementCounts[f.element] || 0) + f.rarity
  })
  let maxElement = filled[0]?.element || 'fire'
  let maxCount = 0
  Object.entries(elementCounts).forEach(([el, count]) => {
    if (count > maxCount) {
      maxCount = count
      maxElement = el as ElementType
    }
  })
  return maxElement
}

export const determineRuneRarity = (fragments: Array<Fragment | null>): Rarity => {
  const filled = fragments.filter((f): f is Fragment => f !== null)
  const avgRarity = filled.reduce((sum, f) => sum + f.rarity, 0) / filled.length
  const bonus = Math.random() < 0.2 ? 1 : 0
  const result = Math.min(5, Math.max(1, Math.round(avgRarity + bonus)))
  return result as Rarity
}

const runeNamesByElement: Record<ElementType, string[]> = {
  fire: ['烈焰符文', '炎爆符文', '炽焰符文', '焚天符文', '凤凰符文'],
  water: ['寒冰符文', '潮汐符文', '冰霜符文', '深渊符文', '海潮符文'],
  thunder: ['雷电符文', '闪电符文', '雷霆符文', '神雷符文', '天罚符文'],
  wind: ['疾风符文', '旋风符文', '风暴符文', '苍穹符文', '御风符文'],
  dark: ['暗影符文', '虚空符文', '深渊符文', '噬魂符文', '湮灭符文'],
}

const slotTypes: SlotType[] = ['weapon', 'offhand', 'helmet', 'chest', 'bracers', 'ring']

const specialEffects: Record<ElementType, string[]> = {
  fire: ['燃烧：攻击时有几率造成灼烧伤害', '暴击伤害提升', '攻击附带火焰附加伤害'],
  water: ['吸血：回复造成伤害的一定比例生命', '冰霜减速效果', '被攻击时有几率冰冻敌人'],
  thunder: ['连锁闪电：攻击有几率触发连锁攻击', '感电效果', '雷霆一击额外伤害'],
  wind: ['闪避：有几率完全闪避攻击', '疾风连击', '风之加速攻击'],
  dark: ['吸血：攻击回复生命', '暗影暴击加成', '死亡诅咒降低敌方防御'],
}

export const forgeRune = (fragments: Array<Fragment | null>): Rune | null => {
  const filled = fragments.filter((f): f is Fragment => f !== null)
  if (filled.length < 3) return null

  const successRate = calculateSuccessRate(fragments)
  if (Math.random() > successRate) return null

  const element = determineRuneElement(fragments)
  const rarity = determineRuneRarity(fragments)
  const slotType = slotTypes[Math.floor(Math.random() * slotTypes.length)]
  const nameIndex = Math.min(rarity - 1, runeNamesByElement[element].length - 1)
  const effectIndex = Math.floor(Math.random() * specialEffects[element].length)

  const baseStats = filled.reduce(
    (acc, f) => {
      return {
        attack: (acc.attack || 0) + (f.baseStats.attack || 0) * 0.5,
        defense: (acc.defense || 0) + (f.baseStats.defense || 0) * 0.5,
        health: (acc.health || 0) + (f.baseStats.health || 0) * 0.5,
        critRate: (acc.critRate || 0) + (f.baseStats.critRate || 0) * 0.5,
      }
    },
    { attack: 0, defense: 0, health: 0, critRate: 0 }
  )

  const multiplier = 1 + (rarity - 1) * 0.3

  return {
    id: uuidv4(),
    name: runeNamesByElement[element][nameIndex],
    element,
    rarity,
    slotType,
    stats: {
      attack: Math.round((baseStats.attack || 0) * multiplier),
      defense: Math.round((baseStats.defense || 0) * multiplier),
      health: Math.round((baseStats.health || 0) * multiplier),
      critRate: Math.round((baseStats.critRate || 0) * multiplier),
      specialEffect: specialEffects[element][effectIndex],
    },
    effectChance: 0.1 + rarity * 0.08,
    description: `由${filled.length}块${elementNames[element]}属性碎片合成的${rarity}星符文`,
  }
}

export const returnFragments = (fragments: Array<Fragment | null>): Array<{ fragment: Fragment; count: number }> => {
  const result: Array<{ fragment: Fragment; count: number }> = []
  const filled = fragments.filter((f): f is Fragment => f !== null)
  const fragmentMap = new Map<string, { fragment: Fragment; count: number }>()

  filled.forEach((f) => {
    const existing = fragmentMap.get(f.id)
    if (existing) {
      existing.count += 1
    } else {
      fragmentMap.set(f.id, { fragment: f, count: 1 })
    }
  })

  fragmentMap.forEach((value) => {
    result.push({
      fragment: value.fragment,
      count: Math.floor(value.count / 2),
    })
  })

  return result
}

export const generateHexagramPositions = (count: number): Array<{ x: number; y: number }> => {
  const positions: Array<{ x: number; y: number }> = []
  const radius = 100
  for (let i = 0; i < count; i++) {
    const angle = (i * 60 - 90) * (Math.PI / 180)
    positions.push({
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
    })
  }
  return positions
}
