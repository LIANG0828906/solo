import { v4 as uuidv4 } from 'uuid'
import type { Unit, UnitType, Element, Faction, Skill, Position } from '@/types'
import { getDistance } from './Board'

const ELEMENT_MULTIPLIERS: Record<Element, Element | null> = {
  fire: 'ice',
  ice: 'thunder',
  thunder: 'dark',
  dark: 'fire',
}

const UNIT_STATS: Record<UnitType, { hp: number; mp: number; attack: number; defense: number; moveRange: number; attackRange: number }> = {
  warrior: { hp: 120, mp: 30, attack: 25, defense: 15, moveRange: 2, attackRange: 1 },
  mage: { hp: 70, mp: 80, attack: 35, defense: 5, moveRange: 2, attackRange: 3 },
  archer: { hp: 80, mp: 40, attack: 30, defense: 8, moveRange: 3, attackRange: 4 },
  assassin: { hp: 90, mp: 50, attack: 40, defense: 6, moveRange: 4, attackRange: 1 },
  priest: { hp: 60, mp: 100, attack: 15, defense: 10, moveRange: 2, attackRange: 2 },
  warlock: { hp: 85, mp: 70, attack: 38, defense: 7, moveRange: 2, attackRange: 3 },
}

const SKILLS: Record<UnitType, Skill[]> = {
  warrior: [
    { id: 'w1', name: '重击', mpCost: 15, damage: 40, range: 1, effect: 'stun', description: '对敌人造成重击伤害' },
  ],
  mage: [
    { id: 'm1', name: '元素爆发', mpCost: 30, damage: 55, range: 3, effect: 'aoe', description: '释放强力元素魔法' },
  ],
  archer: [
    { id: 'a1', name: '穿透箭', mpCost: 20, damage: 45, range: 5, effect: 'pierce', description: '发射穿透性箭矢' },
  ],
  assassin: [
    { id: 'as1', name: '背刺', mpCost: 25, damage: 60, range: 1, effect: 'critical', description: '从背后袭击造成致命伤害' },
  ],
  priest: [
    { id: 'p1', name: '治愈术', mpCost: 25, damage: -40, range: 2, effect: 'heal', description: '恢复友方单位生命值' },
  ],
  warlock: [
    { id: 'wl1', name: '暗影诅咒', mpCost: 35, damage: 50, range: 3, effect: 'curse', description: '释放黑暗诅咒侵蚀敌人' },
  ],
}

const UNIT_NAMES: Record<Faction, Record<UnitType, string>> = {
  light: {
    warrior: '光明战士',
    mage: '元素法师',
    archer: '精灵弓手',
    assassin: '圣光刺客',
    priest: '神圣牧师',
    warlock: '秘法术士',
  },
  dark: {
    warrior: '暗影战士',
    mage: '冰霜法师',
    archer: '黑暗弓手',
    assassin: '暗影刺客',
    priest: '邪恶牧师',
    warlock: '混沌术士',
  },
}

export function createUnit(
  type: UnitType,
  faction: Faction,
  element: Element,
  x: number,
  y: number
): Unit {
  const stats = UNIT_STATS[type]
  return {
    id: uuidv4(),
    name: UNIT_NAMES[faction][type],
    faction,
    element,
    type,
    hp: stats.hp,
    maxHp: stats.hp,
    mp: stats.mp,
    maxMp: stats.mp,
    attack: stats.attack,
    defense: stats.defense,
    moveRange: stats.moveRange,
    attackRange: stats.attackRange,
    x,
    y,
    isAlive: true,
    skills: SKILLS[type],
    hasMoved: false,
    hasAttacked: false,
  }
}

export function calculateElementMultiplier(
  attackerElement: Element,
  defenderElement: Element
): number {
  if (ELEMENT_MULTIPLIERS[attackerElement] === defenderElement) {
    return 2.0
  }
  if (ELEMENT_MULTIPLIERS[defenderElement] === attackerElement) {
    return 0.5
  }
  return 1.0
}

export function getEffectType(
  attackerElement: Element,
  defenderElement: Element
): 'fire_burst' | 'ice_shard' | 'lightning' | 'shadow_devour' | null {
  const multiplier = calculateElementMultiplier(attackerElement, defenderElement)
  if (multiplier === 2.0) {
    switch (attackerElement) {
      case 'fire': return 'fire_burst'
      case 'ice': return 'ice_shard'
      case 'thunder': return 'lightning'
      case 'dark': return 'shadow_devour'
    }
  }
  return null
}

export function applyDamage(unit: Unit, damage: number): Unit {
  const newHp = Math.max(0, unit.hp - damage)
  return {
    ...unit,
    hp: newHp,
    isAlive: newHp > 0,
  }
}

export function applyHeal(unit: Unit, amount: number): Unit {
  return {
    ...unit,
    hp: Math.min(unit.maxHp, unit.hp + amount),
  }
}

export function isInRange(
  unit: Unit,
  targetX: number,
  targetY: number,
  rangeType: 'move' | 'attack'
): boolean {
  const range = rangeType === 'move' ? unit.moveRange : unit.attackRange
  const distance = getDistance(unit.x, unit.y, targetX, targetY)
  return distance <= range && distance > 0
}

export function getManaRegen(currentMana: number, maxMana: number): number {
  return Math.min(maxMana, currentMana + Math.floor(maxMana * 0.05))
}

export function resetUnitActions(units: Unit[]): Unit[] {
  return units.map(unit => ({
    ...unit,
    hasMoved: false,
    hasAttacked: false,
  }))
}

export function getUnitAtPosition(units: Unit[], x: number, y: number): Unit | undefined {
  return units.find(u => u.isAlive && u.x === x && u.y === y)
}

export function getUnitsByFaction(units: Unit[], faction: Faction): Unit[] {
  return units.filter(u => u.isAlive && u.faction === faction)
}
