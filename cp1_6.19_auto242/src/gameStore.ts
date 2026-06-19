import { create } from 'zustand'
import {
  Direction,
  PipeType,
  getConnections,
  getOppositeDirection,
  getDirectionOffset,
  getRandomPipeType,
  getRandomRotation,
  ROTATION_ANGLES,
  PIPE_CONFIGS,
} from './pipeTypes'

export interface Position {
  row: number
  col: number
}

export interface Cell {
  type: PipeType
  rotation: number
  initialRotation: number
  isFilled: boolean
  fillProgress: number
  isError: boolean
  isWinPath: boolean
  validRotations: number[]
}

export interface FlowState {
  currentPos: Position
  incomingDir: Direction | null
  progress: number
  path: Position[]
  errorCell: Position | null
}

interface GameState {
  grid: Cell[][]
  level: number
  moves: number
  sourcePos: Position
  targetPos: Position
  flowState: FlowState | null
  isFlowing: boolean
  hasWon: boolean
  showError: boolean
  showWinAnimation: boolean
  flowIntervalId: number | null
  initLevel: () => void
  rotatePipe: (row: number, col: number) => void
  resetLevel: () => void
  startFlow: () => void
  stopFlow: () => void
  flowStep: () => void
  checkPath: () => boolean
  clearFlow: () => void
  nextLevel: () => void
}

const GRID_SIZE = 8

function createEmptyGrid(): Cell[][] {
  const grid: Cell[][] = []
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowCells: Cell[] = []
    for (let col = 0; col < GRID_SIZE; col++) {
      const type = getRandomPipeType()
      const rotation = getRandomRotation()
      rowCells.push({
        type,
        rotation,
        initialRotation: rotation,
        isFilled: false,
        fillProgress: 0,
        isError: false,
        isWinPath: false,
        validRotations: PIPE_CONFIGS[type].validRotations,
      })
    }
    grid.push(rowCells)
  }
  return grid
}

function generatePath(): Position[] {
  const path: Position[] = []
  let row = Math.floor(GRID_SIZE / 2)
  let col = 0
  path.push({ row, col })

  while (col < GRID_SIZE - 1) {
    const moves: { dr: number; dc: number }[] = []
    if (col < GRID_SIZE - 1) moves.push({ dr: 0, dc: 1 })
    if (row > 0 && col > 0) moves.push({ dr: -1, dc: 0 })
    if (row < GRID_SIZE - 1 && col > 0) moves.push({ dr: 1, dc: 0 })

    const move = moves[Math.floor(Math.random() * moves.length)]
    row += move.dr
    col += move.dc

    const exists = path.some((p) => p.row === row && p.col === col)
    if (!exists) {
      path.push({ row, col })
    } else {
      row -= move.dr
      col -= move.dc
    }
  }

  path.push({ row, col: GRID_SIZE - 1 })
  return path
}

function getPipeTypeForPath(
  path: Position[],
  index: number
): { type: PipeType; rotation: number } {
  if (index === 0) {
    return { type: 'START', rotation: 0 }
  }
  if (index === path.length - 1) {
    return { type: 'END', rotation: 0 }
  }

  const prev = path[index - 1]
  const curr = path[index]
  const next = path[index + 1]

  const dir1 = getDirection(prev, curr)
  const dir2 = getDirection(curr, next)

  if (dir1 === getOppositeDirection(dir2)) {
    const rotation = dir1 === 'top' || dir1 === 'bottom' ? 0 : 90
    return { type: 'STRAIGHT', rotation }
  }

  const elbowRotations: Record<string, number> = {
    'top-right': 0,
    'right-bottom': 90,
    'bottom-left': 180,
    'left-top': 270,
    'right-top': 270,
    'bottom-right': 0,
    'left-bottom': 90,
    'top-left': 180,
  }

  const key = `${dir1}-${dir2}`
  const rotation = elbowRotations[key] ?? 0

  return { type: 'ELBOW', rotation }
}

function getDirection(from: Position, to: Position): Direction {
  if (to.row < from.row) return 'top'
  if (to.row > from.row) return 'bottom'
  if (to.col < from.col) return 'left'
  return 'right'
}

function generateLevel(): {
  grid: Cell[][]
  sourcePos: Position
  targetPos: Position
} {
  const grid = createEmptyGrid()
  const path = generatePath()

  for (let i = 0; i < path.length; i++) {
    const pos = path[i]
    const { type, rotation } = getPipeTypeForPath(path, i)
    const finalRotation = ROTATION_ANGLES[Math.floor(Math.random() * ROTATION_ANGLES.length)]

    if (type !== 'START' && type !== 'END') {
      grid[pos.row][pos.col] = {
        type,
        rotation: finalRotation,
        initialRotation: finalRotation,
        isFilled: false,
        fillProgress: 0,
        isError: false,
        isWinPath: true,
        validRotations: PIPE_CONFIGS[type].validRotations,
      }
    } else {
      grid[pos.row][pos.col] = {
        type,
        rotation,
        initialRotation: rotation,
        isFilled: false,
        fillProgress: 0,
        isError: false,
        isWinPath: true,
        validRotations: PIPE_CONFIGS[type].validRotations,
      }
    }
  }

  const sourcePos = path[0]
  const targetPos = path[path.length - 1]

  return { grid, sourcePos, targetPos }
}

function bfsCheckPath(
  grid: Cell[][],
  start: Position,
  end: Position
): Position[] | null {
  const visited = new Set<string>()
  const queue: { pos: Position; path: Position[] }[] = []

  queue.push({ pos: start, path: [start] })
  visited.add(`${start.row},${start.col}`)

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!

    if (pos.row === end.row && pos.col === end.col) {
      return path
    }

    const cell = grid[pos.row][pos.col]
    const connections = getConnections(cell.type, cell.rotation)

    for (const dir of connections) {
      const offset = getDirectionOffset(dir)
      const newRow = pos.row + offset.row
      const newCol = pos.col + offset.col

      if (
        newRow < 0 ||
        newRow >= GRID_SIZE ||
        newCol < 0 ||
        newCol >= GRID_SIZE
      ) {
        continue
      }

      const key = `${newRow},${newCol}`
      if (visited.has(key)) continue

      const nextCell = grid[newRow][newCol]
      const nextConnections = getConnections(nextCell.type, nextCell.rotation)
      const incomingDir = getOppositeDirection(dir)

      if (nextConnections.includes(incomingDir)) {
        visited.add(key)
        queue.push({
          pos: { row: newRow, col: newCol },
          path: [...path, { row: newRow, col: newCol }],
        })
      }
    }
  }

  return null
}

export const useGameStore = create<GameState>((set, get) => ({
  grid: [],
  level: 1,
  moves: 0,
  sourcePos: { row: 3, col: 0 },
  targetPos: { row: 3, col: 7 },
  flowState: null,
  isFlowing: false,
  hasWon: false,
  showError: false,
  showWinAnimation: false,
  flowIntervalId: null,

  initLevel: () => {
    const { grid, sourcePos, targetPos } = generateLevel()
    const state = get()
    if (state.flowIntervalId) {
      clearInterval(state.flowIntervalId)
    }
    set({
      grid,
      sourcePos,
      targetPos,
      moves: 0,
      flowState: null,
      isFlowing: false,
      hasWon: false,
      showError: false,
      showWinAnimation: false,
      flowIntervalId: null,
    })
  },

  rotatePipe: (row: number, col: number) => {
    const state = get()
    if (state.isFlowing || state.hasWon) return

    const cell = state.grid[row][col]
    if (cell.type === 'START' || cell.type === 'END') return

    const newGrid = state.grid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === row && ci === col) {
          const config = PIPE_CONFIGS[cell.type]
          const rotIndex = config.validRotations.indexOf(cell.rotation)
          const nextRotIndex = (rotIndex + 1) % config.validRotations.length
          return {
            ...c,
            rotation: config.validRotations[nextRotIndex],
          }
        }
        return c
      })
    )

    set({ grid: newGrid, moves: state.moves + 1, showError: false })

    const hasPath = get().checkPath()
    if (hasPath) {
      get().startFlow()
    } else {
      set({ showError: true })
      setTimeout(() => {
        set({ showError: false })
      }, 2000)
    }
  },

  resetLevel: () => {
    const state = get()
    if (state.flowIntervalId) {
      clearInterval(state.flowIntervalId)
    }

    const newGrid = state.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        rotation: cell.initialRotation,
        isFilled: false,
        fillProgress: 0,
        isError: false,
      }))
    )

    set({
      grid: newGrid,
      moves: 0,
      flowState: null,
      isFlowing: false,
      hasWon: false,
      showError: false,
      showWinAnimation: false,
      flowIntervalId: null,
    })
  },

  checkPath: (): boolean => {
    const state = get()
    const startTime = performance.now()
    const path = bfsCheckPath(state.grid, state.sourcePos, state.targetPos)
    const endTime = performance.now()
    console.log(`BFS completed in ${(endTime - startTime).toFixed(3)}ms`)
    return path !== null
  },

  startFlow: () => {
    const state = get()
    if (state.isFlowing) return

    state.clearFlow()

    const newGrid = state.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isFilled: false,
        fillProgress: 0,
        isError: false,
      }))
    )

    const flowState: FlowState = {
      currentPos: { ...state.sourcePos },
      incomingDir: null,
      progress: 0,
      path: [{ ...state.sourcePos }],
      errorCell: null,
    }

    newGrid[state.sourcePos.row][state.sourcePos.col].isFilled = true
    newGrid[state.sourcePos.row][state.sourcePos.col].fillProgress = 1

    set({ grid: newGrid, flowState, isFlowing: true })

    const intervalId = window.setInterval(() => {
      get().flowStep()
    }, 500)

    set({ flowIntervalId: intervalId })
  },

  stopFlow: () => {
    const state = get()
    if (state.flowIntervalId) {
      clearInterval(state.flowIntervalId)
    }
    set({ flowIntervalId: null, isFlowing: false })
  },

  clearFlow: () => {
    const state = get()
    const newGrid = state.grid.map((row) =>
      row.map((cell) => ({
        ...cell,
        isFilled: false,
        fillProgress: 0,
        isError: false,
      }))
    )
    set({ grid: newGrid, flowState: null })
  },

  flowStep: () => {
    const state = get()
    if (!state.flowState) return

    const { currentPos, incomingDir, path } = state.flowState
    const cell = state.grid[currentPos.row][currentPos.col]
    const connections = getConnections(cell.type, cell.rotation)

    let nextDir: Direction | null = null

    for (const dir of connections) {
      if (incomingDir && dir === getOppositeDirection(incomingDir)) continue

      const offset = getDirectionOffset(dir)
      const nextRow = currentPos.row + offset.row
      const nextCol = currentPos.col + offset.col

      if (
        nextRow < 0 ||
        nextRow >= GRID_SIZE ||
        nextCol < 0 ||
        nextCol >= GRID_SIZE
      ) {
        continue
      }

      const nextCell = state.grid[nextRow][nextCol]
      const nextConnections = getConnections(nextCell.type, nextCell.rotation)
      const nextIncoming = getOppositeDirection(dir)

      if (nextConnections.includes(nextIncoming)) {
        nextDir = dir
        break
      }
    }

    if (!nextDir) {
      const newGrid = state.grid.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === currentPos.row && ci === currentPos.col) {
            return { ...c, isError: true }
          }
          return c
        })
      )

      set({
        grid: newGrid,
        flowState: {
          ...state.flowState,
          errorCell: currentPos,
        },
      })

      state.stopFlow()

      setTimeout(() => {
        const resetGrid = get().grid.map((row) =>
          row.map((c) => ({ ...c, isError: false }))
        )
        set({ grid: resetGrid })
      }, 500)

      return
    }

    const offset = getDirectionOffset(nextDir)
    const nextRow = currentPos.row + offset.row
    const nextCol = currentPos.col + offset.col

    if (
      nextRow === state.targetPos.row &&
      nextCol === state.targetPos.col
    ) {
      const newGrid = state.grid.map((r, ri) =>
        r.map((c, ci) => {
          if (ri === nextRow && ci === nextCol) {
            return { ...c, isFilled: true, fillProgress: 1 }
          }
          return c
        })
      )

      set({
        grid: newGrid,
        hasWon: true,
        showWinAnimation: true,
        flowState: null,
      })

      state.stopFlow()

      setTimeout(() => {
        get().nextLevel()
      }, 2000)
      return
    }

    const alreadyVisited = path.some(
      (p) => p.row === nextRow && p.col === nextCol
    )

    if (alreadyVisited) {
      state.stopFlow()
      return
    }

    const newPath = [...path, { row: nextRow, col: nextCol }]

    const newGrid = state.grid.map((r, ri) =>
      r.map((c, ci) => {
        if (ri === nextRow && ci === nextCol) {
          return { ...c, isFilled: true, fillProgress: 1 }
        }
        return c
      })
    )

    set({
      grid: newGrid,
      flowState: {
        currentPos: { row: nextRow, col: nextCol },
        incomingDir: getOppositeDirection(nextDir),
        progress: 0,
        path: newPath,
        errorCell: null,
      },
    })
  },

  nextLevel: () => {
    const state = get()
    set({
      level: state.level + 1,
      showWinAnimation: false,
    })
    get().initLevel()
  },
}))
