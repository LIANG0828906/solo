import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'

export enum CellType {
  WALL = 0,
  PATH = 1,
  DOT = 2,
  POWER_PELLET = 3,
  EXIT = 4,
}

export type Direction = 'up' | 'down' | 'left' | 'right' | 'none'

export interface Position {
  x: number
  y: number
}

export interface Player {
  id: string
  position: Position
  prevPosition: Position
  score: number
  lives: number
  direction: Direction
  nextDirection: Direction
  color: string
  name: string
  moveProgress: number
  hasPowerPellet: boolean
  powerPelletTimer: number
}

export interface Ghost {
  id: string
  position: Position
  prevPosition: Position
  color: string
  originalColor: string
  isScared: boolean
  scaredTimer: number
  direction: Direction
  name: string
  moveProgress: number
  isEaten: boolean
}

export interface PowerPellet {
  id: string
  position: Position
  isVisible: boolean
  respawnTimer: number
}

export interface Shockwave {
  id: string
  x: number
  y: number
  radius: number
  maxRadius: number
  opacity: number
  startTime: number
  duration: number
  color: string
}

export type GameStatus = 'idle' | 'playing' | 'paused' | 'gameover' | 'win'
export type GameMode = 'single' | 'coop'

export interface GameState {
  maze: CellType[][]
  mazeSize: number
  players: Player[]
  ghosts: Ghost[]
  powerPellets: PowerPellet[]
  gameStatus: GameStatus
  mode: GameMode
  shockwaves: Shockwave[]
  dotsRemaining: number
  level: number
  pelletRespawnTimer: number

  setGameStatus: (status: GameStatus) => void
  setMode: (mode: GameMode) => void
  initializeGame: (mode: GameMode) => void
  update: (deltaTime: number, keyboardState: KeyboardState) => void
  addShockwave: (x: number, y: number, color: string) => void
  pause: () => void
  resume: () => void
  restart: () => void
  tick: (deltaTime: number, keyboardState: KeyboardState) => void
}

export interface KeyboardState {
  player1: {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
  }
  player2: {
    up: boolean
    down: boolean
    left: boolean
    right: boolean
  }
  pause: boolean
}

export const MAZE_SIZE = 15
export const CELL_PIXEL_SIZE = 36
export const PLAYER_SPEED = 4.0
export const GHOST_SPEED = 3.2
export const GHOST_SCARED_SPEED = 2.0
export const POWER_PELLET_DURATION = 5000
export const SHOCKWAVE_DURATION = 500
export const PELLET_RESPAWN_INTERVAL = 30000
export const POINTS_DOT = 10
export const POINTS_POWER_PELLET = 50
export const POINTS_GHOST = 200
export const INITIAL_LIVES = 3

export const GHOST_COLORS = ['#FF0000', '#FFB8FF', '#00FFFF', '#FFB852']
export const PLAYER_COLORS = ['#FFE135', '#00D4AA']
export const PLAYER_NAMES = ['P1', 'P2']

function createInitialKeyboardState(): KeyboardState {
  return {
    player1: { up: false, down: false, left: false, right: false },
    player2: { up: false, down: false, left: false, right: false },
    pause: false,
  }
}

export { createInitialKeyboardState }
import {
  generateMaze,
  placeDotsAndCount,
  findRandomPathCells,
  isPathCell,
} from '../engine/MazeGenerator'
import {
  updatePlayerMovement,
  updateGhostMovement,
  handleCollisions,
  respawnPowerPellets,
  updateShockwaves,
  updateTimers,
} from '../engine/GameEngine'

export const useGameStore = create<GameState>((set, get) => ({
  maze: [],
  mazeSize: MAZE_SIZE,
  players: [],
  ghosts: [],
  powerPellets: [],
  gameStatus: 'idle',
  mode: 'single',
  shockwaves: [],
  dotsRemaining: 0,
  level: 1,
  pelletRespawnTimer: PELLET_RESPAWN_INTERVAL,

  setGameStatus: (status) => set({ gameStatus: status }),
  setMode: (mode) => set({ mode }),

  initializeGame: (mode) => {
    const maze = generateMaze(MAZE_SIZE)
    const { maze: mazeWithDots, count } = placeDotsAndCount(maze)

    const pathCells = findRandomPathCells(maze, 6)
    const playerStarts = pathCells.slice(0, 2)
    const ghostStarts = pathCells.slice(2, 6) || [
      { x: 7, y: 7 },
      { x: 8, y: 7 },
      { x: 7, y: 8 },
      { x: 8, y: 8 },
    ]

    const pelletPositions = findRandomPathCells(maze, 4)
    const powerPellets: PowerPellet[] = pelletPositions.map((pos) => ({
      id: uuidv4(),
      position: { ...pos },
      isVisible: true,
      respawnTimer: PELLET_RESPAWN_INTERVAL,
    }))

    powerPellets.forEach((p) => {
      if (
        p.position.y >= 0 &&
        p.position.y < MAZE_SIZE &&
        p.position.x >= 0 &&
        p.position.x < MAZE_SIZE
      ) {
        mazeWithDots[p.position.y][p.position.x] = CellType.POWER_PELLET
      }
    })

    mazeWithDots[1][1] = CellType.PATH
    mazeWithDots[MAZE_SIZE - 2][MAZE_SIZE - 2] = CellType.EXIT

    const numPlayers = mode === 'coop' ? 2 : 1
    const players: Player[] = []
    for (let i = 0; i < numPlayers; i++) {
      const start = playerStarts[i] || { x: 1, y: 1 }
      players.push({
        id: uuidv4(),
        position: { ...start },
        prevPosition: { ...start },
        score: 0,
        lives: INITIAL_LIVES,
        direction: 'none',
        nextDirection: 'none',
        color: PLAYER_COLORS[i],
        name: PLAYER_NAMES[i],
        moveProgress: 0,
        hasPowerPellet: false,
        powerPelletTimer: 0,
      })
    }

    const ghostNameList = ['Blinky', 'Pinky', 'Inky', 'Clyde']
    const ghosts: Ghost[] = []
    for (let i = 0; i < 4; i++) {
      const start = ghostStarts[i] || { x: 7, y: 7 }
      const safeStart = isPathCell(maze, start.x, start.y)
        ? start
        : findNearestPathCell(maze, start.x, start.y)
      ghosts.push({
        id: uuidv4(),
        position: { ...safeStart },
        prevPosition: { ...safeStart },
        color: GHOST_COLORS[i],
        originalColor: GHOST_COLORS[i],
        isScared: false,
        scaredTimer: 0,
        direction: 'none',
        name: ghostNameList[i],
        moveProgress: 0,
        isEaten: false,
      })
    }

    set({
      maze: mazeWithDots,
      players,
      ghosts,
      powerPellets,
      mode,
      gameStatus: 'playing',
      dotsRemaining: count,
      shockwaves: [],
      level: 1,
      pelletRespawnTimer: PELLET_RESPAWN_INTERVAL,
    })
  },

  addShockwave: (x, y, color) => {
    const wave: Shockwave = {
      id: uuidv4(),
      x,
      y,
      radius: 0,
      maxRadius: CELL_PIXEL_SIZE * 3,
      opacity: 1,
      startTime: performance.now(),
      duration: SHOCKWAVE_DURATION,
      color,
    }
    set((state) => ({ shockwaves: [...state.shockwaves, wave] }))
  },

  pause: () => set({ gameStatus: 'paused' }),
  resume: () => set({ gameStatus: 'playing' }),
  restart: () => {
    const mode = get().mode
    get().initializeGame(mode)
  },

  update: (deltaTime, keyboardState) => {
    const state = get()
    if (state.gameStatus !== 'playing') return

    let { maze, players, ghosts, powerPellets, shockwaves, dotsRemaining, pelletRespawnTimer } = state

    players = updatePlayerMovement(players, maze, keyboardState, deltaTime)
    ghosts = updateGhostMovement(ghosts, players, maze, deltaTime)
    ;({ maze, players, ghosts, powerPellets, dotsRemaining, shockwaves } = handleCollisions(
      maze,
      players,
      ghosts,
      powerPellets,
      dotsRemaining,
      shockwaves,
    ))
    ;({ powerPellets, maze, pelletRespawnTimer } = respawnPowerPellets(
      powerPellets,
      maze,
      pelletRespawnTimer,
      deltaTime,
    ))
    shockwaves = updateShockwaves(shockwaves)
    ;({ players, ghosts } = updateTimers(players, ghosts, deltaTime))

    const alivePlayers = players.filter((p) => p.lives > 0)
    let gameStatus = state.gameStatus

    if (alivePlayers.length === 0) {
      gameStatus = 'gameover'
    } else if (dotsRemaining <= 0) {
      gameStatus = 'win'
    }

    set({
      maze,
      players,
      ghosts,
      powerPellets,
      shockwaves,
      dotsRemaining,
      gameStatus,
      pelletRespawnTimer,
    })
  },

  tick: (deltaTime, keyboardState) => {
    get().update(deltaTime, keyboardState)
  },
}))

function findNearestPathCell(maze: CellType[][], sx: number, sy: number): Position {
  const size = maze.length
  for (let radius = 1; radius < size; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        const x = sx + dx
        const y = sy + dy
        if (x >= 0 && x < size && y >= 0 && y < size && maze[y][x] !== CellType.WALL) {
          return { x, y }
        }
      }
    }
  }
  return { x: 1, y: 1 }
}
