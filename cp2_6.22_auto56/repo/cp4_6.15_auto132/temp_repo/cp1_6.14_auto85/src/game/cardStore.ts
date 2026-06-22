import { defineStore } from 'pinia'
import type { Card, GridCell, GameState, Owner, Rarity, Skill } from './types'

const CARD_NAMES: Record<Rarity, string[]> = {
  common: ['哨兵', '新兵', '弓箭手', '侍从', '学徒', '民兵', '斥候', '守卫'],
  rare: ['骑士', '法师', '游侠', '牧师', '狂战士', '刺客', '圣骑士', '元素师'],
  epic: ['龙骑士', '大魔导师', '圣堂武士', '暗影领主', '战争使者', '星辰祭司'],
  legendary: ['永恒之王', '虚空之主', '创世神龙', '时空守护者', '星辰大帝']
}

const SKILLS: Skill[] = ['combo', 'taunt', 'heal']

let idCounter = 0
function genId(): string {
  return `card_${Date.now()}_${++idCounter}`
}

function randomRarity(): Rarity {
  const r = Math.random()
  if (r < 0.55) return 'common'
  if (r < 0.8) return 'rare'
  if (r < 0.95) return 'epic'
  return 'legendary'
}

function generateCard(owner: Owner, forceCost?: number): Card {
  const rarity = randomRarity()
  const cost = forceCost ?? Math.max(1, Math.min(10,
    rarity === 'common' ? Math.floor(Math.random() * 4) + 1
    : rarity === 'rare' ? Math.floor(Math.random() * 4) + 2
    : rarity === 'epic' ? Math.floor(Math.random() * 3) + 4
    : Math.floor(Math.random() * 3) + 6
  ))
  const baseAtk = Math.floor(cost * 1.1) + Math.floor(Math.random() * 2)
  const baseHp = Math.floor(cost * 1.3) + Math.floor(Math.random() * 2) + 1
  const nameList = CARD_NAMES[rarity]
  const name = nameList[Math.floor(Math.random() * nameList.length)]

  let skill: Skill | undefined
  let skillValue: number | undefined
  if (rarity !== 'common' && Math.random() < 0.65) {
    skill = SKILLS[Math.floor(Math.random() * SKILLS.length)]
    skillValue = skill === 'heal' ? Math.max(2, Math.floor(cost * 0.8))
      : skill === 'combo' ? 2
      : 1
  }

  return {
    id: genId(),
    name,
    cost,
    attack: Math.max(1, baseAtk),
    health: Math.max(1, baseHp),
    maxHealth: Math.max(1, baseHp),
    rarity,
    skill,
    skillValue,
    owner,
    canAttack: false,
    justPlaced: false
  }
}

function generateDeck(owner: Owner): Card[] {
  const deck: Card[] = []
  for (let i = 0; i < 30; i++) {
    deck.push(generateCard(owner))
  }
  return shuffle(deck)
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function createEmptyGrid(): GridCell[][] {
  const grid: GridCell[][] = []
  for (let r = 0; r < 3; r++) {
    const row: GridCell[] = []
    for (let c = 0; c < 5; c++) {
      const zone = r === 0 ? 'enemy' : r === 2 ? 'player' : 'neutral'
      row.push({
        row: r,
        col: c,
        zone,
        card: null,
        isHighlighted: false,
        isValidTarget: false
      })
    }
    grid.push(row)
  }
  return grid
}

export const useCardStore = defineStore('card', {
  state: (): GameState => ({
    turn: 1,
    phase: 'player',
    winner: null,

    playerHealth: 30,
    playerMaxHealth: 30,
    playerMana: 1,
    playerMaxMana: 1,
    playerHealthDamaged: false,

    enemyHealth: 30,
    enemyMaxHealth: 30,
    enemyMana: 1,
    enemyMaxMana: 1,
    enemyHealthDamaged: false,

    playerHand: [],
    enemyHand: [],
    playerDeck: [],
    enemyDeck: [],

    grid: createEmptyGrid(),

    stats: {
      playerDamage: 0,
      enemyDamage: 0,
      playerKills: 0,
      enemyKills: 0,
      playerHeal: 0,
      enemyHeal: 0
    }
  }),

  getters: {
    playerFieldCards(state): Card[] {
      const cards: Card[] = []
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          const card = state.grid[r][c].card
          if (card && card.owner === 'player') cards.push(card)
        }
      }
      return cards
    },
    enemyFieldCards(state): Card[] {
      const cards: Card[] = []
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          const card = state.grid[r][c].card
          if (card && card.owner === 'enemy') cards.push(card)
        }
      }
      return cards
    },
    canPlayCard: (state) => (cost: number) => {
      if (state.phase !== 'player' || state.winner) return false
      return state.playerMana >= cost
    },
    validPlaceCells(state): { row: number; col: number }[] {
      const positions: { row: number; col: number }[] = []
      for (let r = 1; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          if (!state.grid[r][c].card) {
            positions.push({ row: r, col: c })
          }
        }
      }
      return positions
    },
    validEnemyPlaceCells(state): { row: number; col: number }[] {
      const positions: { row: number; col: number }[] = []
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 5; c++) {
          if (!state.grid[r][c].card) {
            positions.push({ row: r, col: c })
          }
        }
      }
      return positions
    },
    enemyTauntCards(): Card[] {
      return this.enemyFieldCards.filter(c => c.skill === 'taunt')
    },
    playerTauntCards(): Card[] {
      return this.playerFieldCards.filter(c => c.skill === 'taunt')
    }
  },

  actions: {
    initGame() {
      this.turn = 1
      this.phase = 'player'
      this.winner = null

      this.playerHealth = 30
      this.playerMaxHealth = 30
      this.playerMana = 1
      this.playerMaxMana = 1
      this.playerHealthDamaged = false

      this.enemyHealth = 30
      this.enemyMaxHealth = 30
      this.enemyMana = 1
      this.enemyMaxMana = 1
      this.enemyHealthDamaged = false

      this.playerDeck = generateDeck('player')
      this.enemyDeck = generateDeck('enemy')
      this.playerHand = []
      this.enemyHand = []
      this.grid = createEmptyGrid()

      this.stats = {
        playerDamage: 0,
        enemyDamage: 0,
        playerKills: 0,
        enemyKills: 0,
        playerHeal: 0,
        enemyHeal: 0
      }

      for (let i = 0; i < 4; i++) {
        this.drawCard('player')
        this.drawCard('enemy')
      }
    },

    drawCard(owner: Owner) {
      const deck = owner === 'player' ? this.playerDeck : this.enemyDeck
      const hand = owner === 'player' ? this.playerHand : this.enemyHand
      if (deck.length === 0) {
        deck.push(generateCard(owner))
      }
      const card = deck.shift()
      if (card && hand.length < 10) {
        card.owner = owner
        hand.push(card)
      }
    },

    playCard(cardId: string, row: number, col: number): Card | null {
      const hand = this.phase === 'player' ? this.playerHand : this.enemyHand
      const mana = this.phase === 'player' ? 'playerMana' : 'enemyMana'
      const idx = hand.findIndex(c => c.id === cardId)
      if (idx === -1) return null
      const card = hand[idx]
      if (this[mana as keyof GameState] as number < card.cost) return null
      if (this.grid[row][col].card) return null

      const validZones = this.phase === 'player'
        ? ['player', 'neutral']
        : ['enemy', 'neutral']
      if (!validZones.includes(this.grid[row][col].zone)) return null

      hand.splice(idx, 1)
      card.position = { row, col }
      card.justPlaced = true
      card.canAttack = false
      this.grid[row][col].card = card
      ;(this as any)[mana] -= card.cost

      if (card.skill === 'heal') {
        this.applyHeal(card.owner, card.skillValue ?? 3)
      }

      return card
    },

    applyHeal(owner: Owner, amount: number) {
      if (owner === 'player') {
        this.playerHealth = Math.min(this.playerMaxHealth, this.playerHealth + amount)
        this.stats.playerHeal += amount
      } else {
        this.enemyHealth = Math.min(this.enemyMaxHealth, this.enemyHealth + amount)
        this.stats.enemyHeal += amount
      }
    },

    findCardById(id: string): Card | null {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          if (this.grid[r][c].card?.id === id) return this.grid[r][c].card!
        }
      }
      return null
    },

    attack(attackerId: string, targetCardId?: string, targetOwner?: Owner): { attackerDmg: number; targetDmg: number; targetKilled: boolean; attackerKilled: boolean } | null {
      const attacker = this.findCardById(attackerId)
      if (!attacker || !attacker.canAttack) return null

      const owner = attacker.owner
      const tauntCards = owner === 'player' ? this.enemyTauntCards : this.playerTauntCards

      if (targetCardId) {
        const target = this.findCardById(targetCardId)
        if (!target || target.owner === owner) return null
        if (tauntCards.length > 0 && target.skill !== 'taunt') return null
      } else if (targetOwner && targetOwner !== owner) {
        if (tauntCards.length > 0) return null
      } else {
        return null
      }

      const atkCount = attacker.skill === 'combo' ? (attacker.skillValue ?? 2) : 1
      let totalTargetDmg = 0
      let totalAttackerDmg = 0
      let targetKilled = false
      let attackerKilled = false

      for (let i = 0; i < atkCount; i++) {
        if (targetCardId) {
          const target = this.findCardById(targetCardId)
          if (!target) break
          const dmgToTarget = attacker.attack
          target.health -= dmgToTarget
          totalTargetDmg += dmgToTarget
          if (owner === 'player') this.stats.playerDamage += dmgToTarget
          else this.stats.enemyDamage += dmgToTarget

          if (target.health <= 0) {
            const pos = target.position!
            this.grid[pos.row][pos.col].card = null
            targetKilled = true
            if (target.owner === 'player') this.stats.enemyKills++
            else this.stats.playerKills++
            break
          }

          if (i === 0) {
            const counterDmg = target.attack
            attacker.health -= counterDmg
            totalAttackerDmg += counterDmg
            if (owner === 'player') this.stats.enemyDamage += counterDmg
            else this.stats.playerDamage += counterDmg
            if (attacker.health <= 0) {
              const pos = attacker.position!
              this.grid[pos.row][pos.col].card = null
              attackerKilled = true
            }
          }
        } else if (targetOwner) {
          const dmg = attacker.attack
          totalTargetDmg += dmg
          if (targetOwner === 'player') {
            this.playerHealth -= dmg
            this.playerHealthDamaged = true
            this.stats.enemyDamage += dmg
            setTimeout(() => { this.playerHealthDamaged = false }, 400)
          } else {
            this.enemyHealth -= dmg
            this.enemyHealthDamaged = true
            this.stats.playerDamage += dmg
            setTimeout(() => { this.enemyHealthDamaged = false }, 400)
          }
        }
      }

      if (!attackerKilled && attacker.position) {
        attacker.canAttack = false
      }

      this.checkWinner()
      return { attackerDmg: totalAttackerDmg, targetDmg: totalTargetDmg, targetKilled, attackerKilled }
    },

    checkWinner() {
      if (this.playerHealth <= 0) {
        this.winner = 'enemy'
        this.phase = 'ended'
      } else if (this.enemyHealth <= 0) {
        this.winner = 'player'
        this.phase = 'ended'
      }
    },

    endTurn() {
      if (this.phase === 'player') {
        this.phase = 'enemy'
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 5; c++) {
            const card = this.grid[r][c].card
            if (card) card.justPlaced = false
          }
        }
      } else if (this.phase === 'enemy') {
        this.turn++
        this.phase = 'player'
        this.playerMaxMana = Math.min(10, this.playerMaxMana + 1)
        this.playerMana = this.playerMaxMana
        this.drawCard('player')
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 5; c++) {
            const card = this.grid[r][c].card
            if (card && card.owner === 'player') {
              card.canAttack = true
              card.justPlaced = false
            }
          }
        }
      }
    },

    startEnemyTurn() {
      this.enemyMaxMana = Math.min(10, this.enemyMaxMana + 1)
      this.enemyMana = this.enemyMaxMana
      this.drawCard('enemy')
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          const card = this.grid[r][c].card
          if (card && card.owner === 'enemy') {
            card.canAttack = true
            card.justPlaced = false
          }
        }
      }
    },

    setCellHighlight(row: number, col: number, val: boolean) {
      if (this.grid[row] && this.grid[row][col]) {
        this.grid[row][col].isHighlighted = val
      }
    },

    clearHighlights() {
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          this.grid[r][c].isHighlighted = false
          this.grid[r][c].isValidTarget = false
        }
      }
    },

    markAttackTargets(attackerId: string) {
      this.clearHighlights()
      const attacker = this.findCardById(attackerId)
      if (!attacker || !attacker.canAttack) return
      const enemyOwner = attacker.owner === 'player' ? 'enemy' : 'player'
      const tauntCards = enemyOwner === 'player' ? this.playerTauntCards : this.enemyTauntCards

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 5; c++) {
          const card = this.grid[r][c].card
          if (!card) continue
          if (card.owner !== attacker.owner) {
            if (tauntCards.length > 0) {
              if (card.skill === 'taunt') {
                this.grid[r][c].isValidTarget = true
                this.grid[r][c].isHighlighted = true
              }
            } else {
              this.grid[r][c].isValidTarget = true
              this.grid[r][c].isHighlighted = true
            }
          }
        }
      }
    }
  }
})
