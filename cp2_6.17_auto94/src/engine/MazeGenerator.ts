import { v4 as uuidv4 } from 'uuid'
import type { CellType, Position, Monster } from '@/types'

interface MazeGeneratorResult {
  maze: CellType[][]
  monsters: Monster[]
  startPositions: Position[]
}

export class MazeGenerator {
  static generateMaze(width: number, height: number): MazeGeneratorResult {
    const maze: CellType[][] = []

    for (let y = 0; y < height; y++) {
      maze[y] = []
      for (let x = 0; x < width; x++) {
        maze[y][x] = 'wall'
      }
    }

    const stack: Position[] = []
    const startX = 1
    const startY = 1
    maze[startY][startX] = 'floor'
    stack.push({ x: startX, y: startY })

    const directions = [
      { dx: 0, dy: -2 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
    ]

    while (stack.length > 0) {
      const current = stack[stack.length - 1]
      const shuffled = [...directions].sort(() => Math.random() - 0.5)
      let carved = false

      for (const dir of shuffled) {
        const nx = current.x + dir.dx
        const ny = current.y + dir.dy

        if (nx > 0 && nx < width - 1 && ny > 0 && ny < height - 1 && maze[ny][nx] === 'wall') {
          maze[ny][nx] = 'floor'
          maze[current.y + dir.dy / 2][current.x + dir.dx / 2] = 'floor'
          stack.push({ x: nx, y: ny })
          carved = true
          break
        }
      }

      if (!carved) {
        stack.pop()
      }
    }

    const floorCells: Position[] = []
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        if (maze[y][x] === 'floor') {
          floorCells.push({ x, y })
        }
      }
    }

    const startPositions: Position[] = [
      { x: 1, y: 1 },
      { x: 1, y: 2 },
      { x: 2, y: 1 },
    ]

    const availableCells = floorCells.filter(
      (cell) =>
        !startPositions.some(
          (sp) => sp.x === cell.x && sp.y === cell.y
        ) &&
        Math.abs(cell.x - 1) + Math.abs(cell.y - 1) > 3
    )

    const shuffledCells = [...availableCells].sort(() => Math.random() - 0.5)

    const treasureCount = Math.min(2, Math.floor(shuffledCells.length / 10))
    for (let i = 0; i < treasureCount && i < shuffledCells.length; i++) {
      const pos = shuffledCells[i]
      maze[pos.y][pos.x] = 'treasure'
    }

    const remainingCells = shuffledCells.slice(treasureCount)

    const monsters: Monster[] = []
    const monsterCount = Math.min(5, Math.max(3, Math.floor(remainingCells.length / 8)))
    const monsterTemplates = [
      { name: 'Goblin', hp: 40, attack: 8, defense: 3, speed: 6 },
      { name: 'Orc', hp: 60, attack: 12, defense: 5, speed: 4 },
      { name: 'Skeleton', hp: 35, attack: 10, defense: 2, speed: 7 },
    ]

    for (let i = 0; i < monsterCount && i < remainingCells.length; i++) {
      const pos = remainingCells[i]
      const template = monsterTemplates[i % monsterTemplates.length]
      monsters.push({
        id: uuidv4(),
        name: template.name,
        position: { x: pos.x, y: pos.y },
        hp: template.hp,
        maxHp: template.hp,
        attack: template.attack,
        defense: template.defense,
        speed: template.speed,
        skills: [],
        aiState: 'patrol',
        buffs: [],
        expReward: template.hp,
        goldReward: Math.floor(template.hp * 0.5),
        loot: [],
      })
    }

    return { maze, monsters, startPositions }
  }
}
