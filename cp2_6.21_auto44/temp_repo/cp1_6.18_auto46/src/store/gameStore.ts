import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export type RuneType = 'fire' | 'ice' | 'thunder' | 'wind'

export interface Rune {
  id: string
  type: RuneType
}

export interface FloatingNumber {
  id: string
  value: number
  type: 'damage' | 'heal'
  x: number
  y: number
}

export interface StatusEffect {
  id: string
  type: 'burn' | 'freeze'
  duration: number
  damage?: number
}

export type GamePhase = 'idle' | 'countdown' | 'player_turn' | 'monster_attack' | 'victory' | 'defeat'

interface GameState {
  playerHealth: number
  playerMaxHealth: number
  playerMana: number
  playerMaxMana: number
  monsterHealth: number
  monsterMaxHealth: number
  monsterName: string
  monsterAttackDamage: number
  selectedRunes: Rune[]
  maxRunes: number
  runeGrid: Rune[]
  combo: number
  lastRuneTypes: RuneType[]
  gamePhase: GamePhase
  countdownNumber: number
  floatingNumbers: FloatingNumber[]
  monsterStatusEffects: StatusEffect[]
  isMonsterHurt: boolean
  isMonsterAttacking: boolean
  isVictoryAnimation: boolean
  isDefeatAnimation: boolean

  selectRune: (rune: Rune) => void
  deselectRune: (runeId: string) => void
  clearRunes: () => void
  castSpell: () => void
  monsterAttack: () => void
  startNewTurn: () => void
  startGame: () => void
  resetBattle: () => void
  addFloatingNumber: (value: number, type: 'damage' | 'heal', x: number, y: number) => void
  removeFloatingNumber: (id: string) => void
  setCountdownNumber: (num: number) => void
  setGamePhase: (phase: GamePhase) => void
  setMonsterHurt: (hurt: boolean) => void
  setMonsterAttacking: (attacking: boolean) => void
  processStatusEffects: () => void
}

const RUNE_TYPES: RuneType[] = ['fire', 'ice', 'thunder', 'wind']

const generateRuneGrid = (): Rune[] => {
  const grid: Rune[] = []
  for (let i = 0; i < 9; i++) {
    const type = RUNE_TYPES[Math.floor(Math.random() * RUNE_TYPES.length)]
    grid.push({ id: uuidv4(), type })
  }
  return grid
}

const calculateSpellDamage = (runes: Rune[]): { damage: number; effects: StatusEffect[] } => {
  let baseDamage = 0
  const effects: StatusEffect[] = []

  runes.forEach(rune => {
    switch (rune.type) {
      case 'fire':
        baseDamage += 15
        break
      case 'ice':
        baseDamage += 12
        break
      case 'thunder':
        baseDamage += 18
        break
      case 'wind':
        baseDamage += 10
        break
    }
  })

  const typeCounts: Record<RuneType, number> = {
    fire: 0,
    ice: 0,
    thunder: 0,
    wind: 0,
  }

  runes.forEach(rune => {
    typeCounts[rune.type]++
  })

  if (typeCounts.fire >= 2) {
    effects.push({
      id: uuidv4(),
      type: 'burn',
      duration: 3,
      damage: 5,
    })
    baseDamage += 10
  }

  if (typeCounts.ice >= 2) {
    effects.push({
      id: uuidv4(),
      type: 'freeze',
      duration: 1,
    })
    baseDamage += 5
  }

  if (typeCounts.thunder >= 2) {
    baseDamage += 20
  }

  if (typeCounts.wind >= 2) {
    baseDamage += 8
  }

  return { damage: baseDamage, effects }
}

export const useGameStore = create<GameState>((set, get) => ({
  playerHealth: 100,
  playerMaxHealth: 100,
  playerMana: 50,
  playerMaxMana: 50,
  monsterHealth: 150,
  monsterMaxHealth: 150,
  monsterName: '暗影魔狼',
  monsterAttackDamage: 15,
  selectedRunes: [],
  maxRunes: 3,
  runeGrid: generateRuneGrid(),
  combo: 0,
  lastRuneTypes: [],
  gamePhase: 'idle',
  countdownNumber: 3,
  floatingNumbers: [],
  monsterStatusEffects: [],
  isMonsterHurt: false,
  isMonsterAttacking: false,
  isVictoryAnimation: false,
  isDefeatAnimation: false,

  selectRune: (rune: Rune) => {
    const { selectedRunes, maxRunes, gamePhase } = get()
    if (gamePhase !== 'player_turn') return
    if (selectedRunes.length >= maxRunes) return
    if (selectedRunes.some(r => r.id === rune.id)) return

    set(state => ({
      selectedRunes: [...state.selectedRunes, rune],
    }))
  },

  deselectRune: (runeId: string) => {
    set(state => ({
      selectedRunes: state.selectedRunes.filter(r => r.id !== runeId),
    }))
  },

  clearRunes: () => {
    set({ selectedRunes: [] })
  },

  castSpell: () => {
    const { selectedRunes, monsterHealth, combo, lastRuneTypes, playerMana } = get()
    if (selectedRunes.length === 0) return
    if (playerMana < 10) return

    const { damage, effects } = calculateSpellDamage(selectedRunes)
    const currentRuneTypes = selectedRunes.map(r => r.type)

    let newCombo = combo
    const hasSameType = currentRuneTypes.some(type => lastRuneTypes.includes(type))
    if (hasSameType) {
      newCombo = combo + 1
    } else {
      newCombo = 1
    }

    const comboDamageMultiplier = 1 + (newCombo - 1) * 0.1
    const finalDamage = Math.floor(damage * comboDamageMultiplier)

    const newMonsterHealth = Math.max(0, monsterHealth - finalDamage)

    set(state => ({
      monsterHealth: newMonsterHealth,
      playerMana: state.playerMana - 10,
      selectedRunes: [],
      runeGrid: generateRuneGrid(),
      combo: newCombo,
      lastRuneTypes: currentRuneTypes,
      isMonsterHurt: true,
      monsterStatusEffects: [...state.monsterStatusEffects, ...effects],
    }))

    setTimeout(() => {
      set({ isMonsterHurt: false })
    }, 600)

    if (newMonsterHealth <= 0) {
      set({ gamePhase: 'victory', isVictoryAnimation: true })
    }
  },

  monsterAttack: () => {
    const { playerHealth, monsterAttackDamage, monsterStatusEffects } = get()

    const isFrozen = monsterStatusEffects.some(e => e.type === 'freeze' && e.duration > 0)
    if (isFrozen) {
      set(state => ({
        monsterStatusEffects: state.monsterStatusEffects
          .map(e => e.type === 'freeze' ? { ...e, duration: e.duration - 1 } : e)
          .filter(e => e.duration > 0),
        gamePhase: 'player_turn',
      }))
      return
    }

    set({ isMonsterAttacking: true })

    setTimeout(() => {
      const newHealth = Math.max(0, playerHealth - monsterAttackDamage)

      set(state => ({
        playerHealth: newHealth,
        isMonsterAttacking: false,
        gamePhase: newHealth <= 0 ? 'defeat' : 'player_turn',
        isDefeatAnimation: newHealth <= 0,
      }))

      if (newHealth <= 0) {
        set({ gamePhase: 'defeat' })
      }
    }, 300)
  },

  startNewTurn: () => {
    const { gamePhase } = get()
    if (gamePhase === 'victory' || gamePhase === 'defeat') return

    set({ gamePhase: 'countdown', countdownNumber: 3 })

    let count = 3
    const countdownInterval = setInterval(() => {
      count--
      set({ countdownNumber: count })
      if (count <= 0) {
        clearInterval(countdownInterval)
        get().processStatusEffects()
        setTimeout(() => {
          get().monsterAttack()
        }, 300)
      }
    }, 1000)
  },

  startGame: () => {
    get().resetBattle()
    set({ gamePhase: 'countdown', countdownNumber: 3 })

    let count = 3
    const countdownInterval = setInterval(() => {
      count--
      set({ countdownNumber: count })
      if (count <= 0) {
        clearInterval(countdownInterval)
        set({ gamePhase: 'monster_attack' })
        setTimeout(() => {
          get().monsterAttack()
        }, 300)
      }
    }, 1000)
  },

  resetBattle: () => {
    set({
      playerHealth: 100,
      playerMaxHealth: 100,
      playerMana: 50,
      playerMaxMana: 50,
      monsterHealth: 150,
      monsterMaxHealth: 150,
      selectedRunes: [],
      runeGrid: generateRuneGrid(),
      combo: 0,
      lastRuneTypes: [],
      gamePhase: 'idle',
      countdownNumber: 3,
      floatingNumbers: [],
      monsterStatusEffects: [],
      isMonsterHurt: false,
      isMonsterAttacking: false,
      isVictoryAnimation: false,
      isDefeatAnimation: false,
    })
  },

  addFloatingNumber: (value: number, type: 'damage' | 'heal', x: number, y: number) => {
    const id = uuidv4()
    set(state => ({
      floatingNumbers: [...state.floatingNumbers, { id, value, type, x, y }],
    }))

    setTimeout(() => {
      get().removeFloatingNumber(id)
    }, 1000)
  },

  removeFloatingNumber: (id: string) => {
    set(state => ({
      floatingNumbers: state.floatingNumbers.filter(n => n.id !== id),
    }))
  },

  setCountdownNumber: (num: number) => {
    set({ countdownNumber: num })
  },

  setGamePhase: (phase: GamePhase) => {
    set({ gamePhase: phase })
  },

  setMonsterHurt: (hurt: boolean) => {
    set({ isMonsterHurt: hurt })
  },

  setMonsterAttacking: (attacking: boolean) => {
    set({ isMonsterAttacking: attacking })
  },

  processStatusEffects: () => {
    const { monsterStatusEffects, monsterHealth } = get()
    let totalBurnDamage = 0

    const updatedEffects = monsterStatusEffects
      .map(effect => {
        if (effect.type === 'burn' && effect.damage) {
          totalBurnDamage += effect.damage
          return { ...effect, duration: effect.duration - 1 }
        }
        return effect
      })
      .filter(e => e.duration > 0)

    if (totalBurnDamage > 0) {
      const newHealth = Math.max(0, monsterHealth - totalBurnDamage)
      set({
        monsterHealth: newHealth,
        monsterStatusEffects: updatedEffects,
      })

      if (newHealth <= 0) {
        set({ gamePhase: 'victory', isVictoryAnimation: true })
      }
    } else {
      set({ monsterStatusEffects: updatedEffects })
    }
  },
}))
