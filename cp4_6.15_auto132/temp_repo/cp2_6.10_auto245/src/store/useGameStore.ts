import { create } from 'zustand'

export type StoneColor = 'black' | 'white'

export interface MoveRecord {
  x: number
  y: number
  color: StoneColor
  moveNumber: number
  id: string
}

interface GameState {
  board: (StoneColor | null)[][]
  moveHistory: MoveRecord[]
  currentMoveNumber: number
  placeStone: (x: number, y: number) => void
  resetGame: () => void
  undoMove: () => void
}

const BOARD_SIZE = 19

const createEmptyBoard = (): (StoneColor | null)[][] => {
  return Array(BOARD_SIZE)
    .fill(null)
    .map(() => Array(BOARD_SIZE).fill(null))
}

export const useGameStore = create<GameState>((set, get) => ({
  board: createEmptyBoard(),
  moveHistory: [],
  currentMoveNumber: 0,

  placeStone: (x: number, y: number) => {
    const { board, moveHistory, currentMoveNumber } = get()
    
    if (board[y][x] !== null) return

    const color: StoneColor = currentMoveNumber % 2 === 0 ? 'black' : 'white'
    const newBoard = board.map(row => [...row])
    newBoard[y][x] = color

    const newMove: MoveRecord = {
      x,
      y,
      color,
      moveNumber: currentMoveNumber + 1,
      id: `${x}-${y}-${Date.now()}`
    }

    set({
      board: newBoard,
      moveHistory: [...moveHistory, newMove],
      currentMoveNumber: currentMoveNumber + 1
    })
  },

  resetGame: () => {
    set({
      board: createEmptyBoard(),
      moveHistory: [],
      currentMoveNumber: 0
    })
  },

  undoMove: () => {
    const { moveHistory } = get()
    if (moveHistory.length === 0) return

    const newHistory = moveHistory.slice(0, -1)
    const newBoard = createEmptyBoard()
    
    newHistory.forEach(move => {
      newBoard[move.y][move.x] = move.color
    })

    set({
      board: newBoard,
      moveHistory: newHistory,
      currentMoveNumber: newHistory.length
    })
  }
}))
