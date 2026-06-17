import { v4 as uuidv4 } from 'uuid'
import {
  CellType,
  Direction,
  Ghost,
  KeyboardState,
  Player,
  Position,
  PowerPellet,
  Shockwave,
  CELL_PIXEL_SIZE,
  PLAYER_SPEED,
  GHOST_SPEED,
  GHOST_SCARED_SPEED,
  POWER_PELLET_DURATION,
  SHOCKWAVE_DURATION,
  PELLET_RESPAWN_INTERVAL,
  POINTS_DOT,
  POINTS_POWER_PELLET,
  POINTS_GHOST,
} from '../stores/gameStore'
import {
  findNextDirectionBFS,
  getRandomValidDirection,
  moveInDirection,
  canMoveInDirection,
  findNearestPlayerPosition,
  findFarthestPlayerPosition,
} from './GhostAI'
import { findNewPelletPosition } from './MazeGenerator'

function keyboardToDirection(
  kb: { up: boolean; down: boolean; left: boolean; right: boolean },
  maze: CellType[][],
  pos: Position,
): Direction {
  const tryOrder: Direction[] = []
  if (kb.up) tryOrder.push('up')
  if (kb.down) tryOrder.push('down')
  if (kb.left) tryOrder.push('left')
  if (kb.right) tryOrder.push('right')

  for (const d of tryOrder) {
    if (canMoveInDirection(maze, pos, d)) return d
  }
  return 'none'
}

export function updatePlayerMovement(
  players: Player[],
  maze: CellType[][],
  keyboardState: KeyboardState,
  deltaTime: number,
): Player[] {
  const newPlayers: Player[] = []

  for (let i = 0; i < players.length; i++) {
    const p = { ...players[i] }
    const kb = i === 0 ? keyboardState.player1 : keyboardState.player2

    if (p.moveProgress <= 0) {
      const inputDir = keyboardToDirection(kb, maze, p.position)
      if (inputDir !== 'none') {
        p.nextDirection = inputDir
      }

      let useDir: Direction = p.direction
      if (p.nextDirection !== 'none') {
        if (canMoveInDirection(maze, p.position, p.nextDirection)) {
          useDir = p.nextDirection
        }
      }

      if (useDir !== 'none' && canMoveInDirection(maze, p.position, useDir)) {
        p.direction = useDir
        p.prevPosition = { ...p.position }
        p.position = moveInDirection(p.position, useDir)
        p.moveProgress = 1.0
      } else {
        p.direction = 'none'
      }
    } else {
      const moveAmount = (PLAYER_SPEED * deltaTime) / 1000
      p.moveProgress = Math.max(0, p.moveProgress - moveAmount)
    }

    newPlayers.push(p)
  }

  return newPlayers
}

export function updateGhostMovement(
  ghosts: Ghost[],
  players: Player[],
  maze: CellType[][],
  deltaTime: number,
): Ghost[] {
  const alivePlayers = players.filter((p) => p.lives > 0)
  const playerPositions = alivePlayers.map((p) => p.position)
  const newGhosts: Ghost[] = []

  for (let gi = 0; gi < ghosts.length; gi++) {
    const g = { ...ghosts[gi] }

    if (g.moveProgress <= 0) {
      if (g.isEaten) {
        g.moveProgress = 0
        newGhosts.push(g)
        continue
      }

      let target: Position
      let nextDir: Direction

      if (g.isScared) {
        if (alivePlayers.length > 0) {
          target = findFarthestPlayerPosition(maze, g.position, playerPositions)
        } else {
          target = g.position
        }
        if (Math.random() < 0.35) {
          nextDir = getRandomValidDirection(maze, g.position, g.direction)
        } else {
          nextDir = findNextDirectionBFS(maze, g.position, target, g.direction)
        }
      } else {
        if (alivePlayers.length > 0) {
          const offset = gi % 2 === 0 ? 0 : 1
          let pTarget: Position
          if (gi === 0 && alivePlayers.length >= 1) {
            pTarget = alivePlayers[0].position
          } else if (gi === 1 && alivePlayers.length >= 1) {
            pTarget = alivePlayers[Math.min(alivePlayers.length - 1, offset)].position
          } else {
            pTarget = findNearestPlayerPosition(g.position, playerPositions)
          }
          target = pTarget
        } else {
          target = g.position
        }
        nextDir = findNextDirectionBFS(maze, g.position, target, g.direction)
        if (nextDir === 'none' || !canMoveInDirection(maze, g.position, nextDir)) {
          nextDir = getRandomValidDirection(maze, g.position, g.direction)
        }
      }

      if (nextDir !== 'none' && canMoveInDirection(maze, g.position, nextDir)) {
        g.direction = nextDir
        g.prevPosition = { ...g.position }
        g.position = moveInDirection(g.position, nextDir)
        g.moveProgress = 1.0
      }
    } else {
      const speed = g.isScared ? GHOST_SCARED_SPEED : GHOST_SPEED
      const moveAmount = (speed * deltaTime) / 1000
      g.moveProgress = Math.max(0, g.moveProgress - moveAmount)
    }

    newGhosts.push(g)
  }

  return newGhosts
}

export interface CollisionResult {
  maze: CellType[][]
  players: Player[]
  ghosts: Ghost[]
  powerPellets: PowerPellet[]
  dotsRemaining: number
  shockwaves: Shockwave[]
}

export function handleCollisions(
  maze: CellType[][],
  players: Player[],
  ghosts: Ghost[],
  powerPellets: PowerPellet[],
  dotsRemaining: number,
  shockwaves: Shockwave[],
): CollisionResult {
  const size = maze.length
  const newMaze = maze.map((row) => [...row])
  const newPlayers = players.map((p) => ({ ...p }))
  const newGhosts = ghosts.map((g) => ({ ...g }))
  let newShockwaves = [...shockwaves]
  let newDotsRemaining = dotsRemaining
  let newPowerPellets = powerPellets.map((pp) => ({ ...pp }))

  for (const p of newPlayers) {
    if (p.lives <= 0) continue
    const { x, y } = p.position

    if (x < 0 || x >= size || y < 0 || y >= size) continue
    const cell = newMaze[y][x]

    if (cell === CellType.DOT) {
      newMaze[y][x] = CellType.PATH
      p.score += POINTS_DOT
      newDotsRemaining = Math.max(0, newDotsRemaining - 1)
    } else if (cell === CellType.POWER_PELLET) {
      newMaze[y][x] = CellType.PATH
      p.score += POINTS_POWER_PELLET
      p.hasPowerPellet = true
      p.powerPelletTimer = Math.max(p.powerPelletTimer, POWER_PELLET_DURATION)

      newPowerPellets = newPowerPellets.map((pp) => {
        if (pp.position.x === x && pp.position.y === y) {
          return { ...pp, isVisible: false, respawnTimer: PELLET_RESPAWN_INTERVAL }
        }
        return pp
      })

      for (let gi = 0; gi < newGhosts.length; gi++) {
        if (!newGhosts[gi].isEaten) {
          newGhosts[gi].isScared = true
          newGhosts[gi].scaredTimer = POWER_PELLET_DURATION
          newGhosts[gi].color = '#8B00FF'
        }
      }

      const wave: Shockwave = {
        id: uuidv4(),
        x: x * CELL_PIXEL_SIZE + CELL_PIXEL_SIZE / 2,
        y: y * CELL_PIXEL_SIZE + CELL_PIXEL_SIZE / 2,
        radius: 0,
        maxRadius: CELL_PIXEL_SIZE * 3,
        opacity: 1,
        startTime: performance.now(),
        duration: SHOCKWAVE_DURATION,
        color: p.color,
      }
      newShockwaves.push(wave)
    }
  }

  for (const p of newPlayers) {
    if (p.lives <= 0) continue

    for (let gi = 0; gi < newGhosts.length; gi++) {
      const g = newGhosts[gi]
      if (g.isEaten) continue

      const sameCell = p.position.x === g.position.x && p.position.y === g.position.y
      let movingInto = false
      if (p.prevPosition.x === g.position.x && p.prevPosition.y === g.position.y &&
          g.prevPosition.x === p.position.x && g.prevPosition.y === p.position.y) {
        movingInto = true
      }

      if (sameCell || movingInto) {
        if (g.isScared) {
          p.score += POINTS_GHOST
          newGhosts[gi] = { ...g, isEaten: true, isScared: false, scaredTimer: 0, color: g.originalColor }
          const wave: Shockwave = {
            id: uuidv4(),
            x: g.position.x * CELL_PIXEL_SIZE + CELL_PIXEL_SIZE / 2,
            y: g.position.y * CELL_PIXEL_SIZE + CELL_PIXEL_SIZE / 2,
            radius: 0,
            maxRadius: CELL_PIXEL_SIZE * 2,
            opacity: 1,
            startTime: performance.now(),
            duration: SHOCKWAVE_DURATION,
            color: g.originalColor,
          }
          newShockwaves.push(wave)
        } else {
          p.lives = Math.max(0, p.lives - 1)
          const wave: Shockwave = {
            id: uuidv4(),
            x: p.position.x * CELL_PIXEL_SIZE + CELL_PIXEL_SIZE / 2,
            y: p.position.y * CELL_PIXEL_SIZE + CELL_PIXEL_SIZE / 2,
            radius: 0,
            maxRadius: CELL_PIXEL_SIZE * 2.5,
            opacity: 1,
            startTime: performance.now(),
            duration: SHOCKWAVE_DURATION,
            color: '#FF0000',
          }
          newShockwaves.push(wave)
          if (p.lives <= 0) {
            break
          }
        }
      }
    }
  }

  return {
    maze: newMaze,
    players: newPlayers,
    ghosts: newGhosts,
    powerPellets: newPowerPellets,
    dotsRemaining: newDotsRemaining,
    shockwaves: newShockwaves,
  }
}

export interface RespawnResult {
  powerPellets: PowerPellet[]
  maze: CellType[][]
  pelletRespawnTimer: number
}

export function respawnPowerPellets(
  pellets: PowerPellet[],
  maze: CellType[][],
  globalTimer: number,
  deltaTime: number,
): RespawnResult {
  const size = maze.length
  let newMaze = maze.map((row) => [...row])
  let newGlobalTimer = globalTimer - deltaTime
  let newPellets = pellets.map((p) => ({ ...p }))

  if (newGlobalTimer <= 0) {
    newGlobalTimer = PELLET_RESPAWN_INTERVAL
    const avoid: Position[] = []
    for (const p of newPellets) {
      if (p.isVisible) avoid.push(p.position)
    }

    for (let i = 0; i < newPellets.length; i++) {
      if (!newPellets[i].isVisible) {
        const newPos = findNewPelletPosition(newMaze, avoid)
        if (newPos) {
          if (
            newPellets[i].position.y >= 0 &&
            newPellets[i].position.y < size &&
            newPellets[i].position.x >= 0 &&
            newPellets[i].position.x < size
          ) {
            const oldCell = newMaze[newPellets[i].position.y][newPellets[i].position.x]
            if (oldCell === CellType.POWER_PELLET) {
              newMaze[newPellets[i].position.y][newPellets[i].position.x] = CellType.DOT
            }
          }

          if (newMaze[newPos.y][newPos.x] === CellType.DOT) {
            newMaze[newPos.y][newPos.x] = CellType.POWER_PELLET
          } else if (newMaze[newPos.y][newPos.x] === CellType.PATH) {
            newMaze[newPos.y][newPos.x] = CellType.POWER_PELLET
          }
          newPellets[i] = { ...newPellets[i], position: newPos, isVisible: true }
          avoid.push(newPos)
        }
      }
    }
  } else {
    for (let i = 0; i < newPellets.length; i++) {
      if (!newPellets[i].isVisible) {
        newPellets[i].respawnTimer = Math.max(0, newPellets[i].respawnTimer - deltaTime)
      }
    }
  }

  return {
    powerPellets: newPellets,
    maze: newMaze,
    pelletRespawnTimer: newGlobalTimer,
  }
}

export function updateShockwaves(shockwaves: Shockwave[]): Shockwave[] {
  const now = performance.now()
  const result: Shockwave[] = []
  for (const s of shockwaves) {
    const elapsed = now - s.startTime
    if (elapsed >= s.duration) continue
    const t = elapsed / s.duration
    result.push({
      ...s,
      radius: s.maxRadius * t,
      opacity: 1 - t,
    })
  }
  return result
}

export interface TimerResult {
  players: Player[]
  ghosts: Ghost[]
}

export function updateTimers(players: Player[], ghosts: Ghost[], deltaTime: number): TimerResult {
  const newPlayers = players.map((p) => {
    const np = { ...p }
    if (np.hasPowerPellet) {
      np.powerPelletTimer = Math.max(0, np.powerPelletTimer - deltaTime)
      if (np.powerPelletTimer <= 0) {
        np.hasPowerPellet = false
      }
    }
    return np
  })

  const newGhosts = ghosts.map((g) => {
    const ng = { ...g }
    if (ng.isScared) {
      ng.scaredTimer = Math.max(0, ng.scaredTimer - deltaTime)
      if (ng.scaredTimer <= 0 && !ng.isEaten) {
        ng.isScared = false
        ng.color = ng.originalColor
      }
    }
    return ng
  })

  return { players: newPlayers, ghosts: newGhosts }
}
