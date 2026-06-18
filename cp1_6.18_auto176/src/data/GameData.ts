export type ElementType = 'gold' | 'wood' | 'water' | 'fire' | 'earth'

export type SkillType = 'armorBreak' | 'entangle' | 'heal' | 'burn' | 'shield'

export interface SkillEffect {
  type: SkillType
  value: number
  duration: number
}

export interface CardConfig {
  id: string
  name: string
  element: ElementType
  attack: number
  maxHp: number
  skill: SkillEffect
  skillName: string
  skillDesc: string
}

export interface Unit {
  id: string
  name: string
  element: ElementType
  attack: number
  maxHp: number
  hp: number
  defense: number
  baseDefense: number
  shield: number
  skill: SkillEffect
  skillCooldown: number
  statusEffects: StatusEffect[]
  isStunned: boolean
}

export interface StatusEffect {
  type: 'armorBreak' | 'entangle' | 'burn' | 'shield'
  value: number
  remainingTurns: number
}

export type BattlePhase = 'prepare' | 'action' | 'settle'

export type GameState = 'playing' | 'playerWin' | 'aiWin'

export const ELEMENT_COLORS: Record<ElementType, string> = {
  gold: '#FFD700',
  wood: '#4CAF50',
  water: '#2196F3',
  fire: '#F44336',
  earth: '#8D6E63'
}

export const ELEMENT_NAMES: Record<ElementType, string> = {
  gold: '金',
  wood: '木',
  water: '水',
  fire: '火',
  earth: '土'
}

export const ELEMENT_COUNTER: Record<ElementType, ElementType> = {
  gold: 'wood',
  wood: 'earth',
  earth: 'water',
  water: 'fire',
  fire: 'gold'
}

export const ELEMENT_COUNTER_NAME: Record<ElementType, string> = {
  gold: '金克木',
  wood: '木克土',
  earth: '土克水',
  water: '水克火',
  fire: '火克金'
}

export function getElementCounterMultiplier(attacker: ElementType, defender: ElementType): number {
  if (ELEMENT_COUNTER[attacker] === defender) {
    return 1.5
  }
  if (ELEMENT_COUNTER[defender] === attacker) {
    return 0.75
  }
  return 1.0
}

export const CARD_TEMPLATES: Omit<CardConfig, 'id'>[] = [
  {
    name: '金麟卫',
    element: 'gold',
    attack: 12,
    maxHp: 25,
    skill: { type: 'armorBreak', value: 0.3, duration: 2 },
    skillName: '破甲',
    skillDesc: '降低目标防御30%，持续2回合'
  },
  {
    name: '木灵仙',
    element: 'wood',
    attack: 8,
    maxHp: 30,
    skill: { type: 'entangle', value: 1, duration: 1 },
    skillName: '缠绕',
    skillDesc: '使目标无法行动1回合'
  },
  {
    name: '水镜师',
    element: 'water',
    attack: 10,
    maxHp: 22,
    skill: { type: 'shield', value: 8, duration: 2 },
    skillName: '护盾',
    skillDesc: '为己方添加8点护盾，持续2回合'
  },
  {
    name: '炎魔将',
    element: 'fire',
    attack: 15,
    maxHp: 18,
    skill: { type: 'burn', value: 5, duration: 3 },
    skillName: '灼烧',
    skillDesc: '每回合造成5点灼烧伤害，持续3回合'
  },
  {
    name: '土行孙',
    element: 'earth',
    attack: 7,
    maxHp: 28,
    skill: { type: 'shield', value: 10, duration: 1 },
    skillName: '坚壁',
    skillDesc: '获得10点护盾'
  }
]

export function generateDeck(prefix: string): CardConfig[] {
  const deck: CardConfig[] = []
  let cardIndex = 0

  for (const template of CARD_TEMPLATES) {
    for (let i = 0; i < 4; i++) {
      deck.push({
        ...template,
        id: `${prefix}_${cardIndex++}`
      })
    }
  }

  return deck
}

export function shuffleDeck<T>(deck: T[]): T[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

export function createUnitFromCard(card: CardConfig): Unit {
  return {
    id: card.id,
    name: card.name,
    element: card.element,
    attack: card.attack,
    maxHp: card.maxHp,
    hp: card.maxHp,
    defense: 5,
    baseDefense: 5,
    shield: 0,
    skill: card.skill,
    skillCooldown: 0,
    statusEffects: [],
    isStunned: false
  }
}
