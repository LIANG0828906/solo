import type { Equipment, EquipmentType } from './combatSystem'

export interface PlayerStats {
  maxHealth: number
  currentHealth: number
  attack: number
  defense: number
}

export interface InventoryState {
  equipment: Equipment[]
  equipped: Record<EquipmentType, Equipment | null>
  playerStats: PlayerStats
}

const BASE_STATS: PlayerStats = {
  maxHealth: 100,
  currentHealth: 100,
  attack: 15,
  defense: 5,
}

export function createInitialInventory(): InventoryState {
  return {
    equipment: [],
    equipped: {
      weapon: null,
      armor: null,
      ring: null,
      helmet: null,
    },
    playerStats: { ...BASE_STATS },
  }
}

export function calculateTotalStats(
  equipped: Record<EquipmentType, Equipment | null>
): Omit<PlayerStats, 'currentHealth'> {
  let attack = BASE_STATS.attack
  let defense = BASE_STATS.defense
  let maxHealth = BASE_STATS.maxHealth

  Object.values(equipped).forEach((item) => {
    if (item) {
      attack += item.attackBonus
      defense += item.defenseBonus
      maxHealth += item.healthBonus
    }
  })

  return { attack, defense, maxHealth }
}

export function addToInventory(
  state: InventoryState,
  item: Equipment
): InventoryState {
  return {
    ...state,
    equipment: [...state.equipment, item],
  }
}

export function removeFromInventory(
  state: InventoryState,
  itemId: string
): InventoryState {
  return {
    ...state,
    equipment: state.equipment.filter((e) => e.id !== itemId),
  }
}

export function equipItem(
  state: InventoryState,
  itemId: string
): InventoryState {
  const item = state.equipment.find((e) => e.id === itemId)
  if (!item) return state

  const currentEquipped = state.equipped[item.type]
  const newEquipment = state.equipment.filter((e) => e.id !== itemId)

  if (currentEquipped) {
    newEquipment.push(currentEquipped)
  }

  const newEquipped = {
    ...state.equipped,
    [item.type]: item,
  }

  const totalStats = calculateTotalStats(newEquipped)
  const healthDiff = totalStats.maxHealth - state.playerStats.maxHealth
  const newCurrentHealth = Math.min(
    totalStats.maxHealth,
    state.playerStats.currentHealth + Math.max(0, healthDiff)
  )

  return {
    ...state,
    equipment: newEquipment,
    equipped: newEquipped,
    playerStats: {
      ...state.playerStats,
      ...totalStats,
      currentHealth: newCurrentHealth,
    },
  }
}

export function unequipItem(
  state: InventoryState,
  type: EquipmentType
): InventoryState {
  const item = state.equipped[type]
  if (!item) return state

  const newEquipped = {
    ...state.equipped,
    [type]: null,
  }

  const totalStats = calculateTotalStats(newEquipped)
  const newCurrentHealth = Math.min(
    totalStats.maxHealth,
    state.playerStats.currentHealth
  )

  return {
    ...state,
    equipment: [...state.equipment, item],
    equipped: newEquipped,
    playerStats: {
      ...state.playerStats,
      ...totalStats,
      currentHealth: newCurrentHealth,
    },
  }
}

export function healPlayer(state: InventoryState, amount: number): InventoryState {
  const newHealth = Math.min(
    state.playerStats.maxHealth,
    state.playerStats.currentHealth + amount
  )
  return {
    ...state,
    playerStats: {
      ...state.playerStats,
      currentHealth: newHealth,
    },
  }
}

export function damagePlayer(
  state: InventoryState,
  amount: number
): InventoryState {
  const newHealth = Math.max(0, state.playerStats.currentHealth - amount)
  return {
    ...state,
    playerStats: {
      ...state.playerStats,
      currentHealth: newHealth,
    },
  }
}

export function restoreFullHealth(state: InventoryState): InventoryState {
  return {
    ...state,
    playerStats: {
      ...state.playerStats,
      currentHealth: state.playerStats.maxHealth,
    },
  }
}
