import type { Monster, Hero, Position, CellType } from '@/types'

export type AIAction =
  | { type: 'move'; monsterId: string; position: Position }
  | { type: 'attack'; monsterId: string; heroId: string }
  | { type: 'wait'; monsterId: string }

export class AIController {
  static getAction(
    monster: Monster,
    heroes: Hero[],
    maze: CellType[][]
  ): AIAction {
    const aliveHeroes = heroes.filter((h) => h.hp > 0)
    if (aliveHeroes.length === 0) {
      return { type: 'wait', monsterId: monster.id }
    }

    let nearestHero: Hero | null = null
    let nearestDistance = Infinity

    for (const hero of aliveHeroes) {
      const distance = this.getDistance(monster.position, hero.position)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearestHero = hero
      }
    }

    if (!nearestHero) {
      return { type: 'wait', monsterId: monster.id }
    }

    let aiState = monster.aiState
    if (nearestDistance < 3) {
      aiState = 'chase'
    } else if (nearestDistance > 6) {
      aiState = 'patrol'
    }

    if (nearestDistance <= 1) {
      aiState = 'attack'
    }

    if (aiState === 'attack' && nearestDistance <= 1) {
      return {
        type: 'attack',
        monsterId: monster.id,
        heroId: nearestHero.id,
      }
    }

    if (aiState === 'chase' || aiState === 'attack') {
      const nextPos = this.getNextStepTowards(
        monster.position,
        nearestHero.position,
        maze,
        heroes
      )
      if (nextPos) {
        return {
          type: 'move',
          monsterId: monster.id,
          position: nextPos,
        }
      }
    }

    const patrolPos = this.getPatrolMove(monster.position, maze, heroes)
    if (patrolPos) {
      return {
        type: 'move',
        monsterId: monster.id,
        position: patrolPos,
      }
    }

    return { type: 'wait', monsterId: monster.id }
  }

  private static getDistance(a: Position, b: Position): number {
    return Math.abs(a.x - b.x) + Math.abs(a.y - b.y)
  }

  private static getNextStepTowards(
    from: Position,
    to: Position,
    maze: CellType[][],
    heroes: Hero[]
  ): Position | null {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ]

    let bestDir: { dx: number; dy: number } | null = null
    let bestDistance = this.getDistance(from, to)

    for (const dir of directions) {
      const nx = from.x + dir.dx
      const ny = from.y + dir.dy

      if (this.isValidMove(nx, ny, maze, heroes)) {
        const dist = this.getDistance({ x: nx, y: ny }, to)
        if (dist < bestDistance) {
          bestDistance = dist
          bestDir = dir
        }
      }
    }

    if (bestDir) {
      return { x: from.x + bestDir.dx, y: from.y + bestDir.dy }
    }

    return null
  }

  private static getPatrolMove(
    from: Position,
    maze: CellType[][],
    heroes: Hero[]
  ): Position | null {
    const directions = [
      { dx: 0, dy: -1 },
      { dx: 1, dy: 0 },
      { dx: 0, dy: 1 },
      { dx: -1, dy: 0 },
    ].sort(() => Math.random() - 0.5)

    for (const dir of directions) {
      const nx = from.x + dir.dx
      const ny = from.y + dir.dy

      if (this.isValidMove(nx, ny, maze, heroes)) {
        return { x: nx, y: ny }
      }
    }

    return null
  }

  private static isValidMove(
    x: number,
    y: number,
    maze: CellType[][],
    heroes: Hero[]
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
