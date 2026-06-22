import type {
  Robot,
  Obstacle,
  CommandType,
  BattleEvent,
  TurnSnapshot,
  Direction,
  RobotType
} from './types'
import {
  COMMAND_SLOTS,
  GRID_SIZE,
  MAX_ROBOTS,
  OBSTACLE_COUNT,
  ROBOT_TYPES,
  SUPPLY_HEAL_VALUE,
  METAL_CRATE_HP,
  AI_ROBOT_NAMES,
  TRAIL_LIFETIME_TURNS
} from '@/config/gameConfig'
import {
  cellsInFront,
  getBackwardCell,
  getFacingCell,
  isInBounds,
  turnDirection
} from '@/utils/gridMath'
import { findEnemiesInScan, generateAICommands } from './AIStrategy'

export class GameEngine {
  robots: Robot[] = []
  obstacles: Obstacle[] = []
  turn: number = 0
  snapshots: TurnSnapshot[] = []
  private events: BattleEvent[] = []
  private idCounter = 1000
  private turnStartRobotsSnapshot: Robot[] = []

  private nextId(prefix: string): string {
    this.idCounter++
    return `${prefix}-${this.idCounter}`
  }

  reset() {
    this.robots = []
    this.obstacles = []
    this.turn = 0
    this.snapshots = []
    this.events = []
    this.idCounter = 1000
  }

  initBattle(playerType: RobotType) {
    this.reset()
    this.placeObstacles()
    this.placeRobots(playerType)
    this.snapshotState(-1, -1)
    this.turn = 1
  }

  private placeObstacles() {
    const occupied = new Set<string>()
    const corners = [
      [0, 0],
      [0, 1],
      [1, 0],
      [GRID_SIZE - 1, GRID_SIZE - 1],
      [GRID_SIZE - 1, GRID_SIZE - 2],
      [GRID_SIZE - 2, GRID_SIZE - 1],
      [0, GRID_SIZE - 1],
      [0, GRID_SIZE - 2],
      [1, GRID_SIZE - 1],
      [GRID_SIZE - 1, 0],
      [GRID_SIZE - 1, 1],
      [GRID_SIZE - 2, 0]
    ]
    corners.forEach(([x, y]) => occupied.add(`${x},${y}`))

    for (let i = 0; i < OBSTACLE_COUNT.metalCrate; i++) {
      const pos = this.findEmptyCell(occupied)
      if (pos) {
        occupied.add(`${pos[0]},${pos[1]}`)
        this.obstacles.push({
          id: this.nextId('crate'),
          type: 'metalCrate',
          x: pos[0],
          y: pos[1],
          hp: METAL_CRATE_HP
        })
      }
    }
    for (let i = 0; i < OBSTACLE_COUNT.energySupply; i++) {
      const pos = this.findEmptyCell(occupied)
      if (pos) {
        occupied.add(`${pos[0]},${pos[1]}`)
        this.obstacles.push({
          id: this.nextId('supply'),
          type: 'energySupply',
          x: pos[0],
          y: pos[1],
          value: SUPPLY_HEAL_VALUE
        })
      }
    }
  }

  private findEmptyCell(occupied: Set<string>): [number, number] | null {
    const free: Array<[number, number]> = []
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (!occupied.has(`${x},${y}`)) free.push([x, y])
      }
    }
    if (free.length === 0) return null
    return free[Math.floor(Math.random() * free.length)]
  }

  private placeRobots(playerType: RobotType) {
    const spots: Array<[number, number, Direction]> = [
      [0, 0, 1],
      [GRID_SIZE - 1, 0, 3],
      [0, GRID_SIZE - 1, 1],
      [GRID_SIZE - 1, GRID_SIZE - 1, 3]
    ]
    for (let i = spots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[spots[i], spots[j]] = [spots[j], spots[i]]
    }

    const playerMeta = ROBOT_TYPES[playerType]
    this.robots.push({
      id: this.nextId('player'),
      name: `PLAYER-${playerMeta.name}`,
      type: playerType,
      x: spots[0][0],
      y: spots[0][1],
      direction: spots[0][2],
      hp: playerMeta.stats.maxHp,
      stats: { ...playerMeta.stats },
      isPlayer: true,
      commands: Array(COMMAND_SLOTS).fill('forward') as CommandType[],
      isDefending: false,
      isHit: false,
      scannedEnemies: [],
      color: playerMeta.color,
      trail: [],
      totalDamage: 0,
      survivedTurns: 0
    })

    const aiTypes: RobotType[] = ['scout', 'attacker', 'tank']
    for (let i = 0; i < MAX_ROBOTS - 1; i++) {
      const meta = ROBOT_TYPES[aiTypes[i % aiTypes.length]]
      const namePack = AI_ROBOT_NAMES[i % AI_ROBOT_NAMES.length]
      this.robots.push({
        id: this.nextId('ai'),
        name: namePack.name,
        type: meta.type,
        x: spots[i + 1][0],
        y: spots[i + 1][1],
        direction: spots[i + 1][2],
        hp: meta.stats.maxHp,
        stats: { ...meta.stats },
        isPlayer: false,
        commands: Array(COMMAND_SLOTS).fill('forward') as CommandType[],
        isDefending: false,
        isHit: false,
        scannedEnemies: [],
        color: namePack.color,
        trail: [],
        totalDamage: 0,
        survivedTurns: 0
      })
    }
  }

  setPlayerCommands(commands: CommandType[]) {
    const player = this.robots.find((r) => r.isPlayer)
    if (player) player.commands = commands.slice(0, COMMAND_SLOTS)
  }

  startTurn() {
    this.events = []
    this.turnStartRobotsSnapshot = this.robots.map((r) => this.cloneRobot(r))
    for (const robot of this.robots) {
      if (robot.hp <= 0) continue
      robot.isDefending = false
      robot.isHit = false
      robot.scannedEnemies = []
      if (!robot.isPlayer) {
        robot.commands = generateAICommands(robot, this.robots, this.obstacles)
      }
    }
  }

  async *executeAllCommands(): AsyncGenerator<TurnSnapshot, TurnSnapshot | null, unknown> {
    for (let idx = 0; idx < COMMAND_SLOTS; idx++) {
      const sorted = [...this.robots]
        .filter((r) => r.hp > 0)
        .sort((a, b) => b.stats.speed - a.stats.speed || a.id.localeCompare(b.id))
      for (const robot of sorted) {
        if (robot.hp <= 0) continue
        const cmd = robot.commands[idx]
        if (cmd) this.executeCommand(robot.id, cmd, idx)
      }
      this.cleanupExpiredTrails()
      const snap = this.snapshotState(this.turn, idx)
      yield snap
    }

    for (const r of this.robots) if (r.hp > 0) r.survivedTurns++
    this.turn++

    const alive = this.robots.filter((r) => r.hp > 0)
    if (alive.length <= 1) {
      return this.snapshotState(this.turn, COMMAND_SLOTS - 1)
    }
    return null
  }

  private cleanupExpiredTrails() {
    for (const r of this.robots) {
      r.trail = r.trail.filter((t) => this.turn - t.turn <= TRAIL_LIFETIME_TURNS)
    }
  }

  isBattleOver(): boolean {
    return this.robots.filter((r) => r.hp > 0).length <= 1
  }

  getWinner(): Robot | null {
    const alive = this.robots.filter((r) => r.hp > 0)
    return alive.length === 1 ? alive[0] : null
  }

  private snapshotState(turn: number, executingIndex: number): TurnSnapshot {
    const snap: TurnSnapshot = {
      turn,
      executingIndex,
      robots: this.robots.map((r) => this.cloneRobot(r)),
      obstacles: this.obstacles.map((o) => ({ ...o })),
      events: [...this.events]
    }
    this.snapshots.push(snap)
    return snap
  }

  private cloneRobot(r: Robot): Robot {
    return {
      ...r,
      stats: { ...r.stats },
      commands: [...r.commands],
      scannedEnemies: [...r.scannedEnemies],
      trail: r.trail.map((t) => ({ ...t }))
    }
  }

  private executeCommand(robotId: string, cmd: CommandType, slotIndex: number) {
    const robot = this.robots.find((r) => r.id === robotId)
    if (!robot || robot.hp <= 0) return
    switch (cmd) {
      case 'forward':
        this.moveRobot(robot, 1)
        break
      case 'backward':
        this.moveRobot(robot, -1)
        break
      case 'turnLeft':
        this.turnRobot(robot, -1)
        break
      case 'turnRight':
        this.turnRobot(robot, 1)
        break
      case 'attack':
        this.attack(robot)
        break
      case 'defend':
        this.defend(robot)
        break
      case 'scan':
        this.scan(robot)
        break
    }
    void slotIndex
  }

  private moveRobot(robot: Robot, dir: 1 | -1) {
    const [nx, ny] =
      dir === 1
        ? getFacingCell(robot.x, robot.y, robot.direction)
        : getBackwardCell(robot.x, robot.y, robot.direction)
    if (!this.canMoveTo(nx, ny, robot.id)) return
    const from: [number, number] = [robot.x, robot.y]
    robot.trail.push({ x: robot.x, y: robot.y, turn: this.turn })
    robot.x = nx
    robot.y = ny
    this.events.push({ type: 'move', robotId: robot.id, from, to: [nx, ny], turn: this.turn })
    this.checkPickup(robot)
  }

  private canMoveTo(x: number, y: number, selfId: string): boolean {
    if (!isInBounds(x, y)) return false
    if (this.obstacles.some((o) => o.x === x && o.y === y && o.type === 'metalCrate')) return false
    if (this.robots.some((r) => r.hp > 0 && r.id !== selfId && r.x === x && r.y === y))
      return false
    return true
  }

  private checkPickup(robot: Robot) {
    const supply = this.obstacles.find(
      (o) => o.type === 'energySupply' && o.x === robot.x && o.y === robot.y
    )
    if (supply && supply.value) {
      const heal = Math.min(robot.stats.maxHp - robot.hp, supply.value)
      robot.hp = Math.min(robot.stats.maxHp, robot.hp + supply.value)
      this.events.push({
        type: 'pickup',
        robotId: robot.id,
        supplyId: supply.id,
        value: heal,
        turn: this.turn
      })
      this.obstacles = this.obstacles.filter((o) => o.id !== supply.id)
    }
  }

  private turnRobot(robot: Robot, delta: -1 | 1) {
    const from = robot.direction
    robot.direction = turnDirection(robot.direction, delta)
    this.events.push({ type: 'turn', robotId: robot.id, from, to: robot.direction, turn: this.turn })
  }

  private attack(robot: Robot) {
    const cells = cellsInFront(robot.x, robot.y, robot.direction, robot.stats.range)
    const bulletPath: [number, number][] = [[robot.x, robot.y]]
    for (const [x, y] of cells) {
      bulletPath.push([x, y])
      const crate = this.obstacles.find(
        (o) => o.type === 'metalCrate' && o.x === x && o.y === y
      )
      if (crate && crate.hp !== undefined) {
        crate.hp -= robot.stats.attack
        if (crate.hp <= 0) {
          this.obstacles = this.obstacles.filter((o) => o.id !== crate.id)
          this.events.push({ type: 'obstacleDestroyed', obstacleId: crate.id, turn: this.turn })
        }
        robot.totalDamage += robot.stats.attack
        this.events.push({
          type: 'attack',
          attackerId: robot.id,
          targetId: crate.id,
          damage: robot.stats.attack,
          bulletPath,
          turn: this.turn
        })
        return
      }
      const target = this.robots.find(
        (r) => r.hp > 0 && r.id !== robot.id && r.x === x && r.y === y
      )
      if (target) {
        const isDef = target.isDefending
        const dmg = isDef ? Math.ceil(robot.stats.attack / 2) : robot.stats.attack
        target.hp = Math.max(0, target.hp - dmg)
        target.isHit = true
        robot.totalDamage += dmg
        this.events.push({
          type: 'attack',
          attackerId: robot.id,
          targetId: target.id,
          damage: dmg,
          bulletPath,
          turn: this.turn
        })
        this.events.push({
          type: 'hit',
          robotId: target.id,
          damage: dmg,
          isDefending: isDef,
          turn: this.turn
        })
        if (target.hp <= 0) {
          this.events.push({ type: 'destroy', robotId: target.id, turn: this.turn })
        }
        return
      }
    }
  }

  private defend(robot: Robot) {
    robot.isDefending = true
    this.events.push({ type: 'defend', robotId: robot.id, turn: this.turn })
  }

  private scan(robot: Robot) {
    const found = findEnemiesInScan(robot, this.robots)
    robot.scannedEnemies = found
    this.events.push({ type: 'scan', robotId: robot.id, foundIds: found, turn: this.turn })
  }

  getSnapshot(turn: number, slotIdx: number): TurnSnapshot | undefined {
    return this.snapshots.find((s) => s.turn === turn && s.executingIndex === slotIdx)
  }

  getAllSnapshots(): TurnSnapshot[] {
    return this.snapshots
  }
}
