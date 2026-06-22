import { CellType, Direction, Position } from '../stores/gameStore'

interface BFSNode {
  x: number
  y: number
  parent: BFSNode | null
}

const DIRS: { dx: number; dy: number; dir: Direction }[] = [
  { dx: 0, dy: -1, dir: 'up' },
  { dx: 1, dy: 0, dir: 'right' },
  { dx: 0, dy: 1, dir: 'down' },
  { dx: -1, dy: 0, dir: 'left' },
]

export function findNextDirectionBFS(
  maze: CellType[][],
  from: Position,
  to: Position,
  currentDirection: Direction = 'none',
): Direction {
  const size = maze.length
  if (from.x === to.x && from.y === to.y) return currentDirection

  const visited: boolean[][] = []
  for (let y = 0; y < size; y++) {
    visited[y] = []
    for (let x = 0; x < size; x++) {
      visited[y][x] = false
    }
  }

  const queue: BFSNode[] = [{ x: from.x, y: from.y, parent: null }]
  visited[from.y][from.x] = true

  let goalNode: BFSNode | null = null

  while (queue.length > 0) {
    const current = queue.shift()!

    if (current.x === to.x && current.y === to.y) {
      goalNode = current
      break
    }

    const shuffledDirs = [...DIRS]
    shuffleArray(shuffledDirs)

    for (const d of shuffledDirs) {
      const nx = current.x + d.dx
      const ny = current.y + d.dy

      if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue
      if (visited[ny][nx]) continue
      if (maze[ny][nx] === CellType.WALL) continue

      visited[ny][nx] = true
      queue.push({ x: nx, y: ny, parent: current })
    }
  }

  if (!goalNode) {
    return getRandomValidDirection(maze, from, currentDirection)
  }

  let walker: BFSNode = goalNode
  while (walker.parent && walker.parent.parent) {
    walker = walker.parent
  }

  if (!walker.parent) {
    return currentDirection
  }

  const dx = walker.x - from.x
  const dy = walker.y - from.y

  for (const d of DIRS) {
    if (d.dx === dx && d.dy === dy) return d.dir
  }

  return currentDirection
}

export function getRandomValidDirection(
  maze: CellType[][],
  pos: Position,
  currentDirection: Direction = 'none',
): Direction {
  const size = maze.length
  const validDirs: Direction[] = []
  const reverse: Record<Direction, Direction> = {
    up: 'down',
    down: 'up',
    left: 'right',
    right: 'left',
    none: 'none',
  }

  for (const d of DIRS) {
    const nx = pos.x + d.dx
    const ny = pos.y + d.dy
    if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue
    if (maze[ny][nx] === CellType.WALL) continue
    if (currentDirection !== 'none' && d.dir === reverse[currentDirection]) continue
    validDirs.push(d.dir)
  }

  if (validDirs.length === 0) {
    const anyValid: Direction[] = []
    for (const d of DIRS) {
      const nx = pos.x + d.dx
      const ny = pos.y + d.dy
      if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue
      if (maze[ny][nx] === CellType.WALL) continue
      anyValid.push(d.dir)
    }
    if (anyValid.length === 0) return 'none'
    return anyValid[Math.floor(Math.random() * anyValid.length)]
  }

  return validDirs[Math.floor(Math.random() * validDirs.length)]
}

export function moveInDirection(pos: Position, dir: Direction): Position {
  const result = { ...pos }
  switch (dir) {
    case 'up':
      result.y -= 1
      break
    case 'down':
      result.y += 1
      break
    case 'left':
      result.x -= 1
      break
    case 'right':
      result.x += 1
      break
  }
  return result
}

export function canMoveInDirection(maze: CellType[][], pos: Position, dir: Direction): boolean {
  const size = maze.length
  let nx = pos.x
  let ny = pos.y
  switch (dir) {
    case 'up':
      ny -= 1
      break
    case 'down':
      ny += 1
      break
    case 'left':
      nx -= 1
      break
    case 'right':
      nx += 1
      break
  }
  if (nx < 0 || nx >= size || ny < 0 || ny >= size) return false
  return maze[ny][nx] !== CellType.WALL
}

export function findFarthestPlayerPosition(
  maze: CellType[][],
  ghostPos: Position,
  playerPositions: Position[],
): Position {
  if (playerPositions.length === 0) return ghostPos
  let farthest = playerPositions[0]
  let maxDist = 0
  for (const p of playerPositions) {
    const dist = Math.abs(p.x - ghostPos.x) + Math.abs(p.y - ghostPos.y)
    if (dist > maxDist) {
      maxDist = dist
      farthest = p
    }
  }
  return farthest
}

export function findNearestPlayerPosition(
  ghostPos: Position,
  playerPositions: Position[],
): Position {
  if (playerPositions.length === 0) return ghostPos
  let nearest = playerPositions[0]
  let minDist = Infinity
  for (const p of playerPositions) {
    const dist = Math.abs(p.x - ghostPos.x) + Math.abs(p.y - ghostPos.y)
    if (dist < minDist) {
      minDist = dist
      nearest = p
    }
  }
  return nearest
}

function shuffleArray<T>(arr: T[]) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const tmp = arr[i]
    arr[i] = arr[j]
    arr[j] = tmp
  }
}
