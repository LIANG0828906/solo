import type { Unit, Board, Position, BattleResult, Skill } from '@/types'
import {
  calculateElementMultiplier,
  getEffectType,
  applyDamage,
  applyHeal,
  getUnitAtPosition,
} from './Unit'
import { getDistance, getPositionsInRange, isPositionInList, getCell } from './Board'

export function calculateDamage(
  attacker: Unit,
  defender: Unit,
  board: Board
): { damage: number; elementMultiplier: number; isCritical: boolean } {
  const elementMultiplier = calculateElementMultiplier(attacker.element, defender.element)
  
  const cell = getCell(board, defender.x, defender.y)
  let eventMultiplier = 1
  if (cell?.eventType === 'fire_trap' && attacker.element === 'fire') {
    eventMultiplier = 2
  }
  if (cell?.eventType === 'shadow_mist') {
    if (Math.random() < 0.3) {
      return { damage: 0, elementMultiplier, isCritical: false }
    }
  }
  
  const baseDamage = Math.max(1, attacker.attack - defender.defense * 0.5)
  const isCritical = Math.random() < 0.15
  const critMultiplier = isCritical ? 1.5 : 1
  
  const finalDamage = Math.floor(
    baseDamage * elementMultiplier * eventMultiplier * critMultiplier
  )
  
  return { damage: finalDamage, elementMultiplier, isCritical }
}

export function executeAttack(
  attacker: Unit,
  defender: Unit,
  board: Board
): BattleResult {
  const { damage, elementMultiplier, isCritical } = calculateDamage(attacker, defender, board)
  
  const effectType = getEffectType(attacker.element, defender.element)
  
  const updatedDefender = applyDamage(defender, damage)
  const targetDefeated = !updatedDefender.isAlive
  
  return {
    damage,
    isCritical,
    elementMultiplier,
    targetDefeated,
    effectType,
  }
}

export function executeSkill(
  attacker: Unit,
  defender: Unit,
  skill: Skill,
  board: Board
): BattleResult {
  if (skill.effect === 'heal') {
    const healAmount = Math.abs(skill.damage)
    const isCritical = Math.random() < 0.2
    const finalHeal = Math.floor(healAmount * (isCritical ? 1.5 : 1))
    applyHeal(defender, finalHeal)
    return {
      damage: -finalHeal,
      isCritical,
      elementMultiplier: 1,
      targetDefeated: false,
      effectType: null,
    }
  }
  
  const { damage: baseDamage, elementMultiplier, isCritical } = calculateDamage(
    attacker,
    defender,
    board
  )
  
  const skillDamage = Math.floor(baseDamage * 0.5 + skill.damage)
  const effectType = getEffectType(attacker.element, defender.element)
  
  const updatedDefender = applyDamage(defender, skillDamage)
  const targetDefeated = !updatedDefender.isAlive
  
  return {
    damage: skillDamage,
    isCritical,
    elementMultiplier,
    targetDefeated,
    effectType,
  }
}

export function getMovablePositions(
  unit: Unit,
  board: Board,
  units: Unit[]
): Position[] {
  if (unit.hasMoved) return []
  
  const positions = getPositionsInRange(unit.x, unit.y, unit.moveRange, board.size)
  
  const cell = getCell(board, unit.x, unit.y)
  const moveCostMultiplier = cell?.eventType === 'ice_zone' ? 0.5 : 1
  
  return positions.filter(pos => {
    const occupyingUnit = getUnitAtPosition(units, pos.x, pos.y)
    if (occupyingUnit) return false
    
    const distance = getDistance(unit.x, unit.y, pos.x, pos.y)
    if (moveCostMultiplier < 1 && distance > Math.ceil(unit.moveRange * moveCostMultiplier)) {
      return false
    }
    
    return true
  })
}

export function getAttackablePositions(
  unit: Unit,
  board: Board,
  units: Unit[]
): Position[] {
  if (unit.hasAttacked) return []
  
  const positions = getPositionsInRange(unit.x, unit.y, unit.attackRange, board.size)
  
  return positions.filter(pos => {
    const targetUnit = getUnitAtPosition(units, pos.x, pos.y)
    if (!targetUnit) return false
    return targetUnit.faction !== unit.faction
  })
}

export function getSkillTargetPositions(
  unit: Unit,
  skill: Skill,
  board: Board,
  units: Unit[]
): Position[] {
  const positions = getPositionsInRange(unit.x, unit.y, skill.range, board.size)
  
  return positions.filter(pos => {
    const targetUnit = getUnitAtPosition(units, pos.x, pos.y)
    if (!targetUnit) return false
    
    if (skill.effect === 'heal') {
      return targetUnit.faction === unit.faction
    }
    return targetUnit.faction !== unit.faction
  })
}

export function checkGameEnd(units: Unit[]): 'light' | 'dark' | null {
  const lightAlive = units.some(u => u.faction === 'light' && u.isAlive)
  const darkAlive = units.some(u => u.faction === 'dark' && u.isAlive)
  
  if (!lightAlive) return 'dark'
  if (!darkAlive) return 'light'
  return null
}

export function processThunderStormEndTurn(
  board: Board,
  units: Unit[]
): { unit: Unit; damage: number }[] {
  const results: { unit: Unit; damage: number }[] = []
  
  for (let y = 0; y < board.size; y++) {
    for (let x = 0; x < board.size; x++) {
      const cell = getCell(board, x, y)
      if (cell?.eventType === 'thunder_storm') {
        const unit = getUnitAtPosition(units, x, y)
        if (unit) {
          const adjacentPositions = getPositionsInRange(x, y, 1, board.size)
          let chainDamage = 10
          
          results.push({ unit, damage: chainDamage })
          
          for (const adj of adjacentPositions) {
            const adjUnit = getUnitAtPosition(units, adj.x, adj.y)
            if (adjUnit && adjUnit.faction !== unit.faction) {
              chainDamage = Math.floor(chainDamage * 0.8)
              if (chainDamage > 0) {
                results.push({ unit: adjUnit, damage: chainDamage })
              }
            }
          }
        }
      }
    }
  }
  
  return results
}
