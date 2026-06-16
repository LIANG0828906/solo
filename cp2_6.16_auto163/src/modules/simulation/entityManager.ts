import { v4 as uuidv4 } from 'uuid'
import { Vehicle, Pedestrian, Point, GRID_SIZE, BLOCK_SIZE, ROAD_WIDTH, CANVAS_PADDING, getTotalMapSize } from '../../types'
import { findVehiclePath, findPedestrianPath } from './pathFinding'

const MAX_VEHICLES = 200
const MAX_PEDESTRIANS = 200
const VEHICLE_SPAWN_INTERVAL = 0.15
const PEDESTRIAN_SPAWN_INTERVAL = 0.4

export class EntityManager {
  private vehiclePool: Vehicle[] = []
  private pedestrianPool: Pedestrian[] = []
  private activeVehicles: Vehicle[] = []
  private activePedestrians: Pedestrian[] = []
  private vehicleSpawnTimer = 0
  private pedestrianSpawnTimer = 0

  constructor() {
    for (let i = 0; i < MAX_VEHICLES; i++) {
      this.vehiclePool.push(this.createEmptyVehicle())
    }
    for (let i = 0; i < MAX_PEDESTRIANS; i++) {
      this.pedestrianPool.push(this.createEmptyPedestrian())
    }
  }

  private createEmptyVehicle(): Vehicle {
    return {
      id: '',
      x: 0,
      y: 0,
      angle: 0,
      speed: 0,
      maxSpeed: 60,
      color: 'red',
      width: 10,
      height: 20,
      path: [],
      pathIndex: 0,
      waitingTime: 0,
      isWaiting: false,
      trail: [],
      active: false,
      targetCrossroadId: null,
    }
  }

  private createEmptyPedestrian(): Pedestrian {
    return {
      id: '',
      x: 0,
      y: 0,
      speed: 25,
      radius: 3,
      path: [],
      pathIndex: 0,
      crossingTime: 0,
      isCrossing: false,
      trail: [],
      active: false,
    }
  }

  private getRandomEdgePoint(): Point {
    const mapSize = getTotalMapSize() + CANVAS_PADDING * 2
    const side = Math.floor(Math.random() * 4)
    switch (side) {
      case 0:
        return { x: CANVAS_PADDING + Math.random() * (mapSize - CANVAS_PADDING * 2), y: CANVAS_PADDING + ROAD_WIDTH / 2 }
      case 1:
        return { x: mapSize - CANVAS_PADDING - ROAD_WIDTH / 2, y: CANVAS_PADDING + Math.random() * (mapSize - CANVAS_PADDING * 2) }
      case 2:
        return { x: CANVAS_PADDING + Math.random() * (mapSize - CANVAS_PADDING * 2), y: mapSize - CANVAS_PADDING - ROAD_WIDTH / 2 }
      default:
        return { x: CANVAS_PADDING + ROAD_WIDTH / 2, y: CANVAS_PADDING + Math.random() * (mapSize - CANVAS_PADDING * 2) }
    }
  }

  private getRandomInnerPoint(): Point {
    const mapSize = getTotalMapSize() + CANVAS_PADDING * 2
    return {
      x: CANVAS_PADDING + 40 + Math.random() * (mapSize - CANVAS_PADDING * 2 - 80),
      y: CANVAS_PADDING + 40 + Math.random() * (mapSize - CANVAS_PADDING * 2 - 80),
    }
  }

  private spawnVehicle() {
    if (this.activeVehicles.length >= MAX_VEHICLES) {
      this.activeVehicles.sort((a, b) => {
        const distA = Math.sqrt(a.x * a.x + a.y * a.y)
        const distB = Math.sqrt(b.x * b.x + b.y * b.y)
        return distB - distA
      })
      const recycled = this.activeVehicles.pop()!
      recycled.active = false
      this.vehiclePool.push(recycled)
    }

    const vehicle = this.vehiclePool.pop()
    if (!vehicle) return

    const start = this.getRandomEdgePoint()
    const end = this.getRandomEdgePoint()
    const path = findVehiclePath(start, end)

    vehicle.id = uuidv4()
    vehicle.x = start.x
    vehicle.y = start.y
    vehicle.speed = 0
    vehicle.maxSpeed = 50 + Math.random() * 30
    const colors: Array<'red' | 'yellow' | 'blue'> = ['red', 'yellow', 'blue']
    vehicle.color = colors[Math.floor(Math.random() * colors.length)]
    vehicle.path = path
    vehicle.pathIndex = 0
    vehicle.waitingTime = 0
    vehicle.isWaiting = false
    vehicle.trail = []
    vehicle.active = true
    vehicle.targetCrossroadId = null

    if (path.length > 1) {
      const dx = path[1].x - path[0].x
      const dy = path[1].y - path[0].y
      vehicle.angle = Math.atan2(dy, dx) - Math.PI / 2
    }

    this.activeVehicles.push(vehicle)
  }

  private spawnPedestrian() {
    if (this.activePedestrians.length >= MAX_PEDESTRIANS) {
      this.activePedestrians.sort((a, b) => {
        const distA = Math.sqrt(a.x * a.x + a.y * a.y)
        const distB = Math.sqrt(b.x * b.x + b.y * b.y)
        return distB - distA
      })
      const recycled = this.activePedestrians.pop()!
      recycled.active = false
      this.pedestrianPool.push(recycled)
    }

    const pedestrian = this.pedestrianPool.pop()
    if (!pedestrian) return

    const start = this.getRandomInnerPoint()
    const end = this.getRandomInnerPoint()
    const path = findPedestrianPath(start, end)

    pedestrian.id = uuidv4()
    pedestrian.x = start.x
    pedestrian.y = start.y
    pedestrian.speed = 20 + Math.random() * 15
    pedestrian.path = path
    pedestrian.pathIndex = 0
    pedestrian.crossingTime = 0
    pedestrian.isCrossing = false
    pedestrian.trail = []
    pedestrian.active = true

    this.activePedestrians.push(pedestrian)
  }

  public update(deltaTime: number) {
    this.vehicleSpawnTimer += deltaTime
    this.pedestrianSpawnTimer += deltaTime

    if (this.vehicleSpawnTimer >= VEHICLE_SPAWN_INTERVAL) {
      this.vehicleSpawnTimer = 0
      this.spawnVehicle()
    }

    if (this.pedestrianSpawnTimer >= PEDESTRIAN_SPAWN_INTERVAL) {
      this.pedestrianSpawnTimer = 0
      this.spawnPedestrian()
    }
  }

  public getVehicles(): Vehicle[] {
    return this.activeVehicles
  }

  public getPedestrians(): Pedestrian[] {
    return this.activePedestrians
  }

  public recycleVehicle(vehicle: Vehicle) {
    const idx = this.activeVehicles.indexOf(vehicle)
    if (idx !== -1) {
      this.activeVehicles.splice(idx, 1)
      vehicle.active = false
      this.vehiclePool.push(vehicle)
    }
  }

  public recyclePedestrian(pedestrian: Pedestrian) {
    const idx = this.activePedestrians.indexOf(pedestrian)
    if (idx !== -1) {
      this.activePedestrians.splice(idx, 1)
      pedestrian.active = false
      this.pedestrianPool.push(pedestrian)
    }
  }
}
