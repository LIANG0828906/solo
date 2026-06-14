import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useGame, Player, BoardCellData } from '../context/GameContext'
import Dice3D from './Dice3D'

interface PositionState {
  [playerId: string]: { x: number; y: number }
}

const GRID_SIZE = 6
const CELL_COUNT = GRID_SIZE * GRID_SIZE

const getGridPosition = (index: number): { row: number; col: number } => {
  const idx = index % CELL_COUNT
  if (idx < GRID_SIZE) {
    return { row: 0, col: idx }
  } else if (idx < GRID_SIZE * 2 - 1) {
    return { row: idx - GRID_SIZE + 1, col: GRID_SIZE - 1 }
  } else if (idx < GRID_SIZE * 3 - 2) {
    return { row: GRID_SIZE - 1, col: GRID_SIZE * 3 - 2 - idx - 1 }
  } else if (idx < GRID_SIZE * 4 - 3) {
    return { row: GRID_SIZE * 4 - 3 - idx - 1, col: 0 }
  }
  const innerIdx = idx - (GRID_SIZE * 4 - 4)
  const innerSize = GRID_SIZE - 2
  if (innerIdx < innerSize) {
    return { row: 1, col: 1 + innerIdx }
  } else if (innerIdx < innerSize * 2 - 1) {
    return { row: 2 + innerIdx - innerSize, col: GRID_SIZE - 2 }
  } else if (innerIdx < innerSize * 3 - 2) {
    return { row: GRID_SIZE - 2, col: GRID_SIZE - 2 - (innerIdx - (innerSize * 2 - 2)) }
  } else {
    return { row: GRID_SIZE - 2 - (innerIdx - (innerSize * 3 - 3)), col: 1 }
  }
}

const cellIndexOrder: number[] = (() => {
  const order: number[] = []
  for (let i = 0; i < CELL_COUNT; i++) {
    order.push(i)
  }
  return order
})()

const GameBoard: React.FC = () => {
  const { state, rollDice, movePlayer, endTurn, setEvent, setShowRoleModal, clearPendingEvent, fetchBoardCells } = useGame()
  const { players, currentPlayerIndex, boardCells, isMoving, isRolling, diceResult, pendingEvents, phase, turnCount, maxTurns } = state

  const [positions, setPositions] = useState<PositionState>({})
  const [animatingPlayer, setAnimatingPlayer] = useState<string | null>(null)
  const [tooltip, setTooltip] = useState<{ cell: BoardCellData; x: number; y: number } | null>(null)
  const [diceAnimEnded, setDiceAnimEnded] = useState(false)
  const [cellSize, setCellSize] = useState(80)

  useEffect(() => {
    fetchBoardCells()
  }, [fetchBoardCells])

  useEffect(() => {
    const initial: PositionState = {}
    players.forEach((p) => {
      const pos = getGridPosition(p.position)
      initial[p.id] = {
        x: pos.col * cellSize + cellSize / 2,
        y: pos.row * cellSize + cellSize / 2,
      }
    })
    setPositions(initial)
  }, [players.length])

  useEffect(() => {
    const updateSize = () => {
      const isMobile = window.innerWidth < 768
      setCellSize(isMobile ? 44 : 80)
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const currentPlayer = players[currentPlayerIndex]
  const isCurrentTurnLocal = currentPlayer && currentPlayer.isCurrentTurn && phase === 'playing'

  const animatePlayerMove = useCallback(
    async (playerId: string, fromPos: number, toPos: number, steps: number) => {
      setAnimatingPlayer(playerId)
      const player = players.find((p) => p.id === playerId)
      if (!player) return

      const path: number[] = []
      for (let i = 1; i <= steps; i++) {
        path.push((fromPos + i) % CELL_COUNT)
      }
      if (toPos !== path[path.length - 1]) {
        const extraFrom = path[path.length - 1] ?? fromPos
        let idx = extraFrom
        while (idx !== toPos) {
          idx = (idx + 1) % CELL_COUNT
          path.push(idx)
        }
      }

      for (const cellIdx of path) {
        const pos = getGridPosition(cellIdx)
        setPositions((prev) => ({
          ...prev,
          [playerId]: {
            x: pos.col * cellSize + cellSize / 2,
            y: pos.row * cellSize + cellSize / 2,
          },
        }))
        await new Promise((resolve) => setTimeout(resolve, 200))
      }

      setAnimatingPlayer(null)
    },
    [players, cellSize]
  )

  useEffect(() => {
    if (diceResult && isRolling && diceAnimEnded) {
      const doMove = async () => {
        const cp = players[currentPlayerIndex]
        if (!cp) return
        const fromPos = cp.position
        const moveData = await movePlayer(diceResult.value)
        if (moveData) {
          let finalSteps = diceResult.value
          let finalTo = moveData.newPosition
          const hasTeleport = moveData.events?.some((e: any) => e.type === 'teleport' && e.targetPosition !== undefined)
          if (hasTeleport) {
            const teleportEvent = moveData.events.find((e: any) => e.type === 'teleport')
            if (teleportEvent?.targetPosition !== undefined) {
              await animatePlayerMove(cp.id, fromPos, teleportEvent.targetPosition, finalSteps)
            }
          } else {
            await animatePlayerMove(cp.id, fromPos, finalTo, finalSteps)
          }
          setTimeout(() => {
            setDiceAnimEnded(false)
          }, 100)
        }
      }
      doMove()
    }
  }, [diceResult, isRolling, diceAnimEnded, players, currentPlayerIndex, movePlayer, animatePlayerMove])

  const handleDiceAnimationEnd = useCallback(() => {
    setDiceAnimEnded(true)
  }, [])

  const handleRollDice = async () => {
    if (!isCurrentTurnLocal || isRolling || isMoving) return
    try {
      await rollDice()
    } catch (e) {
      console.error('掷骰子失败', e)
    }
  }

  const handleEndTurn = async () => {
    if (!isCurrentTurnLocal || isRolling || isMoving) return
    try {
      await endTurn()
    } catch (e) {
      console.error('结束回合失败', e)
    }
  }

  const handleCellHover = (cell: BoardCellData, e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setTooltip({
      cell,
      x: rect.left + rect.width / 2,
      y: rect.top - 10,
    })
  }

  const handleCellLeave = () => {
    setTooltip(null)
  }

  useEffect(() => {
    if (pendingEvents.length > 0 && state.selectedEvent === null) {
      setEvent(pendingEvents[0])
    }
  }, [pendingEvents, state.selectedEvent, setEvent])

  const cellsToRender = useMemo(() => {
    if (boardCells.length === 0) {
      return Array.from({ length: CELL_COUNT }, (_, i) => ({
        index: i,
        type: ['start', 'property', 'tax', 'chance', 'parking', 'jail', 'shop'][i % 7],
        name: `格子${i + 1}`,
        description: `第${i + 1}格`,
        cost: 0,
        color: '#4a6cf7',
      }))
    }
    return boardCells
  }, [boardCells])

  const displayGridSize = typeof window !== 'undefined' && window.innerWidth < 768 ? 4 : GRID_SIZE

  return (
    <div className="board-container">
      <div className="board-header">
        <div className="board-turn-info">
          <span