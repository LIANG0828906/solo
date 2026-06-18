import { create } from 'zustand'

export type PlayerId = 1 | 2

export interface PieceData {
  id: string
  player: PlayerId
  row: number
  col: number
  placedAt: number
  isShattering?: boolean
  shatterAt?: number
}

export interface GravityLine {
  from: { row: number; col: number }
  to: { row: number; col: number }
  color: string
  createdAt: number
}

export interface Particle {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  color: string
  life: number
  size: number
  createdAt: number
  duration: number
}

export interface ShatterPiece {
  id: string
  pieceId: string
  player: PlayerId
  x: number
  y: number
  vx: number
  vy: number
  rotation: number
  vr: number
  life: number
  createdAt: number
  size: number
}

const BOARD_SIZE = 8
const PLAYER1_COLOR = '#FF4500'
const PLAYER2_COLOR = '#00BFFF'

const DIRECTIONS = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1],
]

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 }
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map(x => {
    const h = Math.round(Math.max(0, Math.min(255, x))).toString(16)
    return h.length === 1 ? '0' + h : h
  }).join('')
}

function mixColors(c1: string, c2: string): string {
  const a = hexToRgb(c1)
  const b = hexToRgb(c2)
  return rgbToHex((a.r + b.r) / 2, (a.g + b.g) / 2, (a.b + b.b) / 2)
}

function getPlayerColor(player: PlayerId): string {
  return player === 1 ? PLAYER1_COLOR : PLAYER2_COLOR
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

function createEmptyBoard(): (PieceData | null)[][] {
  return Array.from({ length: BOARD_SIZE }, () =>
    Array.from({ length: BOARD_SIZE }, () => null)
  )
}

interface GameState {
  board: (PieceData | null)[][]
  currentPlayer: PlayerId
  gravityLines: GravityLine[]
  particles: Particle[]
  shatterPieces: ShatterPiece[]
  winner: PlayerId | null | 'draw'
  gameOver: boolean
  pieceCount: { 1: number; 2: number }
  victoryShownAt: number | null

  placePiece: (row: number, col: number) => void
  resetGame: () => void
  clearExpiredEffects: (now: number) => void
}

export const useGameStore = create<GameState>((set, get) => ({
  board: createEmptyBoard(),
  currentPlayer: 1,
  gravityLines: [],
  particles: [],
  shatterPieces: [],
  winner: null,
  gameOver: false,
  pieceCount: { 1: 0, 2: 0 },
  victoryShownAt: null,

  placePiece: (row: number, col: number) => {
    const state = get()
    if (state.gameOver) return
    if (state.board[row][col] !== null) return

    const now = performance.now()
    const player = state.currentPlayer
    const newPiece: PieceData = {
      id: uid(),
      player,
      row,
      col,
      placedAt: now,
    }

    const newBoard = state.board.map(r => r.slice())
    newBoard[row][col] = newPiece

    const newGravityLines: GravityLine[] = []
    const newParticles: Particle[] = []
    let count1 = state.pieceCount[1]
    let count2 = state.pieceCount[2]

    if (player === 1) count1++
    else count2++

    const neighborsToEat: { dr: number; dc: number }[] = []

    for (const [dr, dc] of DIRECTIONS) {
      const nr = row + dr
      const nc = col + dc
      if (nr < 0 || nr >= BOARD_SIZE || nc < 0 || nc >= BOARD_SIZE) continue
      const neighbor = newBoard[nr][nc]
      if (!neighbor) continue

      const lineColor = mixColors(
        getPlayerColor(player),
        getPlayerColor(neighbor.player)
      )
      newGravityLines.push({
        from: { row, col },
        to: { row: nr, col: nc },
        color: lineColor,
        createdAt: now,
      })

      if (neighbor.player !== player) {
        neighborsToEat.push({ dr, dc })
      }
    }

    for (const { dr, dc } of neighborsToEat) {
      const targetRow = row + dr
      const targetCol = col + dc
      const targetPiece = newBoard[targetRow][targetCol]
      if (!targetPiece) continue

      const eatenColor = getPlayerColor(targetPiece.player)
      for (let i = 0; i < 20; i++) {
        const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.3
        const speed = 60 + Math.random() * 80
        newParticles.push({
          id: uid(),
          x: targetCol,
          y: targetRow,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          color: eatenColor,
          life: 1,
          size: 3 + Math.random() * 3,
          createdAt: now,
          duration: 300,
        })
      }

      const movingPiece = newBoard[row][col]!
      newBoard[targetRow][targetCol] = {
        ...movingPiece,
        row: targetRow,
        col: targetCol,
      }
      newBoard[row][col] = null

      if (targetPiece.player === 1) count1--
      else count2--
    }

    let hasEmpty = false
    for (let r = 0; r < BOARD_SIZE; r++) {
      for (let c = 0; c < BOARD_SIZE; c++) {
        if (newBoard[r][c] === null) {
          hasEmpty = true
          break
        }
      }
      if (hasEmpty) break
    }

    let winner: PlayerId | null | 'draw' = null
    let gameOver = false
    const newShatterPieces: ShatterPiece[] = []

    if (!hasEmpty) {
      gameOver = true
      if (count1 > count2) winner = 1
      else if (count2 > count1) winner = 2
      else winner = 'draw'

      const loser: PlayerId | null = winner === 1 ? 2 : winner === 2 ? 1 : null
      if (loser !== null) {
        for (let r = 0; r < BOARD_SIZE; r++) {
          for (let c = 0; c < BOARD_SIZE; c++) {
            const p = newBoard[r][c]
            if (p && p.player === loser) {
              for (let i = 0; i < 5; i++) {
                const angle = Math.random() * Math.PI * 2
                const speed = 40 + Math.random() * 60
                newShatterPieces.push({
                  id: uid(),
                  pieceId: p.id,
                  player: p.player,
                  x: c,
                  y: r,
                  vx: Math.cos(angle) * speed,
                  vy: Math.sin(angle) * speed,
                  rotation: Math.random() * Math.PI * 2,
                  vr: (Math.random() - 0.5) * 10,
                  life: 1,
                  createdAt: now,
                  size: 0.35 + Math.random() * 0.2,
                })
              }
            }
          }
        }
      }
    }

    const nextPlayer: PlayerId = gameOver ? player : (player === 1 ? 2 : 1)

    set({
      board: newBoard,
      currentPlayer: nextPlayer,
      gravityLines: [...state.gravityLines, ...newGravityLines],
      particles: [...state.particles, ...newParticles],
      shatterPieces: [...state.shatterPieces, ...newShatterPieces],
      pieceCount: { 1: count1, 2: count2 },
      winner,
      gameOver,
      victoryShownAt: gameOver ? now : null,
    })
  },

  resetGame: () => {
    set({
      board: createEmptyBoard(),
      currentPlayer: 1,
      gravityLines: [],
      particles: [],
      shatterPieces: [],
      winner: null,
      gameOver: false,
      pieceCount: { 1: 0, 2: 0 },
      victoryShownAt: null,
    })
  },

  clearExpiredEffects: (now: number) => {
    const state = get()
    const PARTICLE_TTL = 320
    const SHATTER_TTL = 620
    const LINE_TTL = 900

    let changed = false

    const filteredParticles = state.particles.filter(p =>
      now - p.createdAt < PARTICLE_TTL
    )
    if (filteredParticles.length !== state.particles.length) changed = true

    const filteredShatter = state.shatterPieces.filter(s =>
      now - s.createdAt < SHATTER_TTL
    )
    if (filteredShatter.length !== state.shatterPieces.length) changed = true

    const filteredLines = state.gravityLines.filter(l =>
      now - l.createdAt < LINE_TTL
    )
    if (filteredLines.length !== state.gravityLines.length) changed = true

    if (changed) {
      set({
        particles: filteredParticles,
        shatterPieces: filteredShatter,
        gravityLines: filteredLines,
      })
    }
  },
}))

export const PLAYER_COLORS = {
  1: PLAYER1_COLOR,
  2: PLAYER2_COLOR,
} as const

export const PLAYER_HIGHLIGHTS = {
  1: '#FFD700',
  2: '#E0FFFF',
} as const

export { BOARD_SIZE, getPlayerColor, mixColors }
