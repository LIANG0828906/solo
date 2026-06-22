import type { Robot, Obstacle, CommandType, Direction } from './types'
import {
  cellsInFront,
  cellsInViewRange,
  chebyshevDistance,
  getFacingCell,
  isInBounds,
  turnDirection
} from '@/utils/gridMath'
import { COMMAND_SLOTS } from '@/config/gameConfig'

interface AIContext {
  self: Robot
  robots: Robot[]
  obstacles: Obstacle[]
}

function isCellBlocked(ctx: AIContext, x: number, y: number): boolean {
  if (!isInBounds(x, y)) return true
  if (ctx.obstacles.some((o) => o.x === x && o.y === y && o.type === 'metalCrate')) return true
  if (ctx.robots.some((r) => r.id !== ctx.self.id && r.hp > 0 && r.x === x && r.y === y))
    return true
  return false
}

function findNearestEnemy(ctx: AIContext): Robot | null {
  const enemies = ctx.robots.filter((r) => r.id !== ctx.self.id && r.hp > 0)
  if (enemies.length === 0) return null
  enemies.sort(
    (a, b) =>
      chebyshevDistance(ctx.self.x, ctx.self.y, a.x, a.y) -
      chebyshevDistance(ctx.self.x, ctx.self.y, b.x, b.y)
  )
  return enemies[0]
}

function findNearestSupply(ctx: AIContext): Obstacle | null {
  const supplies = ctx.obstacles.filter((o) => o.type === 'energySupply')
  if (supplies.length === 0) return null
  supplies.sort(
    (a, b) =>
      chebyshevDistance(ctx.self.x, ctx.self.y, a.x, a.y) -
      chebyshevDistance(ctx.self.x, ctx.self.y, b.x, b.y)
  )
  return supplies[0]
}

function enemyInSight(ctx: AIContext): Robot | null {
  const front = cellsInFront(ctx.self.x, ctx.self.y, ctx.self.direction, ctx.self.stats.range)
  for (const [x, y] of front) {
    if (ctx.obstacles.some((o) => o.x === x && o.y === y && o.type === 'metalCrate')) return null
    const enemy = ctx.robots.find(
      (r) => r.id !== ctx.self.id && r.hp > 0 && r.x === x && r.y === y
    )
    if (enemy) return enemy
  }
  return null
}

function shouldFace(ctx: AIContext, targetX: number, targetY: number): Direction | null {
  const dx = targetX - ctx.self.x
  const dy = targetY - ctx.self.y
  let desired: Direction = ctx.self.direction
  if (Math.abs(dx) >= Math.abs(dy)) {
    desired = dx > 0 ? 1 : 3
  } else {
    desired = dy > 0 ? 2 : 0
  }
  if (desired === ctx.self.direction) return null
  return desired
}

function turnSteps(from: Direction, to: Direction): { cmd: CommandType; steps: number } {
  let diff = (((to - from) % 4) + 4) % 4
  if (diff === 3) return { cmd: 'turnLeft', steps: 1 }
  if (diff === 0) return { cmd: 'forward', steps: 0 }
  return { cmd: 'turnRight', steps: diff }
}

type Goal = { type: 'attack' | 'chase' | 'supply' | 'patrol' }

function decideGoal(ctx: AIContext): Goal {
  const hpPct = ctx.self.hp / ctx.self.stats.maxHp
  const nearestEnemy = findNearestEnemy(ctx)
  const dist = nearestEnemy
    ? chebyshevDistance(ctx.self.x, ctx.self.y, nearestEnemy.x, nearestEnemy.y)
    : Infinity

  if (hpPct < 0.35) {
    const supply = findNearestSupply(ctx)
    if (supply && chebyshevDistance(ctx.self.x, ctx.self.y, supply.x, supply.y) <= 4) {
      return { type: 'supply' }
    }
  }

  if (dist <= 3) return { type: 'attack' }
  if (dist <= 6) return { type: 'chase' }
  return { type: 'patrol' }
}

function buildSequence(ctx: AIContext, goal: Goal): CommandType[] {
  const seq: CommandType[] = []
  let workingDir = ctx.self.direction
  let workingX = ctx.self.x
  let workingY = ctx.self.y
  let simulated = { ...ctx }

  const simSelf = () => ({ ...simulated.self, direction: workingDir, x: workingX, y: workingY })
  const refreshCtx = () => {
    simulated = {
      ...simulated,
      self: simSelf(),
      robots: simulated.robots.map((r) => (r.id === simulated.self.id ? simSelf() : r))
    }
  }

  const target =
    goal.type === 'supply'
      ? findNearestSupply(ctx)
      : goal.type === 'attack' || goal.type === 'chase'
        ? findNearestEnemy(ctx)
        : null

  let safetyTurns = 0
  while (seq.length < COMMAND_SLOTS) {
    safetyTurns++
    if (safetyTurns > 30) break

    const aliveEnemies = simulated.robots.filter(
      (r) => r.id !== simulated.self.id && r.hp > 0
    )
    if (aliveEnemies.length === 0) {
      seq.push('scan')
      continue
    }

    refreshCtx()
    const directHit = enemyInSight(simulated)
    if (directHit) {
      seq.push('attack')
      continue
    }

    if (seq.length >= COMMAND_SLOTS - 1 && simulated.self.stats.maxHp < 100 && Math.random() < 0.3) {
      seq.push('defend')
      continue
    }

    if (target) {
      const tx = 'type' in target && target.type === 'energySupply' ? target.x : (target as Robot).x
      const ty = 'type' in target && target.type === 'energySupply' ? target.y : (target as Robot).y

      if (tx === workingX && ty === workingY) {
        seq.push('scan')
        continue
      }

      const desired = shouldFace(simulated, tx, ty)
      if (desired !== null) {
        const plan = turnSteps(workingDir, desired)
        if (plan.steps > 0) {
          seq.push(plan.cmd)
          workingDir = turnDirection(workingDir, plan.cmd === 'turnLeft' ? -1 : 1)
          continue
        }
      }

      const [fx, fy] = getFacingCell(workingX, workingY, workingDir)
      if (!isCellBlocked(simulated, fx, fy)) {
        seq.push('forward')
        workingX = fx
        workingY = fy
        continue
      }

      seq.push(Math.random() < 0.5 ? 'turnLeft' : 'turnRight')
      workingDir = turnDirection(workingDir, seq[seq.length - 1] === 'turnLeft' ? -1 : 1)
      continue
    }

    if (Math.random() < 0.15) {
      seq.push('scan')
      continue
    }

    const [fx, fy] = getFacingCell(workingX, workingY, workingDir)
    if (!isCellBlocked(simulated, fx, fy)) {
      seq.push('forward')
      workingX = fx
      workingY = fy
    } else {
      seq.push(Math.random() < 0.5 ? 'turnLeft' : 'turnRight')
      workingDir = turnDirection(workingDir, seq[seq.length - 1] === 'turnLeft' ? -1 : 1)
    }
  }

  return seq.slice(0, COMMAND_SLOTS)
}

export function generateAICommands(
  self: Robot,
  robots: Robot[],
  obstacles: Obstacle[]
): CommandType[] {
  const ctx: AIContext = { self, robots, obstacles }
  const goal = decideGoal(ctx)
  return buildSequence(ctx, goal)
}

export function findEnemiesInScan(self: Robot, robots: Robot[]): string[] {
  const cells = new Set(
    cellsInViewRange(self.x, self.y, self.stats.viewRange).map(([x, y]) => `${x},${y}`)
  )
  return robots
    .filter(
      (r) => r.id !== self.id && r.hp > 0 && cells.has(`${r.x},${r.y}`)
    )
    .map((r) => r.id)
}
