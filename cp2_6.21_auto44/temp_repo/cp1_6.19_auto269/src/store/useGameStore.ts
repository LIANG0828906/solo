import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import type {
  GameState,
  GameActions,
  Unit,
  BattleEffect,
  Position,
} from '@/types'
import { createBoard, BOARD_SIZE, setTombstone, decreaseTombstoneTurns } from '@/engine/Board'
import {
  createUnit,
  getManaRegen,
  resetUnitActions,
  getUnitAtPosition,
  applyDamage,
  applyHeal,
} from '@/engine/Unit'
import {
  executeAttack,
  executeSkill,
  getMovablePositions,
  getAttackablePositions,
  checkGameEnd,
  processThunderStormEndTurn,
} from '@/engine/BattleSystem'
import {
  triggerRandomEvents,
  applyEventEffect,
  decreaseEventDurations,
} from '@/events/EventSystem'

function createInitialUnits(): Unit[] {
  const elements: ('fire' | 'ice' | 'thunder' | 'dark')[] = ['fire', 'ice', 'thunder', 'dark']
  const types: ('warrior' | 'mage' | 'archer' | 'assassin' | 'priest' | 'warlock')[] = [
    'warrior',
    'mage',
    'archer',
    'assassin',
    'priest',
    'warlock',
  ]

  const units: Unit[] = []

  types.forEach((type, index) => {
    const lightX = index % 4
    const lightY = Math.floor(index / 4) * 7
    const darkX = index % 4
    const darkY = 7 - Math.floor(index / 4) * 7

    units.push(
      createUnit(type, 'light', elements[index % 4], lightX, lightY),
      createUnit(type, 'dark', elements[(index + 2) % 4], darkX + 4, darkY)
    )
  })

  return units
}

function getInitialState(): GameState {
  return {
    board: createBoard(BOARD_SIZE),
    units: createInitialUnits(),
    currentTurn: 1,
    currentPlayer: 'light',
    selectedUnitId: null,
    movablePositions: [],
    attackablePositions: [],
    mana: { light: 100, dark: 100 },
    maxMana: { light: 100, dark: 100 },
    gameStatus: 'playing',
    winner: null,
    battleEffects: [],
    gameStartTime: Date.now(),
    activeEvent: null,
  }
}

export const useGameStore = create<GameState & GameActions>((set, get) => ({
  ...getInitialState(),

  selectUnit: (unitId: string | null) => {
    if (!unitId) {
      set({
        selectedUnitId: null,
        movablePositions: [],
        attackablePositions: [],
      })
      return
    }

    const { units, board, currentPlayer } = get()
    const unit = units.find(u => u.id === unitId)

    if (!unit || unit.faction !== currentPlayer || !unit.isAlive) {
      return
    }

    const movable = getMovablePositions(unit, board, units)
    const attackable = getAttackablePositions(unit, board, units)

    set({
      selectedUnitId: unitId,
      movablePositions: movable,
      attackablePositions: attackable,
    })
  },

  moveUnit: (unitId: string, x: number, y: number) => {
    const { units, movablePositions, board } = get()
    const unit = units.find(u => u.id === unitId)

    if (!unit || !unit.isAlive) return

    const isValidMove = movablePositions.some(p => p.x === x && p.y === y)
    if (!isValidMove) return

    set(state => ({
      units: state.units.map(u =>
        u.id === unitId ? { ...u, x, y, hasMoved: true } : u
      ),
      selectedUnitId: unitId,
      movablePositions: [],
      attackablePositions: getAttackablePositions(
        { ...unit, x, y, hasMoved: true },
        board,
        state.units.map(u => (u.id === unitId ? { ...u, x, y, hasMoved: true } : u))
      ),
    }))
  },

  attackUnit: (attackerId: string, defenderId: string) => {
    const { units, board, attackablePositions } = get()
    const attacker = units.find(u => u.id === attackerId)
    const defender = units.find(u => u.id === defenderId)

    if (!attacker || !defender || !attacker.isAlive || !defender.isAlive) return

    const canAttack = attackablePositions.some(p => p.x === defender.x && p.y === defender.y)
    if (!canAttack) return

    const result = executeAttack(attacker, defender, board)

    const newEffects: BattleEffect[] = []

    if (result.effectType) {
      newEffects.push({
        id: uuidv4(),
        type: result.effectType,
        x: defender.x,
        y: defender.y,
        createdAt: Date.now(),
      })
    }

    newEffects.push({
      id: uuidv4(),
      type: 'damage_number',
      x: defender.x,
      y: defender.y,
      damage: result.damage,
      createdAt: Date.now(),
    })

    set(state => {
      const newUnits = state.units.map(u => {
        if (u.id === defenderId) {
          return applyDamage(u, result.damage)
        }
        if (u.id === attackerId) {
          return { ...u, hasAttacked: true }
        }
        return u
      })

      const newBoard = { ...state.board }
      if (result.targetDefeated) {
        setTombstone(newBoard, defender.x, defender.y, defenderId, defender.faction)
      }

      const winner = checkGameEnd(newUnits)

      return {
        units: newUnits,
        board: newBoard,
        battleEffects: [...state.battleEffects, ...newEffects],
        selectedUnitId: null,
        movablePositions: [],
        attackablePositions: [],
        gameStatus: winner ? 'ended' : 'playing',
        winner,
      }
    })
  },

  useSkill: (attackerId: string, defenderId: string, skillId: string) => {
    const { units, board, mana, currentPlayer } = get()
    const attacker = units.find(u => u.id === attackerId)
    const defender = units.find(u => u.id === defenderId)

    if (!attacker || !defender || !attacker.isAlive || !defender.isAlive) return

    const skill = attacker.skills.find(s => s.id === skillId)
    if (!skill) return

    if (mana[currentPlayer] < skill.mpCost) return

    const result = executeSkill(attacker, defender, skill, board)

    const newEffects: BattleEffect[] = []

    if (result.effectType) {
      newEffects.push({
        id: uuidv4(),
        type: result.effectType,
        x: defender.x,
        y: defender.y,
        createdAt: Date.now(),
      })
    }

    newEffects.push({
      id: uuidv4(),
      type: 'damage_number',
      x: defender.x,
      y: defender.y,
      damage: result.damage,
      createdAt: Date.now(),
    })

    set(state => {
      const newUnits = state.units.map(u => {
        if (u.id === defenderId) {
          return result.damage > 0 ? applyDamage(u, result.damage) : applyHeal(u, Math.abs(result.damage))
        }
        if (u.id === attackerId) {
          return { ...u, hasAttacked: true, mp: u.mp - skill.mpCost }
        }
        return u
      })

      const newBoard = { ...state.board }
      if (result.targetDefeated) {
        setTombstone(newBoard, defender.x, defender.y, defenderId, defender.faction)
      }

      const winner = checkGameEnd(newUnits)

      return {
        units: newUnits,
        board: newBoard,
        mana: {
          ...state.mana,
          [currentPlayer]: state.mana[currentPlayer] - skill.mpCost,
        },
        battleEffects: [...state.battleEffects, ...newEffects],
        selectedUnitId: null,
        movablePositions: [],
        attackablePositions: [],
        gameStatus: winner ? 'ended' : 'playing',
        winner,
      }
    })
  },

  endTurn: () => {
    const { currentPlayer, board, units, mana, maxMana, currentTurn } = get()

    const nextPlayer: 'light' | 'dark' = currentPlayer === 'light' ? 'dark' : 'light'
    const nextTurn = nextPlayer === 'light' ? currentTurn + 1 : currentTurn

    const newBoard = { ...board }
    decreaseEventDurations(newBoard)
    decreaseTombstoneTurns(newBoard)

    const thunderDamage = processThunderStormEndTurn(newBoard, units)
    let newUnits = [...units]

    if (thunderDamage.length > 0) {
      const thunderEffects: BattleEffect[] = []
      thunderDamage.forEach(({ unit, damage }) => {
        newUnits = newUnits.map(u =>
          u.id === unit.id ? applyDamage(u, damage) : u
        )
        thunderEffects.push({
          id: uuidv4(),
          type: 'lightning',
          x: unit.x,
          y: unit.y,
          createdAt: Date.now(),
        })
        thunderEffects.push({
          id: uuidv4(),
          type: 'damage_number',
          x: unit.x,
          y: unit.y,
          damage,
          createdAt: Date.now(),
        })
      })
      set({ battleEffects: [...get().battleEffects, ...thunderEffects] })
    }

    const event = triggerRandomEvents(newBoard, newUnits)
    if (event) {
      applyEventEffect(event, newBoard)
    }

    newUnits = resetUnitActions(newUnits)

    const newMana = {
      ...mana,
      [nextPlayer]: getManaRegen(mana[nextPlayer], maxMana[nextPlayer]),
    }

    const winner = checkGameEnd(newUnits)

    set({
      board: newBoard,
      units: newUnits,
      currentTurn: nextTurn,
      currentPlayer: nextPlayer,
      mana: newMana,
      selectedUnitId: null,
      movablePositions: [],
      attackablePositions: [],
      activeEvent: event,
      gameStatus: winner ? 'ended' : 'playing',
      winner,
    })
  },

  startNewGame: () => {
    set(getInitialState())
  },

  clearBattleEffect: (effectId: string) => {
    set(state => ({
      battleEffects: state.battleEffects.filter(e => e.id !== effectId),
    }))
  },
}))
