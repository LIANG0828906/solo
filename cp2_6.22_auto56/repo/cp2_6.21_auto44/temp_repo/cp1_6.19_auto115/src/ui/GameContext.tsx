import { createContext, useContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react'
import { eventBus, EVENTS } from '../eventBus'
import { generateDungeon, areRoomsConnected, getRoomById } from '../domain/dungeonGenerator'
import type { DungeonData } from '../domain/dungeonGenerator'
import { createEnemy, playerAttack, enemyAttack, rollForLoot } from '../domain/combatSystem'
import type { Enemy, EquipmentType } from '../domain/combatSystem'
import {
  createInitialInventory,
  addToInventory,
  removeFromInventory,
  equipItem,
  unequipItem,
} from '../domain/playerInventory'
import type { InventoryState } from '../domain/playerInventory'
import { exportGameState, downloadSaveFile } from '../domain/saveManager'

export interface GameState {
  dungeon: DungeonData
  currentRoomId: string
  inventory: InventoryState
  combatActive: boolean
  currentEnemy: Enemy | null
  combatResult: 'ongoing' | 'win' | 'lose' | null
  combatLog: string[]
  isPlayerAttacking: boolean
  isEnemyAttacking: boolean
  lootMessage: string | null
}

export interface GameContextType {
  state: GameState
  generateNewDungeon: () => void
  moveToRoom: (roomId: string) => void
  attack: () => void
  closeCombat: () => void
  equipItem: (itemId: string) => void
  unequipItem: (type: string) => void
  discardItem: (itemId: string) => void
  exportSave: () => void
}

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [dungeon, setDungeon] = useState<DungeonData>(() => generateDungeon())
  const [currentRoomId, setCurrentRoomId] = useState<string>(dungeon.startRoomId)
  const [inventory, setInventory] = useState<InventoryState>(createInitialInventory())

  const [combatActive, setCombatActive] = useState(false)
  const [currentEnemy, setCurrentEnemy] = useState<Enemy | null>(null)
  const [combatLog, setCombatLog] = useState<string[]>([])
  const [combatResult, setCombatResult] = useState<'ongoing' | 'win' | 'lose' | null>(null)
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false)
  const [isEnemyAttacking, setIsEnemyAttacking] = useState(false)
  const [lootMessage, setLootMessage] = useState<string | null>(null)

  const exploreRoom = useCallback((roomId: string) => {
    setDungeon((prev) => {
      const newRooms = prev.rooms.map((room) =>
        room.id === roomId ? { ...room, explored: true } : room
      )
      return { ...prev, rooms: newRooms }
    })
    eventBus.emit(EVENTS.ROOM_EXPLORED, roomId)
  }, [])

  const startCombat = useCallback((enemy: Enemy) => {
    setCurrentEnemy(enemy)
    setCombatActive(true)
    setCombatLog([`遭遇了 ${enemy.name}！`])
    setCombatResult('ongoing')
    eventBus.emit(EVENTS.COMBAT_START, enemy)
  }, [])

  const generateNewDungeon = useCallback(() => {
    const newDungeon = generateDungeon()
    setDungeon(newDungeon)
    setCurrentRoomId(newDungeon.startRoomId)
    setInventory(createInitialInventory())
    setCombatActive(false)
    setCurrentEnemy(null)
    setCombatLog([])
    setCombatResult(null)
    eventBus.emit(EVENTS.DUNGEON_GENERATED, newDungeon)
  }, [])

  const attack = useCallback(() => {
    if (!currentEnemy || combatResult !== 'ongoing') return

    setIsPlayerAttacking(true)
    eventBus.emit(EVENTS.PLAYER_ATTACK)

    setTimeout(() => {
      const attackResult = playerAttack(currentEnemy, inventory.playerStats.attack)
      const newEnemy = attackResult.enemy
      const damage = attackResult.damage

      setCombatLog((prev) => [...prev, `你对 ${currentEnemy.name} 造成了 ${damage} 点伤害！`])
      setCurrentEnemy(newEnemy)
      setIsPlayerAttacking(false)

      if (newEnemy.currentHealth <= 0) {
        setCombatResult('win')
        setCombatLog((prev) => [...prev, `${currentEnemy.name} 被击败了！`])

        const loot = rollForLoot()
        if (loot) {
          setInventory((prev) => addToInventory(prev, loot))
          setLootMessage(`获得装备：${loot.name}！`)
          setTimeout(() => setLootMessage(null), 3000)
          eventBus.emit(EVENTS.EQUIPMENT_DROP, loot)
        }

        setDungeon((prev) => ({
          ...prev,
          rooms: prev.rooms.map((r) =>
            r.id === currentRoomId
              ? { ...r, monsterDefeated: true, hasMonster: false }
              : r
          ),
        }))

        eventBus.emit(EVENTS.COMBAT_END, 'win')
        return
      }

      setTimeout(() => {
        setIsEnemyAttacking(true)
        eventBus.emit(EVENTS.ENEMY_ATTACK)
        const enemyResult = enemyAttack(
          newEnemy,
          inventory.playerStats.defense,
          inventory.playerStats.currentHealth
        )

        setInventory((prev) => ({
          ...prev,
          playerStats: {
            ...prev.playerStats,
            currentHealth: enemyResult.playerHealth,
          },
        }))

        setCombatLog((prev) => [
          ...prev,
          `${currentEnemy.name} 对你造成了 ${enemyResult.damage} 点伤害！`,
        ])

        setTimeout(() => {
          setIsEnemyAttacking(false)

          if (enemyResult.playerHealth <= 0) {
            setCombatResult('lose')
            setCombatLog((prev) => [...prev, '你被击败了...'])
            eventBus.emit(EVENTS.COMBAT_END, 'lose')
          }
        }, 300)
      }, 300)
    }, 300)
  }, [currentEnemy, combatResult, inventory.playerStats, currentRoomId])

  const closeCombat = useCallback(() => {
    setCombatActive(false)
    setCurrentEnemy(null)
    setCombatLog([])
    setCombatResult(null)
    setIsPlayerAttacking(false)
    setIsEnemyAttacking(false)

    if (combatResult === 'lose') {
      generateNewDungeon()
    }
  }, [combatResult, generateNewDungeon])

  const moveToRoom = useCallback(
    (roomId: string) => {
      if (combatActive) return

      if (!areRoomsConnected(dungeon, currentRoomId, roomId)) {
        return
      }

      setCurrentRoomId(roomId)
      exploreRoom(roomId)
      eventBus.emit(EVENTS.PLAYER_MOVED, roomId)

      const room = getRoomById(dungeon, roomId)
      if (room && room.hasMonster && !room.monsterDefeated) {
        const enemy = createEnemy()
        startCombat(enemy)
      }
    },
    [dungeon, currentRoomId, combatActive, exploreRoom, startCombat]
  )

  const handleEquipItem = useCallback((itemId: string) => {
    setInventory((prev) => {
      const newState = equipItem(prev, itemId)
      eventBus.emit(EVENTS.EQUIPMENT_CHANGED, newState.equipped)
      eventBus.emit(EVENTS.STATS_CHANGED, newState.playerStats)
      eventBus.emit(EVENTS.INVENTORY_CHANGED, newState.equipment)
      return newState
    })
  }, [])

  const handleUnequipItem = useCallback((type: string) => {
    setInventory((prev) => {
      const newState = unequipItem(prev, type as EquipmentType)
      eventBus.emit(EVENTS.EQUIPMENT_CHANGED, newState.equipped)
      eventBus.emit(EVENTS.STATS_CHANGED, newState.playerStats)
      eventBus.emit(EVENTS.INVENTORY_CHANGED, newState.equipment)
      return newState
    })
  }, [])

  const discardItem = useCallback((itemId: string) => {
    setInventory((prev) => {
      const newState = removeFromInventory(prev, itemId)
      eventBus.emit(EVENTS.INVENTORY_CHANGED, newState.equipment)
      return newState
    })
  }, [])

  const exportSave = useCallback(() => {
    const saveData = exportGameState(dungeon, inventory, currentRoomId)
    downloadSaveFile(saveData)
  }, [dungeon, inventory, currentRoomId])

  const state = useMemo<GameState>(
    () => ({
      dungeon,
      currentRoomId,
      inventory,
      combatActive,
      currentEnemy,
      combatResult,
      combatLog,
      isPlayerAttacking,
      isEnemyAttacking,
      lootMessage,
    }),
    [
      dungeon,
      currentRoomId,
      inventory,
      combatActive,
      currentEnemy,
      combatResult,
      combatLog,
      isPlayerAttacking,
      isEnemyAttacking,
      lootMessage,
    ]
  )

  const contextValue = useMemo<GameContextType>(
    () => ({
      state,
      generateNewDungeon,
      moveToRoom,
      attack,
      closeCombat,
      equipItem: handleEquipItem,
      unequipItem: handleUnequipItem,
      discardItem,
      exportSave,
    }),
    [
      state,
      generateNewDungeon,
      moveToRoom,
      attack,
      closeCombat,
      handleEquipItem,
      handleUnequipItem,
      discardItem,
      exportSave,
    ]
  )

  return (
    <GameContext.Provider value={contextValue}>
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
