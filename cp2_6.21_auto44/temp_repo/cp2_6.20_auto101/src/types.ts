export type SkillEffectType = 'fire' | 'ice' | 'lightning' | 'wind' | 'shadow'

export type TalentEffectType = 'fire_boost' | 'ice_shield' | 'lightning_charge' | 'shadow_drain'

export interface Skill {
  id: string
  name: string
  icon: string
  cooldown: number
  damage: number
  color: string
  particleCount: [number, number]
  effectType: SkillEffectType
}

export interface Talent {
  id: string
  name: string
  icon: string
  description: string
  effectType: TalentEffectType
  relatedSkillTypes: SkillEffectType[]
  bonusEffect: {
    damageMultiplier?: number
    extraDuration?: number
    cooldownReduction?: number
  }
}

export interface ComboSlot {
  id: string
  skillId: string | null
  order: number
  combinationEffects: string[]
}

export interface PlaybackStats {
  totalDamage: number
  totalCooldown: number
  totalDuration: number
}

export interface PlaybackState {
  isPlaying: boolean
  currentIndex: number
  startTime: number
  stats: PlaybackStats
}

export interface ActiveEffect {
  id: string
  skill: Skill
  startTime: number
  duration: number
}

export const PRESET_SKILLS: Skill[] = [
  {
    id: 'fireball',
    name: '火球术',
    icon: '🔥',
    cooldown: 3,
    damage: 200,
    color: '#ff6b35',
    particleCount: [30, 50],
    effectType: 'fire',
  },
  {
    id: 'frost_nova',
    name: '冰霜新星',
    icon: '❄️',
    cooldown: 5,
    damage: 150,
    color: '#4ecdc4',
    particleCount: [40, 60],
    effectType: 'ice',
  },
  {
    id: 'lightning_chain',
    name: '闪电链',
    icon: '⚡',
    cooldown: 4,
    damage: 180,
    color: '#ffffff',
    particleCount: [50, 80],
    effectType: 'lightning',
  },
  {
    id: 'wind_blade',
    name: '风刃',
    icon: '🌀',
    cooldown: 2,
    damage: 120,
    color: '#95e1d3',
    particleCount: [35, 55],
    effectType: 'wind',
  },
  {
    id: 'shadow_strike',
    name: '暗影冲击',
    icon: '🌑',
    cooldown: 6,
    damage: 280,
    color: '#9b59b6',
    particleCount: [45, 70],
    effectType: 'shadow',
  },
]

export const PRESET_TALENTS: Talent[] = [
  {
    id: 'fire_boost',
    name: '火焰强化',
    icon: '🔥',
    description: '火焰技能额外燃烧持续伤害+2秒',
    effectType: 'fire_boost',
    relatedSkillTypes: ['fire'],
    bonusEffect: { extraDuration: 2 },
  },
  {
    id: 'ice_shield',
    name: '冰霜护盾',
    icon: '🛡️',
    description: '冰霜技能伤害+10%',
    effectType: 'ice_shield',
    relatedSkillTypes: ['ice'],
    bonusEffect: { damageMultiplier: 1.1 },
  },
  {
    id: 'lightning_charge',
    name: '雷电充能',
    icon: '⚡',
    description: '闪电技能伤害+15%',
    effectType: 'lightning_charge',
    relatedSkillTypes: ['lightning'],
    bonusEffect: { damageMultiplier: 1.15 },
  },
  {
    id: 'shadow_drain',
    name: '暗影汲取',
    icon: '💀',
    description: '暗影技能冷却-1秒',
    effectType: 'shadow_drain',
    relatedSkillTypes: ['shadow'],
    bonusEffect: { cooldownReduction: 1 },
  },
]

export const SKILL_DURATION = 1.5
export const TRANSITION_DURATION = 0.5
