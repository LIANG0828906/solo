import { eventBus } from './eventBus'
import { TowerSystem } from './towerSystem'
import {
  Zombie,
  ZombieType,
  GameState,
  Tower,
  TOWER_CONFIGS,
  ZOMBIE_CONFIGS,
  CELL_SIZE,
  GRID_SIZE,
  INITIAL_GOLD,
  INITIAL_LIVES,
  TOTAL_WAVES,
  WAVE_PREP_TIME,
  ZOMBIE_SPAWN_INTERVAL
} from './types'

export class GameEngine {
  private state: GameState = 'preparing'
  private gold: number = INITIAL_GOLD
  private lives: number = INITIAL_LIVES
  private currentWave: number = 0
  private waveCountdown: number = WAVE_PREP_TIME
  private zombies: Zombie[] = []
  private zombiesToSpawn: number = 0
  private spawnTimer: number = 0
  private lastTime: number = 0
  private idCounter: number = 0
  private path: Array<{ x: number; y: number }> = []
  private towerSystem: TowerSystem

  constructor(towerSystem: TowerSystem) {
    this.towerSystem = towerSystem
    this.initPath()
    this.registerEvents()
  }

  private initPath(): void {
    const centerY = Math.floor(GRID_SIZE / 2)
    for (let x = -1; x <= GRID_SIZE; x++) {
      this.path.push({
        x: x * CELL_SIZE + CELL_SIZE / 2 - GRID_SIZE / 2,
        y: centerY * CELL_SIZE + CELL_SIZE / 2 - GRID_SIZE / 2
      })
    }
  }

  private registerEvents(): void {
    eventBus.on('ui:startWave', () => {
      if (this.state === 'preparing') {
        this.startWave()
      }
    })

    eventBus.on('tower:place', (data) => {
      const tower = data as Tower
      this.gold -= TOWER_CONFIGS[tower.type].cost
      eventBus.emit('ui:goldUpdate', this.gold)
    })

    eventBus.on('tower:upgrade', (data) => {
      const { cost } = data as { tower: Tower; cost: number }
      this.gold -= cost
      eventBus.emit('ui:goldUpdate', this.gold)
    })

    eventBus.on('zombie:death', (data) => {
      const zombie = data as Zombie
      this.gold += zombie.reward
      eventBus.emit('ui:goldUpdate', this.gold)
    })

    eventBus.on('zombie:reachEnd', () => {
      this.lives--
      eventBus.emit('ui:livesUpdate', this.lives)
      if (this.lives <= 0) {
        this.gameOver()
      }
    })
  }

  start(): void {
    this.state = 'preparing'
    this.gold = INITIAL_GOLD
    this.lives = INITIAL_LIVES
    this.currentWave = 0
    this.waveCountdown = WAVE_PREP_TIME
    this.zombies = []
    this.zombiesToSpawn = 0
    this.idCounter = 0

    eventBus.emit('ui:goldUpdate', this.gold)
    eventBus.emit('ui:livesUpdate', this.lives)
    eventBus.emit('ui:waveUpdate', { current: this.currentWave, total: TOTAL_WAVES })
    eventBus.emit('wave:countdown', this.waveCountdown)

    this.lastTime = performance.now()
    requestAnimationFrame(this.gameLoop.bind(this))
  }

  private gameLoop(currentTime: number): void {
    const deltaTime = Math.min((currentTime - this.lastTime) / 1000, 0.1)
    this.lastTime = currentTime

    if (this.state !== 'paused' && this.state !== 'gameover' && this.state !== 'victory') {
      this.update(deltaTime, currentTime)
    }

    requestAnimationFrame(this.gameLoop.bind(this))
  }

  private update(deltaTime: number, currentTime: number): void {
    if (this.state === 'preparing') {
      this.updatePreparing(deltaTime)
    } else if (this.state === 'playing') {
      this.updatePlaying(deltaTime, currentTime)
    }

    this.towerSystem.update(deltaTime, currentTime, this.zombies)
    this.cleanupDeadZombies()
  }

  private updatePreparing(deltaTime: number): void {
    this.waveCountdown -= deltaTime
    eventBus.emit('wave:countdown', Math.ceil(this.waveCountdown))

    if (this.waveCountdown <= 0) {
      this.startWave()
    }
  }

  private updatePlaying(deltaTime: number, currentTime: number): void {
    if (this.zombiesToSpawn > 0) {
      this.spawnTimer -= deltaTime
      if (this.spawnTimer <= 0) {
        this.spawnZombie()
        this.zombiesToSpawn--
        this.spawnTimer = ZOMBIE_SPAWN_INTERVAL
      }
    }

    this.updateZombies(deltaTime, currentTime)

    if (this.zombiesToSpawn === 0 && this.zombies.length === 0) {
      this.endWave()
    }
  }

  private startWave(): void {
    this.currentWave++
    this.state = 'playing'

    const baseCount = 10
    const zombieCount = Math.floor(baseCount * Math.pow(1.2, this.currentWave - 1))
    this.zombiesToSpawn = zombieCount
    this.spawnTimer = 0

    eventBus.emit('wave:start', this.currentWave)
    eventBus.emit('ui:waveUpdate', { current: this.currentWave, total: TOTAL_WAVES })
  }

  private endWave(): void {
    if (this.currentWave >= TOTAL_WAVES) {
      this.victory()
      return
    }

    this.state = 'preparing'
    this.waveCountdown = WAVE_PREP_TIME

    eventBus.emit('wave:end', this.currentWave)
    eventBus.emit('wave:countdown', this.waveCountdown)
  }

  private spawnZombie(): void {
    const isElite = Math.random() < 0.1 + this.currentWave * 0.02
    const type: ZombieType = isElite ? 'elite' : 'normal'
    const config = ZOMBIE_CONFIGS[type]

    const speedMultiplier = 1 + 0.1 * (this.currentWave - 1)

    const zombie: Zombie = {
      ...config,
      id: `zombie_${++this.idCounter}`,
      currentHealth: config.health,
      pathIndex: 0,
      progress: 0,
      x: this.path[0].x,
      y: this.path[0].y,
      isDying: false,
      deathTime: 0,
      isHit: false,
      hitTime: 0,
      slowEffect: 1,
      slowEndTime: 0
    }

    zombie.speed = config.speed * speedMultiplier

    this.zombies.push(zombie)
    eventBus.emit('zombie:spawn', zombie)
    eventBus.emit('render:updateZombie', zombie)
  }

  private updateZombies(deltaTime: number, currentTime: number): void {
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i]

      if (zombie.isDying) {
        if (currentTime - zombie.deathTime > 500) {
          this.zombies.splice(i, 1)
          eventBus.emit('render:removeZombie', zombie.id)
        }
        continue
      }

      if (zombie.slowEndTime > 0 && currentTime > zombie.slowEndTime) {
        zombie.slowEffect = 1
        zombie.slowEndTime = 0
      }

      const effectiveSpeed = zombie.speed * zombie.slowEffect
      zombie.progress += (effectiveSpeed * deltaTime) / CELL_SIZE

      while (zombie.progress >= 1 && zombie.pathIndex < this.path.length - 1) {
        zombie.progress -= 1
        zombie.pathIndex++
      }

      if (zombie.pathIndex >= this.path.length - 1 && zombie.progress >= 1) {
        this.zombies.splice(i, 1)
        eventBus.emit('render:removeZombie', zombie.id)
        eventBus.emit('zombie:reachEnd', zombie)
        continue
      }

      const currentPoint = this.path[zombie.pathIndex]
      const nextPoint = this.path[Math.min(zombie.pathIndex + 1, this.path.length - 1)]

      zombie.x = currentPoint.x + (nextPoint.x - currentPoint.x) * zombie.progress
      zombie.y = currentPoint.y + (nextPoint.y - currentPoint.y) * zombie.progress

      if (zombie.isHit && currentTime - zombie.hitTime > 100) {
        zombie.isHit = false
      }

      eventBus.emit('render:updateZombie', zombie)
    }
  }

  private cleanupDeadZombies(): void {
    const currentTime = performance.now()
    for (let i = this.zombies.length - 1; i >= 0; i--) {
      const zombie = this.zombies[i]
      if (zombie.isDying && currentTime - zombie.deathTime > 500) {
        this.zombies.splice(i, 1)
        eventBus.emit('render:removeZombie', zombie.id)
      }
    }
  }

  private gameOver(): void {
    this.state = 'gameover'
    eventBus.emit('game:over')
  }

  private victory(): void {
    this.state = 'victory'
    eventBus.emit('game:victory')
  }

  getZombies(): Zombie[] {
    return this.zombies
  }

  getState(): GameState {
    return this.state
  }

  getGold(): number {
    return this.gold
  }

  getLives(): number {
    return this.lives
  }

  getCurrentWave(): number {
    return this.currentWave
  }

  getPath(): Array<{ x: number; y: number }> {
    return this.path
  }

  getZombieStats(): { normal: number; elite: number } {
    let normal = 0
    let elite = 0
    for (const zombie of this.zombies) {
      if (!zombie.isDying) {
        if (zombie.type === 'normal') normal++
        else elite++
      }
    }
    return { normal, elite }
  }

  getZombiesToSpawnCount(): number {
    return this.zombiesToSpawn
  }

  getRemainingZombies(): number {
    return this.zombies.filter(z => !z.isDying).length + this.zombiesToSpawn
  }

  reset(): void {
    this.towerSystem.reset()
    this.start()
  }
}
