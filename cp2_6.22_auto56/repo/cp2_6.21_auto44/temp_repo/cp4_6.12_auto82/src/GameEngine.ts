export type Direction = 'up' | 'down' | 'left' | 'right'

export interface Position {
  x: number
  y: number
}

export interface Snake {
  id: number
  name: string
  color: string
  body: Position[]
  direction: Direction
  nextDirection: Direction
  isAlive: boolean
  deathTime: number | null
  speedBoost: boolean
  speedBoostEndTime: number
  score: number
}

export interface Food {
  position: Position
  type: 'normal' | 'speed'
}

export interface GameState {
  snakes: Snake[]
  foods: Food[]
  gameStatus: 'menu' | 'playing' | 'ended'
  winner: Snake | null
  timeRemaining: number
  mapWidth: number
  mapHeight: number
  tickCount: number
  startTime: number
}

const MAP_WIDTH = 800
const MAP_HEIGHT = 600
const SEGMENT_SIZE = 6
const INITIAL_LENGTH = 3
const NORMAL_FOOD_COUNT = 10
const SPEED_FOOD_COUNT = 5
const GAME_DURATION = 120
const BASE_MOVE_INTERVAL = 100
const DEATH_FADE_DURATION = 2000
const SPEED_BOOST_DURATION = 3000

const PLAYER_COLORS = [
  { color: '#3b82f6', name: '玩家1' },
  { color: '#ef4444', name: '玩家2' },
  { color: '#eab308', name: '玩家3' },
  { color: '#f97316', name: '玩家4' },
  { color: '#06b6d4', name: '玩家5' },
  { color: '#ec4899', name: '玩家6' },
]

const DIRECTIONS: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function positionsEqual(a: Position, b: Position): boolean {
  return a.x === b.x && a.y === b.y
}

function isPositionOccupied(pos: Position, snakes: Snake[], foods: Food[]): boolean {
  for (const snake of snakes) {
    for (const seg of snake.body) {
      if (positionsEqual(seg, pos)) return true
    }
  }
  for (const food of foods) {
    if (positionsEqual(food.position, pos)) return true
  }
  return false
}

function generateRandomPosition(occupied: { x: number; y: number }[], snakes: Snake[], foods: Food[], margin: number = 3): Position {
  const gridW = Math.floor(MAP_WIDTH / SEGMENT_SIZE)
  const gridH = Math.floor(MAP_HEIGHT / SEGMENT_SIZE)
  let attempts = 0
  while (attempts < 1000) {
    const x = randomInt(margin, gridW - margin - 1) * SEGMENT_SIZE
    const y = randomInt(margin, gridH - margin - 1) * SEGMENT_SIZE
    const pos = { x, y }
    let ok = true
    for (const o of occupied) {
      if (Math.abs(o.x - pos.x) < SEGMENT_SIZE * 5 && Math.abs(o.y - pos.y) < SEGMENT_SIZE * 5) {
        ok = false
        break
      }
    }
    if (ok && !isPositionOccupied(pos, snakes, foods)) return pos
    attempts++
  }
  return { x: margin * SEGMENT_SIZE, y: margin * SEGMENT_SIZE }
}

function createInitialSnake(id: number, config: { color: string; name: string }, allSnakes: Snake[], foods: Food[]): Snake {
  const directionList: Direction[] = ['up', 'down', 'left', 'right']
  const direction = directionList[randomInt(0, 3)]
  const existingPositions = allSnakes.flatMap(s => s.body)
  const headPos = generateRandomPosition(existingPositions, allSnakes, foods, 8)
  const body: Position[] = []
  const dir = DIRECTIONS[direction]
  for (let i = 0; i < INITIAL_LENGTH; i++) {
    body.push({
      x: headPos.x - dir.x * SEGMENT_SIZE * i,
      y: headPos.y - dir.y * SEGMENT_SIZE * i,
    })
  }
  return {
    id,
    name: config.name,
    color: config.color,
    body,
    direction,
    nextDirection: direction,
    isAlive: true,
    deathTime: null,
    speedBoost: false,
    speedBoostEndTime: 0,
    score: INITIAL_LENGTH,
  }
}

function generateFood(type: 'normal' | 'speed', snakes: Snake[], foods: Food[]): Food {
  const existingPositions = snakes.flatMap(s => s.body).concat(foods.map(f => f.position))
  return {
    position: generateRandomPosition(existingPositions, snakes, foods, 1),
    type,
  }
}

export class GameEngine {
  private state: GameState
  private lastMoveTimes: Map<number, number> = new Map()
  private playerCount: number

  constructor(playerCount: number) {
    this.playerCount = Math.max(4, Math.min(6, playerCount))
    this.state = this.createInitialState()
  }

  private createInitialState(): GameState {
    const snakes: Snake[] = []
    const foods: Food[] = []
    for (let i = 0; i < this.playerCount; i++) {
      const config = PLAYER_COLORS[i]
      const snake = createInitialSnake(i, config, snakes, foods)
      snakes.push(snake)
    }
    for (let i = 0; i < NORMAL_FOOD_COUNT; i++) {
      foods.push(generateFood('normal', snakes, foods))
    }
    for (let i = 0; i < SPEED_FOOD_COUNT; i++) {
      foods.push(generateFood('speed', snakes, foods))
    }
    return {
      snakes,
      foods,
      gameStatus: 'menu',
      winner: null,
      timeRemaining: GAME_DURATION,
      mapWidth: MAP_WIDTH,
      mapHeight: MAP_HEIGHT,
      tickCount: 0,
      startTime: 0,
    }
  }

  start(): void {
    const now = performance.now()
    this.state.gameStatus = 'playing'
    this.state.startTime = now
    this.state.timeRemaining = GAME_DURATION
    this.state.winner = null
    for (let i = 0; i < this.state.snakes.length; i++) {
      this.lastMoveTimes.set(i, now)
    }
  }

  reset(playerCount?: number): void {
    if (playerCount !== undefined) {
      this.playerCount = Math.max(4, Math.min(6, playerCount))
    }
    this.state = this.createInitialState()
    this.lastMoveTimes.clear()
  }

  getState(): GameState {
    return this.state
  }

  setDirection(playerId: number, dir: Direction): void {
    const snake = this.state.snakes[playerId]
    if (!snake || !snake.isAlive) return
    if (OPPOSITE[snake.direction] === dir) return
    snake.nextDirection = dir
  }

  tick(): void {
    if (this.state.gameStatus !== 'playing') return
    const now = performance.now()
    this.state.tickCount++

    const elapsed = (now - this.state.startTime) / 1000
    this.state.timeRemaining = Math.max(0, GAME_DURATION - elapsed)

    for (let i = 0; i < this.state.snakes.length; i++) {
      const snake = this.state.snakes[i]
      if (!snake.isAlive) continue
      const interval = snake.speedBoost ? BASE_MOVE_INTERVAL / 1.5 : BASE_MOVE_INTERVAL
      const lastMove = this.lastMoveTimes.get(i) ?? now
      if (now - lastMove < interval) continue
      this.lastMoveTimes.set(i, now)
      this.moveSnake(snake)
    }

    this.checkCollisions()

    for (const snake of this.state.snakes) {
      if (snake.speedBoost && now >= snake.speedBoostEndTime) {
        snake.speedBoost = false
      }
    }

    const aliveSnakes = this.state.snakes.filter(s => s.isAlive)
    if (aliveSnakes.length <= 1 || this.state.timeRemaining <= 0) {
      this.endGame()
    }
  }

  private moveSnake(snake: Snake): void {
    snake.direction = snake.nextDirection
    const dir = DIRECTIONS[snake.direction]
    const head = snake.body[0]
    const newHead = {
      x: head.x + dir.x * SEGMENT_SIZE,
      y: head.y + dir.y * SEGMENT_SIZE,
    }
    snake.body.unshift(newHead)
    snake.body.pop()
  }

  private checkCollisions(): void {
    const now = performance.now()
    const aliveSnakes = this.state.snakes.filter(s => s.isAlive)

    for (const snake of aliveSnakes) {
      const head = snake.body[0]
      if (head.x < 0 || head.x >= MAP_WIDTH || head.y < 0 || head.y >= MAP_HEIGHT) {
        this.killSnake(snake, now)
        continue
      }
      for (const other of this.state.snakes) {
        if (!other.isAlive && other.deathTime !== null && now - other.deathTime > DEATH_FADE_DURATION) continue
        const bodyToCheck = snake === other ? other.body.slice(1) : other.body
        for (let i = 0; i < bodyToCheck.length; i++) {
          if (positionsEqual(head, bodyToCheck[i])) {
            this.killSnake(snake, now)
            break
          }
        }
        if (!snake.isAlive) break
      }
    }

    for (let i = this.state.foods.length - 1; i >= 0; i--) {
      const food = this.state.foods[i]
      for (const snake of aliveSnakes) {
        if (!snake.isAlive) continue
        if (positionsEqual(snake.body[0], food.position)) {
          this.eatFood(snake, food, now)
          this.state.foods.splice(i, 1)
          const newFood = generateFood(food.type, this.state.snakes, this.state.foods)
          this.state.foods.push(newFood)
          break
        }
      }
    }

    this.state.snakes = this.state.snakes.filter(s => {
      if (s.isAlive) return true
      if (s.deathTime === null) return true
      return now - s.deathTime < DEATH_FADE_DURATION
    })
  }

  private killSnake(snake: Snake, now: number): void {
    snake.isAlive = false
    snake.deathTime = now
  }

  private eatFood(snake: Snake, food: Food, now: number): void {
    if (food.type === 'normal') {
      const tail = snake.body[snake.body.length - 1]
      snake.body.push({ ...tail })
      snake.score = snake.body.length
    } else {
      snake.speedBoost = true
      snake.speedBoostEndTime = now + SPEED_BOOST_DURATION
    }
  }

  private endGame(): void {
    this.state.gameStatus = 'ended'
    const aliveSnakes = this.state.snakes.filter(s => s.isAlive)
    if (aliveSnakes.length === 1) {
      this.state.winner = aliveSnakes[0]
    } else {
      const sorted = [...this.state.snakes].sort((a, b) => b.score - a.score)
      this.state.winner = sorted[0] ?? null
    }
  }
}
