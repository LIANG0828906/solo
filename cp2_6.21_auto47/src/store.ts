import { create } from 'zustand'
import { produce } from 'immer'
import {
  Cell,
  Enemy,
  Position,
  CombatState,
  createNewDungeon,
  movePlayer as engineMovePlayer,
  moveEnemies as engineMoveEnemies,
  resolveCombat as engineResolveCombat,
  playerDefend as enginePlayerDefend,
  isAdjacent,
  MAX_TURNS,
} from './gameEngine'

interface GameState {
  dungeonGrid: Cell[][]
  enemies: Enemy[]
  playerPos: Position
  playerHP: number
  playerMaxHP: number
  playerGold: number
  currentLevel: number
  turnCount: number
  isGameOver: boolean
  gameOverReason: string
  totalKills: number
  totalGold: number
  combatState: CombatState | null
  showHelp: boolean
  message: string

  startNewGame: () => void
  handleCellClick: (pos: Position) => void
  startCombat: (enemyId: string) => void
  handleCombatAttack: () => void
  handleCombatDefend: () => void
  closeCombat: () => void
  toggleHelp: () => void
}

const PLAYER_MAX_HP = 50
const STORAGE_KEY_CURRENT_LEVEL = 'dungeon_crawler_current_level'

const getSavedLevel = (): number => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY_CURRENT_LEVEL)
    if (saved) {
      const level = parseInt(saved, 10)
      return isNaN(level) || level < 1 ? 1 : level
    }
  } catch (e) {
    console.warn('Failed to read from localStorage:', e)
  }
  return 1
}

const saveLevel = (level: number): void => {
  try {
    localStorage.setItem(STORAGE_KEY_CURRENT_LEVEL, level.toString())
  } catch (e) {
    console.warn('Failed to write to localStorage:', e)
  }
}

const initializeState = (resetLevel: boolean = false) => {
  const dungeon = createNewDungeon()
  const initialLevel = resetLevel ? 1 : getSavedLevel()
  if (resetLevel) {
    saveLevel(1)
  }
  return {
    dungeonGrid: dungeon.grid,
    enemies: dungeon.enemies,
    playerPos: dungeon.playerStart,
    playerHP: PLAYER_MAX_HP,
    playerMaxHP: PLAYER_MAX_HP,
    playerGold: 0,
    currentLevel: initialLevel,
    turnCount: MAX_TURNS,
    isGameOver: false,
    gameOverReason: '',
    totalKills: 0,
    totalGold: 0,
    combatState: null,
    showHelp: false,
    message: '',
  }
}

export const useGameStore = create<GameState>((set, get) => ({
  ...initializeState(),

  startNewGame: () => {
    set(initializeState(true))
  },

  handleCellClick: (targetPos: Position) => {
    const state = get()
    if (state.isGameOver || state.combatState) return

    const { playerPos, dungeonGrid, enemies } = state
    const targetCell = dungeonGrid[targetPos.y][targetPos.x]

    if (targetCell.type === 'enemy' && isAdjacent(playerPos, targetPos)) {
      get().startCombat(
        enemies.find(
          (e) => e.position.x === targetPos.x && e.position.y === targetPos.y
        )?.id || ''
      )
      return
    }

    if (!isAdjacent(playerPos, targetPos)) {
      set({ message: '只能移动到相邻格子' })
      return
    }

    const result = engineMovePlayer(playerPos, targetPos, dungeonGrid, enemies)

    if (result.message && result.message !== '') {
      set({ message: result.message })
    }

    const newPlayerHP = Math.min(
      state.playerMaxHP,
      Math.max(0, state.playerHP + result.hpChange)
    )
    const newGold = state.playerGold + result.goldChange
    const newTurnCount = state.turnCount - 1

    if (result.hpChange > 0) {
      get().totalGold += result.goldChange
    }

    const enemiesResult = engineMoveEnemies(
      result.newEnemies,
      result.newPlayerPos,
      result.newGrid
    )

    set(
      produce((draft) => {
        draft.dungeonGrid = enemiesResult.newGrid
        draft.playerPos = result.newPlayerPos
        draft.playerHP = newPlayerHP
        draft.playerGold = newGold
        draft.enemies = enemiesResult.newEnemies
        draft.turnCount = newTurnCount
        draft.totalGold = state.totalGold + result.goldChange

        if (result.reachedExit) {
          const newLevel = state.currentLevel + 1
          const newDungeon = createNewDungeon()
          draft.dungeonGrid = newDungeon.grid
          draft.playerPos = newDungeon.playerStart
          draft.enemies = newDungeon.enemies
          draft.currentLevel = newLevel
          draft.turnCount = MAX_TURNS
          draft.message = `进入第 ${newLevel} 层！`
          saveLevel(newLevel)
        }

        if (newPlayerHP <= 0) {
          draft.isGameOver = true
          draft.gameOverReason = '你被击败了...'
        } else if (newTurnCount <= 0) {
          draft.isGameOver = true
          draft.gameOverReason = '回合数已用尽...'
        }
      })
    )
  },

  startCombat: (enemyId: string) => {
    const state = get()
    const enemy = state.enemies.find((e) => e.id === enemyId)
    if (!enemy) return

    set({
      combatState: {
        playerHP: state.playerHP,
        playerMaxHP: state.playerMaxHP,
        enemyHP: enemy.hp,
        enemyMaxHP: enemy.maxHp,
        enemyId,
        playerDefending: false,
        log: ['战斗开始！'],
        isActive: true,
      },
    })
  },

  handleCombatAttack: () => {
    const state = get()
    if (!state.combatState) return

    const playerResult = engineResolveCombat(state.combatState, true)

    if (playerResult.combatEnded && playerResult.playerWon) {
      const enemyIndex = state.enemies.findIndex(
        (e) => e.id === state.combatState!.enemyId
      )
      const enemy = state.enemies[enemyIndex]

      const newGrid = state.dungeonGrid.map((row) => row.map((cell) => ({ ...cell })))
      newGrid[enemy.position.y][enemy.position.x] = { type: 'empty' }

      const newEnemies = state.enemies.filter((e) => e.id !== state.combatState!.enemyId)

      set(
        produce((draft) => {
          draft.dungeonGrid = newGrid
          draft.enemies = newEnemies
          draft.playerHP = playerResult.newCombatState.playerHP
          draft.combatState = null
          draft.totalKills = state.totalKills + 1
          draft.message = '敌人被击败！'
        })
      )
      return
    }

    const enemyResult = engineResolveCombat(playerResult.newCombatState, false)

    if (enemyResult.combatEnded && !enemyResult.playerWon) {
      set(
        produce((draft) => {
          draft.playerHP = 0
          draft.combatState = enemyResult.newCombatState
          draft.isGameOver = true
          draft.gameOverReason = '你在战斗中被击败了...'
        })
      )
      return
    }

    set(
      produce((draft) => {
        draft.combatState = enemyResult.newCombatState
        draft.playerHP = enemyResult.newCombatState.playerHP
      })
    )
  },

  handleCombatDefend: () => {
    const state = get()
    if (!state.combatState) return

    const defendedState = enginePlayerDefend(state.combatState)
    const enemyResult = engineResolveCombat(defendedState, false)

    if (enemyResult.combatEnded && !enemyResult.playerWon) {
      set(
        produce((draft) => {
          draft.playerHP = 0
          draft.combatState = enemyResult.newCombatState
          draft.isGameOver = true
          draft.gameOverReason = '你在战斗中被击败了...'
        })
      )
      return
    }

    set(
      produce((draft) => {
        draft.combatState = enemyResult.newCombatState
        draft.playerHP = enemyResult.newCombatState.playerHP
      })
    )
  },

  closeCombat: () => {
    set({ combatState: null })
  },

  toggleHelp: () => {
    set((state) => ({ showHelp: !state.showHelp }))
  },
}))
