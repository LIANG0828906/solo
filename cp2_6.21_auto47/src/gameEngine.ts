export const GRID_SIZE = 8
export const MAX_TURNS = 15
export const MIN_ENEMIES = 6
export const MIN_CHESTS = 2
export const MIN_TRAPS = 1

export type CellType = 'empty' | 'enemy' | 'chest' | 'trap' | 'exit'

export interface Position {
  x: number
  y: number
}

export interface Cell {
  type: CellType
  enemyHP?: number
  enemyMaxHP?: number
  chestContent?: { type: 'gold' | 'potion'; value: number }
}

export interface Enemy {
  position: Position
  hp: number
  maxHp: number
  id: string
}

export interface CombatState {
  playerHP: number
  playerMaxHP: number
  enemyHP: number
  enemyMaxHP: number
  enemyId: string
  playerDefending: boolean
  log: string[]
  isActive: boolean
}

export interface DungeonData {
  grid: Cell[][]
  enemies: Enemy[]
  playerStart: Position
  exitPosition: Position
}

export class DungeonGenerator {
  generate(): DungeonData {
    const grid: Cell[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() =>
        Array(GRID_SIZE)
          .fill(null)
          .map(() => ({ type: 'empty' as CellType }))
      )

    const playerStart: Position = { x: 0, y: 0 }
    const exitPosition: Position = { x: GRID_SIZE - 1, y: GRID_SIZE - 1 }

    grid[exitPosition.y][exitPosition.x] = { type: 'exit' }

    const usedPositions = new Set<string>()
    usedPositions.add(`${playerStart.x},${playerStart.y}`)
    usedPositions.add(`${exitPosition.x},${exitPosition.y}`)

    const getRandomEmptyPos = (): Position | null => {
      const available: Position[] = []
      for (let y = 0; y < GRID_SIZE; y++) {
        for (let x = 0; x < GRID_SIZE; x++) {
          if (!usedPositions.has(`${x},${y}`)) {
            available.push({ x, y })
          }
        }
      }
      if (available.length === 0) return null
      return available[Math.floor(Math.random() * available.length)]
    }

    const enemies: Enemy[] = []

    for (let i = 0; i < MIN_ENEMIES; i++) {
      const pos = getRandomEmptyPos()
      if (pos) {
        const maxHp = 20 + Math.floor(Math.random() * 10)
        const enemyId = `enemy-${Date.now()}-${i}`
        grid[pos.y][pos.x] = {
          type: 'enemy',
          enemyHP: maxHp,
          enemyMaxHP: maxHp,
        }
        enemies.push({
          position: pos,
          hp: maxHp,
          maxHp,
          id: enemyId,
        })
        usedPositions.add(`${pos.x},${pos.y}`)
      }
    }

    for (let i = 0; i < MIN_CHESTS; i++) {
      const pos = getRandomEmptyPos()
      if (pos) {
        const isGold = Math.random() > 0.5
        grid[pos.y][pos.x] = {
          type: 'chest',
          chestContent: {
            type: isGold ? 'gold' : 'potion',
            value: isGold ? 5 + Math.floor(Math.random() * 16) : 10,
          },
        }
        usedPositions.add(`${pos.x},${pos.y}`)
      }
    }

    for (let i = 0; i < MIN_TRAPS; i++) {
      const pos = getRandomEmptyPos()
      if (pos) {
        grid[pos.y][pos.x] = { type: 'trap' }
        usedPositions.add(`${pos.x},${pos.y}`)
      }
    }

    return { grid, enemies, playerStart, exitPosition }
  }
}

export class TurnManager {
  isAdjacent(pos1: Position, pos2: Position): boolean {
    const dx = Math.abs(pos1.x - pos2.x)
    const dy = Math.abs(pos1.y - pos2.y)
    return (dx === 1 && dy === 0) || (dx === 0 && dy === 1)
  }

  isValidPosition(pos: Position): boolean {
    return pos.x >= 0 && pos.x < GRID_SIZE && pos.y >= 0 && pos.y < GRID_SIZE
  }

  movePlayer(
    playerPos: Position,
    targetPos: Position,
    grid: Cell[][],
    enemies: Enemy[]
  ): {
    newPlayerPos: Position
    newGrid: Cell[][]
    newEnemies: Enemy[]
    hpChange: number
    goldChange: number
    message: string
    reachedExit: boolean
  } {
    let hpChange = 0
    let goldChange = 0
    let message = ''
    let reachedExit = false

    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))
    const newEnemies = enemies.map((e) => ({ ...e, position: { ...e.position } }))

    if (!this.isAdjacent(playerPos, targetPos)) {
      return {
        newPlayerPos: playerPos,
        newGrid,
        newEnemies,
        hpChange,
        goldChange,
        message: '只能移动到相邻格子',
        reachedExit,
      }
    }

    const targetCell = newGrid[targetPos.y][targetPos.x]

    if (targetCell.type === 'enemy') {
      return {
        newPlayerPos: playerPos,
        newGrid,
        newEnemies,
        hpChange,
        goldChange,
        message: '需要先击败敌人',
        reachedExit,
      }
    }

    const newPlayerPos = { ...targetPos }

    if (targetCell.type === 'trap') {
      hpChange = -5
      message = '踩到陷阱！生命值 -5'
      newGrid[targetPos.y][targetPos.x] = { type: 'empty' }
    } else if (targetCell.type === 'chest') {
      const content = targetCell.chestContent!
      if (content.type === 'gold') {
        goldChange = content.value
        message = `获得金币 ${content.value}`
      } else {
        hpChange = content.value
        message = `获得恢复药剂，生命值 +${content.value}`
      }
      newGrid[targetPos.y][targetPos.x] = { type: 'empty' }
    } else if (targetCell.type === 'exit') {
      reachedExit = true
      message = '到达出口！'
    }

    return {
      newPlayerPos,
      newGrid,
      newEnemies,
      hpChange,
      goldChange,
      message,
      reachedExit,
    }
  }

  moveEnemies(
    enemies: Enemy[],
    playerPos: Position,
    grid: Cell[][]
  ): { newEnemies: Enemy[]; newGrid: Cell[][] } {
    const newGrid = grid.map((row) => row.map((cell) => ({ ...cell })))
    const newEnemies = enemies.map((e) => ({ ...e, position: { ...e.position } }))

    const occupiedPositions = new Set<string>()
    occupiedPositions.add(`${playerPos.x},${playerPos.y}`)
    newEnemies.forEach((e) => occupiedPositions.add(`${e.position.x},${e.position.y}`))

    for (let i = 0; i < newEnemies.length; i++) {
      const enemy = newEnemies[i]
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ]

      const shuffled = [...directions].sort(() => Math.random() - 0.5)

      for (const dir of shuffled) {
        const newPos = {
          x: enemy.position.x + dir.dx,
          y: enemy.position.y + dir.dy,
        }

        if (
          this.isValidPosition(newPos) &&
          !occupiedPositions.has(`${newPos.x},${newPos.y}`)
        ) {
          const targetCell = newGrid[newPos.y][newPos.x]
          if (
            targetCell.type === 'empty' ||
            targetCell.type === 'trap' ||
            targetCell.type === 'chest'
          ) {
            newGrid[enemy.position.y][enemy.position.x] = { type: 'empty' }

            const enemyCell = newGrid[newPos.y][newPos.x]
            newGrid[newPos.y][newPos.x] = {
              type: 'enemy',
              enemyHP: enemy.hp,
              enemyMaxHP: enemy.maxHp,
            }

            if (
              enemyCell.type === 'trap' ||
              enemyCell.type === 'chest'
            ) {
              for (let j = 0; j < newEnemies.length; j++) {
                if (i !== j && newEnemies[j].position.x === newPos.x && newEnemies[j].position.y === newPos.y) {
                }
              }
            }

            occupiedPositions.delete(`${enemy.position.x},${enemy.position.y}`)
            enemy.position = newPos
            occupiedPositions.add(`${newPos.x},${newPos.y}`)
            break
          }
        }
      }
    }

    return { newEnemies, newGrid }
  }
}

export class CombatSystem {
  calculatePlayerDamage(): number {
    return 8 + Math.floor(Math.random() * 5)
  }

  calculateEnemyDamage(): number {
    return 5 + Math.floor(Math.random() * 4)
  }

  resolveAttack(
    combatState: CombatState,
    isPlayerAttacking: boolean
  ): {
    newCombatState: CombatState
    damage: number
    combatEnded: boolean
    playerWon: boolean
  } {
    const newState = {
      ...combatState,
      log: [...combatState.log],
    }

    let damage = 0
    let combatEnded = false
    let playerWon = false

    if (isPlayerAttacking) {
      damage = this.calculatePlayerDamage()
      newState.enemyHP = Math.max(0, newState.enemyHP - damage)
      newState.log.push(`你对敌人造成 ${damage} 点伤害！`)

      if (newState.enemyHP <= 0) {
        combatEnded = true
        playerWon = true
        newState.log.push('敌人被击败！')
      }
    } else {
      damage = this.calculateEnemyDamage()
      if (newState.playerDefending) {
        damage = Math.floor(damage * 0.5)
        newState.log.push(`你防御了攻击，受到 ${damage} 点伤害！`)
      } else {
        newState.log.push(`敌人对你造成 ${damage} 点伤害！`)
      }
      newState.playerHP = Math.max(0, newState.playerHP - damage)
      newState.playerDefending = false

      if (newState.playerHP <= 0) {
        combatEnded = true
        playerWon = false
        newState.log.push('你被击败了...')
      }
    }

    return { newCombatState: newState, damage, combatEnded, playerWon }
  }

  playerDefend(combatState: CombatState): CombatState {
    return {
      ...combatState,
      playerDefending: true,
      log: [...combatState.log, '你进入防御姿态！'],
    }
  }
}

const dungeonGenerator = new DungeonGenerator()
const turnManager = new TurnManager()
const combatSystem = new CombatSystem()

export const createNewDungeon = (): DungeonData => {
  return dungeonGenerator.generate()
}

export const movePlayer = (
  playerPos: Position,
  targetPos: Position,
  grid: Cell[][],
  enemies: Enemy[]
) => {
  return turnManager.movePlayer(playerPos, targetPos, grid, enemies)
}

export const moveEnemies = (enemies: Enemy[], playerPos: Position, grid: Cell[][]) => {
  return turnManager.moveEnemies(enemies, playerPos, grid)
}

export const resolveCombat = (
  combatState: CombatState,
  isPlayerAttacking: boolean
) => {
  return combatSystem.resolveAttack(combatState, isPlayerAttacking)
}

export const playerDefend = (combatState: CombatState) => {
  return combatSystem.playerDefend(combatState)
}

export const isAdjacent = (pos1: Position, pos2: Position) => {
  return turnManager.isAdjacent(pos1, pos2)
}

export const calculatePlayerDamage = () => combatSystem.calculatePlayerDamage()
export const calculateEnemyDamage = () => combatSystem.calculateEnemyDamage()
