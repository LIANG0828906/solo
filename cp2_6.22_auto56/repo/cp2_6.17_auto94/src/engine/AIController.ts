import type { Monster, Hero, Position, CellType } from '@/types'

export type AIAction =
  | { type: 'move'; monsterId: string; position: Position; aiState: 'patrol' | 'chase' | 'attack' }
  | { type: 'attack'; monsterId: string; heroId: string; aiState: 'attack' }
  | { type: 'wait'; monsterId: string; aiState: 'patrol' | 'chase' | 'attack' }

export class AIController {
  private static readonly CHASE_DISTANCE = 3
  private static readonly PATROL_DISTANCE = 6
  private static readonly ATTACK_DISTANCE = 1

  static getAction(
    monster: Monster,
    heroes: Hero[],
    maze: CellType[][]
  ): AIAction {
    const aliveHeroes = heroes.filter((h) => h.hp > 0)
    if (aliveHeroes.length === 0) {
      return { type: 'wait', monsterId: monster.id, aiState: monster.aiState }
    }

    let nearestHero: Hero | null = null
    let nearestDistance = Infinity

    for (const hero of aliveHeroes) {
      const distance = this.getChebyshevDistance(monster.position, hero.position)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestHero = hero
      }
    }

    if (!nearestHero) {
      return { type: 'wait', monsterId: monster.id, aiState: monster.aiState }
    }

    let aiState = monster.aiState

    if (nearestDistance <= this.ATTACK_DISTANCE) {
      aiState = 'attack'
    } else if (nearestDistance < this.CHASE_DISTANCE) {
      aiState = 'chase'
    } else if (aiState === 'chase' && nearestDistance > this.PATROL_DISTANCE) {
      aiState = 'patrol'
    } else if (aiState !== 'chase' && aiState !== 'attack') {
      aiState = 'patrol'
    }

    if (aiState === 'attack' && nearestDistance <= this.ATTACK_DISTANCE) {
      return {
        type: 'attack',
        monsterId: monster.id,
        heroId: nearestHero.id,
        aiState: 'attack',
      }
    }

    if (aiState === 'chase') {
      const nextPos = this.bfsNextStep(
        monster.position,
        nearestHero.position,
        maze,
        heroes,
        monster.id
      )
      if (nextPos) {
        return {
          type: 'move',
          monsterId: monster.id,
          position: nextPos,
          aiState: 'chase',
        }
      }
    }

    const patrolPos = this.getPatrolMove(monster.position, maze, heroes, monster.id)
    if (patrolPos) {
      return {
        type: 'move',
        monsterId: monster.id,
        position: patrolPos,
        aiState: 'patrol',
      }
    }

    return { type: 'wait', monsterId: monster.id, aiState }
  }

  private static bfsNextStep(
    start: Position,
    goal: Position,
    maze: CellType[][],
    heroes: Hero[],
    _monsterId: string
  ): Position | null {
    if (start.x === goal.x && start.y === goal.y) return null

    const rows = maze.length
    const cols = maze[0].length

    const queue: Position[] = [start]
    const visited = new Set<string>()
    const parent = new Map<string, Position | null>()

    visited.add(`${start.x},${start.y}`)
    parent.set(`${start.x},${start.y}`, null)

    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: 1 },
    ]

    let found = false

    while (queue.length > 0) {
      const current = queue.shift()!

      if (current.x === goal.x && current.y === goal.y) {
        found = true
        break
      }

      for (const dir of directions) {
        const nx = current.x + dir.dx
        const ny = current.y + dir.dy
        const key = `${nx},${ny}`

        if (nx < 0 || ny < 0 || nx >= cols || ny >= rows) continue
        if (visited.has(key)) continue
        if (maze[ny][nx] === 'wall') continue

        const heroOnCell = heroes.some(
          (h) => h.hp > 0 && h.position.x === nx && h.position.y === ny
        )
        if (heroOnCell && !(nx === goal.x && ny === goal.y)) continue

        visited.add(key)
        parent.set(key, current)
        queue.push({ x: nx, y: ny })
      }
    }

    if (!found) return null

    let curr: Position | null = goal
    let prev: Position | null = null

    while (curr && parent.has(`${curr.x},${curr.y}`)) {
      const p: Position | null = parent.get(`${curr.x},${curr.y}`) ?? null
      if (p && p.x === start.x && p.y === start.y) {
        prev = curr
        break
      }
      curr = p
    }

    return prev
  }

  private static getChebyshevDistance(a: Position, b: Position): number {
    return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y))
  }

  private static getPatrolMove(
    from: Position,
    maze: CellType[][],
    heroes: Hero[],
    monsterId: string
  ): Position | null {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
      { dx: -1, dy: -1 },
      { dx: 1, dy: -1 },
      { dx: 1, dy: 1 },
      { dx: -1, dy: 1 },
    ].sort(() => Math.random() - 0.5)

    for (const dir of directions) {
      const nx = from.x + dir.dx
      const ny = from.y + dir.dy

      if (this.isValidMove(nx, ny, maze, heroes, monsterId)) {
        return { x: nx, y: ny }
      }
    }

    return null
  }

  private static isValidMove(
    x: number,
    y: number,
    maze: CellType[][],
    heroes: Hero[],
    _monsterId: string
  ): boolean {
    if (x < 0 || y < 0 || y >= maze.length || x >= maze[0].length) {
      return false
    }

    if (maze[y][x] === 'wall') {
      return false
    }

    const heroOnCell = heroes.some(
      (h) => h.hp > 0 && h.position.x === x && h.position.y === y
    )
    if (heroOnCell) {
      return false
    }

    return true
  }
}
