export type SpellElement = 'fire' | 'ice' | 'lightning' | 'dark'

export interface Spell {
  id: string
  name: string
  element: SpellElement
  manaCost: number
  cooldownMs: number
  damage: number
  description: string
  gradientColors: [string, string]
}

export interface PlayerState {
  hp: number
  maxHp: number
  mp: number
  maxMp: number
}

export interface CooldownInfo {
  spellId: string
  remainingMs: number
  totalMs: number
}

export interface ComboState {
  spellIds: string[]
  lastCastTime: number
  isActive: boolean
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  r: number
  g: number
  b: number
  life: number
  maxLife: number
  active: boolean
}

export interface SpellCastEvent {
  spellId: string
  slotIndex: number
  element: SpellElement
  angle: number
  damage: number
}

export type ComboEffectType = 'meteor' | 'chain_lightning' | 'blizzard' | 'void_explosion'

export interface ComboEffect {
  type: ComboEffectType
  x: number
  y: number
  startTime: number
  duration: number
}
