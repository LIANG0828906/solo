import {
  Unit,
  getElementCounterMultiplier,
  ELEMENT_COUNTER_NAME,
  ElementType,
  StatusEffect
} from '../data/GameData'
import { CardEffect } from './CardSystem'

export interface BattleResult {
  damage: number
  isCritical: boolean
  counterType: 'counter' | 'countered' | 'neutral'
  counterText: string
  targetUnitId: string
  sourceUnitId: string
}

export interface BattleLogEntry {
  id: number
  message: string
  type: 'info' | 'damage' | 'skill' | 'counter' | 'system'
  timestamp: number
}

export class BattleSystem {
  private battleLogs: BattleLogEntry[] = []
  private logIdCounter = 0
  private readonly maxLogs = 20

  calculateAttack(attacker: Unit, defender: Unit): BattleResult {
    const multiplier = getElementCounterMultiplier(attacker.element, defender.element)
    const baseDamage = Math.max(1, attacker.attack - defender.defense)
    const finalDamage = Math.floor(baseDamage * multiplier)

    let counterType: 'counter' | 'countered' | 'neutral' = 'neutral'
    let counterText = ''

    if (multiplier > 1) {
      counterType = 'counter'
      counterText = ELEMENT_COUNTER_NAME[attacker.element]
    } else if (multiplier < 1) {
      counterType = 'countered'
      counterText = ELEMENT_COUNTER_NAME[defender.element]
    }

    return {
      damage: finalDamage,
      isCritical: multiplier > 1,
      counterType,
      counterText,
      targetUnitId: defender.id,
      sourceUnitId: attacker.id
    }
  }

  applyDamage(target: Unit, damage: number): number {
    let remainingDamage = damage

    if (target.shield > 0) {
      if (target.shield >= remainingDamage) {
        target.shield -= remainingDamage
        return 0
      } else {
        remainingDamage -= target.shield
        target.shield = 0
      }
    }

    target.hp = Math.max(0, target.hp - remainingDamage)
    return remainingDamage
  }

  applySkillEffect(skillEffect: CardEffect, source: Unit, target: Unit): string {
    const skill = skillEffect.skill
    if (!skill) return ''

    let message = ''

    switch (skill.type) {
      case 'armorBreak':
        const armorReduce = Math.floor(target.baseDefense * skill.value)
        target.defense = Math.max(0, target.defense - armorReduce)
        this.addStatusEffect(target, 'armorBreak', skill.value, skill.duration)
        message = `${source.name} 对 ${target.name} 使用破甲，防御降低${Math.floor(skill.value * 100)}%`
        break

      case 'entangle':
        target.isStunned = true
        this.addStatusEffect(target, 'entangle', 1, skill.duration)
        message = `${source.name} 对 ${target.name} 使用缠绕，无法行动${skill.duration}回合`
        break

      case 'shield':
        source.shield += skill.value
        this.addStatusEffect(source, 'shield', skill.value, skill.duration)
        message = `${source.name} 使用护盾，获得${skill.value}点护盾`
        break

      case 'burn':
        this.addStatusEffect(target, 'burn', skill.value, skill.duration)
        message = `${source.name} 对 ${target.name} 施加灼烧，每回合造成${skill.value}点伤害`
        break
    }

    source.skillCooldown = 3
    return message
  }

  private addStatusEffect(unit: Unit, type: StatusEffect['type'], value: number, duration: number): void {
    const existing = unit.statusEffects.find(e => e.type === type)
    if (existing) {
      existing.value = Math.max(existing.value, value)
      existing.remainingTurns = Math.max(existing.remainingTurns, duration)
    } else {
      unit.statusEffects.push({ type, value, remainingTurns: duration })
    }
  }

  processTurnStart(unit: Unit): string[] {
    const messages: string[] = []

    unit.isStunned = false

    const burnEffect = unit.statusEffects.find(e => e.type === 'burn')
    if (burnEffect) {
      unit.hp = Math.max(0, unit.hp - burnEffect.value)
      messages.push(`${unit.name} 受到 ${burnEffect.value} 点灼烧伤害`)
    }

    const entangleEffect = unit.statusEffects.find(e => e.type === 'entangle')
    if (entangleEffect) {
      unit.isStunned = true
    }

    const armorEffect = unit.statusEffects.find(e => e.type === 'armorBreak')
    if (armorEffect) {
      unit.defense = Math.max(0, Math.floor(unit.baseDefense * (1 - armorEffect.value)))
    } else {
      unit.defense = unit.baseDefense
    }

    return messages
  }

  processTurnEnd(unit: Unit): void {
    if (unit.skillCooldown > 0) {
      unit.skillCooldown--
    }

    unit.statusEffects = unit.statusEffects
      .map(e => ({ ...e, remainingTurns: e.remainingTurns - 1 }))
      .filter(e => e.remainingTurns > 0)

    if (!unit.statusEffects.find(e => e.type === 'armorBreak')) {
      unit.defense = unit.baseDefense
    }
  }

  addLog(message: string, type: BattleLogEntry['type'] = 'info'): void {
    this.battleLogs.unshift({
      id: this.logIdCounter++,
      message,
      type,
      timestamp: Date.now()
    })

    if (this.battleLogs.length > this.maxLogs) {
      this.battleLogs.pop()
    }
  }

  getBattleLogs(): BattleLogEntry[] {
    return [...this.battleLogs]
  }

  checkGameOver(playerUnits: Unit[], aiUnits: Unit[]): 'playing' | 'playerWin' | 'aiWin' {
    const playerAlive = playerUnits.some(u => u.hp > 0)
    const aiAlive = aiUnits.some(u => u.hp > 0)

    if (!aiAlive) return 'playerWin'
    if (!playerAlive) return 'aiWin'
    return 'playing'
  }

  getWeakestUnit(units: Unit[]): Unit | null {
    const aliveUnits = units.filter(u => u.hp > 0)
    if (aliveUnits.length === 0) return null
    return aliveUnits.reduce((weakest, unit) =>
      unit.hp < weakest.hp ? unit : weakest
    )
  }

  getCounterElement(element: ElementType): ElementType {
    const counterMap: Record<ElementType, ElementType> = {
      gold: 'fire',
      wood: 'gold',
      water: 'earth',
      fire: 'water',
      earth: 'wood'
    }
    return counterMap[element]
  }
}
