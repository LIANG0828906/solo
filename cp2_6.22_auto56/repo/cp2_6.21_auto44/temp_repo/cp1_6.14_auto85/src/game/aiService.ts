import type { Card, GameState, Owner } from './types'
import type { useCardStore } from './cardStore'

type StoreType = ReturnType<typeof useCardStore>

export interface PlayDecision {
  card: Card
  row: number
  col: number
  score: number
}

export interface AttackDecision {
  attackerId: string
  targetCardId?: string
  targetOwner?: Owner
  score: number
}

function getCellScore(state: GameState, row: number, col: number, card: Card): number {
  let score = 0
  const oppositeRow = card.owner === 'enemy' ? 2 : 0
  score += (2 - Math.abs(row - oppositeRow)) * 3
  if (col === 2) score += 2
  if (col === 1 || col === 3) score += 1

  for (let c = 0; c < 5; c++) {
    const near = state.grid[oppositeRow][c].card
    if (near && Math.abs(c - col) <= 1) {
      if (near.health <= card.attack) score += 5
      score += 2
    }
  }

  const friendlyNeighbors = [
    [row - 1, col], [row + 1, col], [row, col - 1], [row, col + 1]
  ]
  for (const [r, c] of friendlyNeighbors) {
    if (r >= 0 && r < 3 && c >= 0 && c < 5) {
      const nb = state.grid[r][c].card
      if (nb && nb.owner === card.owner) score += 1
    }
  }

  return score
}

export function getAIPlayDecision(state: GameState): PlayDecision | null {
  const mana = state.enemyMana
  const hand = state.enemyHand
  const validCells = state.enemyMana >= 0 ? [] as { row: number; col: number }[] : []

  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 5; c++) {
      if (!state.grid[r][c].card) {
        validCells.push({ row: r, col: c })
      }
    }
  }

  if (validCells.length === 0) return null

  const decisions: PlayDecision[] = []
  const enemyCardsOnField = state.grid.flat().filter(cell => cell.card?.owner === 'enemy').length
  const playerCardsOnField = state.grid.flat().filter(cell => cell.card?.owner === 'player').length

  for (const card of hand) {
    if (card.cost > mana) continue

    for (const pos of validCells) {
      let score = 0

      score += card.cost * 4
      score += card.attack * 3
      score += card.health * 2

      if (enemyCardsOnField < playerCardsOnField) score += 8
      if (enemyCardsOnField === 0) score += 5

      if (card.skill === 'taunt') {
        if (playerCardsOnField > 0) score += 6
        score += 3
      }
      if (card.skill === 'heal') {
        const missingHp = state.enemyMaxHealth - state.enemyHealth
        score += Math.min(missingHp, (card.skillValue ?? 3)) * 2
      }
      if (card.skill === 'combo') {
        score += 5
      }

      if (card.rarity === 'legendary') score += 4
      if (card.rarity === 'epic') score += 2

      score += getCellScore(state, pos.row, pos.col, card)

      decisions.push({ card, row: pos.row, col: pos.col, score })
    }
  }

  if (decisions.length === 0) return null
  decisions.sort((a, b) => b.score - a.score)
  return decisions[0]
}

export function getAIAttackDecision(state: GameState): AttackDecision | null {
  const attackers: Card[] = []
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const card = state.grid[r][c].card
      if (card && card.owner === 'enemy' && card.canAttack) {
        attackers.push(card)
      }
    }
  }

  if (attackers.length === 0) return null

  const playerTaunts: Card[] = []
  const playerField: Card[] = []
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const card = state.grid[r][c].card
      if (card && card.owner === 'player') {
        playerField.push(card)
        if (card.skill === 'taunt') playerTaunts.push(card)
      }
    }
  }

  const decisions: AttackDecision[] = []

  for (const attacker of attackers) {
    const targets = playerTaunts.length > 0 ? playerTaunts : playerField

    for (const target of targets) {
      let score = 0

      if (attacker.attack >= target.health) {
        score += 15
        score += target.attack * 2
        score += target.maxHealth
      } else {
        score += attacker.attack * 2
      }

      if (target.skill === 'taunt') score += 4
      if (target.skill === 'heal') score += 6
      if (target.skill === 'combo') score += 5

      score += (10 - target.health)
      score -= Math.max(0, target.attack - attacker.health) * 3

      decisions.push({
        attackerId: attacker.id,
        targetCardId: target.id,
        score
      })
    }

    if (playerTaunts.length === 0) {
      let faceScore = attacker.attack * 3
      if (state.playerHealth <= attacker.attack) faceScore += 1000
      if (state.playerHealth <= 10) faceScore += 20
      if (playerField.length === 0) faceScore += 10

      decisions.push({
        attackerId: attacker.id,
        targetOwner: 'player',
        score: faceScore
      })
    }
  }

  if (decisions.length === 0) return null
  decisions.sort((a, b) => b.score - a.score)
  return decisions[0].score > 0 ? decisions[0] : null
}

export async function executeAITurn(
  store: StoreType,
  onPlayCard: (card: Card, row: number, col: number) => void,
  onAttack: (attackerId: string, targetCardId?: string, targetOwner?: Owner) => void,
  delay: number = 800
): Promise<void> {
  store.startEnemyTurn()
  await wait(delay)

  let guard = 0
  while (guard < 20) {
    guard++
    const decision = getAIPlayDecision(store.$state)
    if (!decision) break
    const result = store.playCard(decision.card.id, decision.row, decision.col)
    if (!result) break
    onPlayCard(result, decision.row, decision.col)
    await wait(delay)
  }

  guard = 0
  while (guard < 20) {
    guard++
    const decision = getAIAttackDecision(store.$state)
    if (!decision) break
    store.attack(decision.attackerId, decision.targetCardId, decision.targetOwner)
    onAttack(decision.attackerId, decision.targetCardId, decision.targetOwner)
    if (store.winner) return
    await wait(delay)
  }
}

function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}
