import { Vehicle, Pedestrian, CrossroadSignal, Point, GRID_SIZE, BLOCK_SIZE, ROAD_WIDTH, CANVAS_PADDING, getCrossroadCenter, getTotalMapSize } from '../../types'
import { EntityManager } from './entityManager'
import { findVehiclePath, findPedestrianPath } from './pathFinding'

const STOP_DISTANCE = 25
const VEHICLE_GAP = 25
const ACCELERATION = 40
const DECELERATION = 120

export interface GameEngineState {
  vehicles: Vehicle[]
  pedestrians: Pedestrian[]
  crossroads: Map<string, CrossroadSignal>
}

export class GameEngine {
  private entityManager: EntityManager
  private crossroads: Map<string, CrossroadSignal> = new Map()
  private lastTime = 0
  private running = false
  private animationFrameId: number | null = null
  private onUpdate: ((state: GameEngineState) => void) | null = null
  private onStatsUpdate: ((stats: { avgWait: number; avgCross: number; score: number; fps: number }) => void) | null = null
  private fpsFrames = 0
  private fpsTime = 0
  private currentFps = 60
  private statsUpdateTimer = 0
  private maxWaitRecorded = 0

  constructor() {
    this.entityManager = new EntityManager()
  }

  public setCrossroads(crossroads: Map<string, CrossroadSignal>) {
    this.crossroads = crossroads
  }

  public setOnUpdate(callback: (state: GameEngineState) => void) {
    this.onUpdate = callback
  }

  public setOnStatsUpdate(callback: (stats: { avgWait: number; avgCross: number; score: number; fps: number }) => void) {
    this.onStatsUpdate = callback
  }

  public start() {
    if (this.running) return
    this.running = true
    this.lastTime = performance.now()
    this.loop()
  }

  public stop() {
    this.running = false
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  private loop = () => {
    if (!this.running) return

    const now = performance.now()
    let deltaTime = (now - this.lastTime) / 1000
    this.lastTime = now

    deltaTime = Math.min(deltaTime, 0.1)

    this.fpsFrames++
    this.fpsTime += deltaTime
    if (this.fpsTime >= 0.5) {
      this.currentFps = Math.round(this.fpsFrames / this.fpsTime)
      this.fpsFrames = 0
      this.fpsTime = 0
    }

    this.update(deltaTime)

    this.statsUpdateTimer += deltaTime
    if (this.statsUpdateTimer >= 0.5) {
      this.statsUpdateTimer = 0
      this.updateStats()
    }

    if (this.onUpdate) {
      this.onUpdate({
        vehicles: this.entityManager.getVehicles(),
        pedestrians: this.entityManager.getPedestrians(),
        crossroads: this.crossroads,
      })
    }

    this.animationFrameId = requestAnimationFrame(this.loop)
  }

  private updateStats() {
    const vehicles = this.entityManager.getVehicles()
    const pedestrians = this.entityManager.getPedestrians()

    let totalWait = 0
    let waitingCount = 0
    let maxWait = 0
    for (const v of vehicles) {
      if (v.waitingTime > 0) {
        totalWait += v.waitingTime
        waitingCount++
        if (v.waitingTime > maxWait) maxWait = v.waitingTime
      }
    }
    const avgWait = waitingCount > 0 ? totalWait / waitingCount : 0
    this.maxWaitRecorded = Math.max(this.maxWaitRecorded, maxWait)

    let totalCross = 0
    let crossingCount = 0
    for (const p of pedestrians) {
      if (p.crossingTime > 0) {
        totalCross += p.crossingTime
        crossingCount++
      }
    }
    const avgCross = crossingCount > 0 ? totalCross / crossingCount : 0

    const maxExpectedWait = 60
    const waitScore = Math.max(0, 100 - (avgWait / maxExpectedWait) * 100)
    const fpsScore = Math.min(100, (this.currentFps / 60) * 100)
    const flowScore = Math.min(100, (vehicles.filter(v => !v.isWaiting).length / Math.max(1, vehicles.length)) * 100)
    const score = Math.round(waitScore * 0.5 + fpsScore * 0.2 + flowScore * 0.3)

    if (this.onStatsUpdate) {
      this.onStatsUpdate({
        avgWait: Math.round(avgWait * 10) / 10,
        avgCross: Math.round(avgCross * 10) / 10,
        score,
        fps: this.currentFps,
      })
    }
  }

  private update(deltaTime: number) {
    this.entityManager.update(deltaTime)
    this.updateVehicles(deltaTime)
    this.updatePedestrians(deltaTime)
  }

  private getCrossroadAtPosition(x: number, y: number): CrossroadSignal | null {
    for (const crossroad of this.crossroads.values()) {
      const center = getCrossroadCenter(crossroad.gridX, crossroad.gridY)
      const dx = x - center.x
      const dy = y - center.y
      if (Math.abs(dx) < ROAD_WIDTH && Math.abs(dy) < ROAD_WIDTH) {
        return crossroad
      }
    }
    return null
  }

  private shouldStopAtCrossroad(vehicle: Vehicle, nextPoint: Point): boolean {
    for (const crossroad of this.crossroads.values()) {
      const center = getCrossroadCenter(crossroad.gridX, crossroad.gridY)
      const dx = nextPoint.x - center.x
      const dy = nextPoint.y - center.y
      const distToCenter = Math.sqrt(dx * dx + dy * dy)

      if (distToCenter < STOP_DISTANCE + ROAD_WIDTH) {
        const vdx = vehicle.x - center.x
        const vdy = vehicle.y - center.y
        const vehicleDist = Math.sqrt(vdx * vdx + vdy * vdy)

        if (vehicleDist > ROAD_WIDTH * 0.5 && vehicleDist < STOP_DISTANCE + ROAD_WIDTH) {
          if (crossroad.currentColor === 'red' || crossroad.currentColor === 'yellow') {
            return true
          }
        }
      }
    }
    return false
  }

  private checkVehicleCollision(vehicle: Vehicle, vehicles: Vehicle[]): boolean {
    for (const other of vehicles) {
      if (other.id === vehicle.id || !other.active) continue
      const dx = other.x - vehicle.x
      const dy = other.y - vehicle.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < VEHICLE_GAP) {
        const dotProduct = dx * Math.sin(vehicle.angle) + dy * -Math.cos(vehicle.angle)
        if (dotProduct > 0) {
          return true
        }
      }
    }
    return false
  }

  private updateVehicles(deltaTime: number) {
    const vehicles = this.entityManager.getVehicles()
    const mapSize = getTotalMapSize() + CANVAS_PADDING * 2

    for (const vehicle of vehicles) {
      if (!vehicle.active) continue

      vehicle.trail.unshift({
        x: vehicle.x,
        y: vehicle.y,
        alpha: 1,
        color: vehicle.color,
      })
      if (vehicle.trail.length > 10) {
        vehicle.trail.pop()
      }
      for (let i = 0; i < vehicle.trail.length; i++) {
        vehicle.trail[i].alpha = 1 - i / vehicle.trail.length
      }

      if (vehicle.pathIndex >= vehicle.path.length - 1) {
        this.entityManager.recycleVehicle(vehicle)
        continue
      }

      if (vehicle.x < 0 || vehicle.x > mapSize || vehicle.y < 0 || vehicle.y > mapSize) {
        this.entityManager.recycleVehicle(vehicle)
        continue
      }

      const nextPoint = vehicle.path[vehicle.pathIndex + 1]
      const dx = nextPoint.x - vehicle.x
      const dy = nextPoint.y - vehicle.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      const shouldStopSignal = this.shouldStopAtCrossroad(vehicle, nextPoint)
      const hasCollisionAhead = this.checkVehicleCollision(vehicle, vehicles)
      const shouldStop = shouldStopSignal || hasCollisionAhead

      if (shouldStop) {
        vehicle.speed = Math.max(0, vehicle.speed - DECELERATION * deltaTime)
        vehicle.isWaiting = true
        vehicle.waitingTime += deltaTime
      } else {
        vehicle.speed = Math.min(vehicle.maxSpeed, vehicle.speed + ACCELERATION * deltaTime)
        vehicle.isWaiting = false
      }

      if (dist < 5) {
        vehicle.pathIndex++
        if (vehicle.pathIndex < vehicle.path.length - 1) {
          const nextNext = vehicle.path[vehicle.pathIndex + 1]
          const ndx = nextNext.x - vehicle.x
          const ndy = nextNext.y - vehicle.y
          vehicle.angle = Math.atan2(ndy, ndx) - Math.PI / 2
        }
      } else {
        const moveX = (dx / dist) * vehicle.speed * deltaTime
        const moveY = (dy / dist) * vehicle.speed * deltaTime
        vehicle.x += moveX
        vehicle.y += moveY
      }
    }
  }

  private updatePedestrians(deltaTime: number) {
    const pedestrians = this.entityManager.getPedestrians()
    const mapSize = getTotalMapSize() + CANVAS_PADDING * 2

    for (const pedestrian of pedestrians) {
      if (!pedestrian.active) continue

      pedestrian.trail.unshift({
        x: pedestrian.x,
        y: pedestrian.y,
        alpha: 1,
      })
      if (pedestrian.trail.length > 10) {
        pedestrian.trail.pop()
      }
      for (let i = 0; i < pedestrian.trail.length; i++) {
        pedestrian.trail[i].alpha = 1 - i / pedestrian.trail.length
      }

      if (pedestrian.pathIndex >= pedestrian.path.length - 1) {
        this.entityManager.recyclePedestrian(pedestrian)
        continue
      }

      if (pedestrian.x < 0 || pedestrian.x > mapSize || pedestrian.y < 0 || pedestrian.y > mapSize) {
        this.entityManager.recyclePedestrian(pedestrian)
        continue
      }

      const nextPoint = pedestrian.path[pedestrian.pathIndex + 1]
      const dx = nextPoint.x - pedestrian.x
      const dy = nextPoint.y - pedestrian.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      const atCrossroad = this.getCrossroadAtPosition(pedestrian.x, pedestrian.y)
      let shouldWait = false
      if (atCrossroad && atCrossroad.currentColor === 'green') {
        shouldWait = Math.random() < 0.02
      }

      if (shouldWait) {
        pedestrian.isCrossing = false
      } else {
        pedestrian.isCrossing = true
        pedestrian.crossingTime += deltaTime

        if (dist < 3) {
          pedestrian.pathIndex++
        } else {
          const moveX = (dx / dist) * pedestrian.speed * deltaTime
          const moveY = (dy / dist) * pedestrian.speed * deltaTime
          pedestrian.x += moveX
          pedestrian.y += moveY
        }
      }
    }
  }
}
