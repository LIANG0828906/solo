import { eventBus } from './eventBus'
import {
  Tower,
  TowerType,
  Zombie,
  Projectile,
  TOWER_CONFIGS,
  CELL_SIZE,
  GRID_SIZE
} from './types'

export class TowerSystem {
  private towers: Map<string, Tower> = new Map()
  private projectiles: Map<string, Projectile> = new Map()
  private grid: (string | null)[][] = []
  private selectedTowerType: TowerType | null = null
  private selectedTowerId: string | null = null
  private idCounter = 0

  constructor() {
    this.initGrid()
    this.registerEvents()
  }

  private initGrid(): void {
    this.grid = Array(GRID_SIZE).fill(null).map(() => Array(GRID_SIZE).fill(null))
  }

  private registerEvents(): void {
    eventBus.on('ui:towerSelected', (data) => {
      const type = data as TowerType
      this.selectedTowerType = type
      this.selectedTowerId = null
      eventBus.emit('tower:deselect')
    })

    eventBus.on('tower:select', (data) => {
      const towerId = data as string
      this.selectedTowerId = towerId
      this.selectedTowerType = null
    })

    eventBus.on('tower:deselect', () => {
      this.selectedTowerId = null
      this.selectedTowerType = null
    })

    eventBus.on('ui:upgradeConfirm', (data) => {
      const towerId = data as string
      this.upgradeTower(towerId)
    })

    eventBus.on('zombie:death', (data) => {
      const zombie = data as Zombie
      this.removeTargetFromProjectiles(zombie.id)
    })
  }

  placeTower(gridX: number, gridY: number, type: TowerType, gold: number): boolean {
    if (!this.canPlaceTower(gridX, gridY)) {
      return false
    }

    const config = TOWER_CONFIGS[type]
    if (gold < config.cost) {
      return false
    }

    const tower: Tower = {
      ...config,
      id: `tower_${++this.idCounter}`,
      gridX,
      gridY,
      level: 1,
      lastAttackTime: 0,
      muzzleFlashTime: 0
    }

    this.towers.set(tower.id, tower)
    this.grid[gridY][gridX] = tower.id

    eventBus.emit('tower:place', tower)
    eventBus.emit('render:updateTower', tower)

    return true
  }

  canPlaceTower(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridX >= GRID_SIZE || gridY < 0 || gridY >= GRID_SIZE) {
      return false
    }
    if (this.isOnPath(gridX, gridY)) {
      return false
    }
    return this.grid[gridY][gridX] === null
  }

  private isOnPath(_gridX: number, gridY: number): boolean {
    const pathY = Math.floor(GRID_SIZE / 2)
    return gridY === pathY
  }

  isPathCell(gridX: number, gridY: number): boolean {
    return this.isOnPath(gridX, gridY)
  }

  upgradeTower(towerId: string): boolean {
    const tower = this.towers.get(towerId)
    if (!tower || tower.level >= 3) {
      return false
    }

    const upgradeCost = this.getUpgradeCost(tower)
    tower.level++
    tower.damage = Math.floor(TOWER_CONFIGS[tower.type].damage * (1 + 0.3 * (tower.level - 1)))
    tower.attackSpeed = TOWER_CONFIGS[tower.type].attackSpeed * (1 + 0.15 * (tower.level - 1))

    eventBus.emit('tower:upgrade', { tower, cost: upgradeCost })
    eventBus.emit('render:updateTower', tower)

    return true
  }

  getUpgradeCost(tower: Tower): number {
    return Math.floor(TOWER_CONFIGS[tower.type].cost * tower.level * 0.8)
  }

  getTowerAt(gridX: number, gridY: number): Tower | undefined {
    const towerId = this.grid[gridY]?.[gridX]
    return towerId ? this.towers.get(towerId) : undefined
  }

  getSelectedTower(): Tower | undefined {
    return this.selectedTowerId ? this.towers.get(this.selectedTowerId) : undefined
  }

  getSelectedTowerType(): TowerType | null {
    return this.selectedTowerType
  }

  update(deltaTime: number, currentTime: number, zombies: Zombie[]): void {
    this.towers.forEach(tower => {
      this.updateTowerAttack(tower, currentTime, zombies)
    })

    this.updateProjectiles(deltaTime, zombies)
  }

  private updateTowerAttack(tower: Tower, currentTime: number, zombies: Zombie[]): void {
    const attackInterval = 1000 / tower.attackSpeed
    if (currentTime - tower.lastAttackTime < attackInterval) {
      return
    }

    const target = this.findTarget(tower, zombies)
    if (!target) {
      return
    }

    tower.lastAttackTime = currentTime
    tower.muzzleFlashTime = currentTime

    this.createProjectile(tower, target)
    eventBus.emit('tower:attack', { tower, target })
    eventBus.emit('render:muzzleFlash', tower.id)
  }

  private findTarget(tower: Tower, zombies: Zombie[]): Zombie | null {
    const towerX = tower.gridX * CELL_SIZE + CELL_SIZE / 2 - GRID_SIZE / 2
    const towerY = tower.gridY * CELL_SIZE + CELL_SIZE / 2 - GRID_SIZE / 2
    const range = tower.range * CELL_SIZE

    let bestTarget: Zombie | null = null
    let bestProgress = -1

    for (const zombie of zombies) {
      if (zombie.isDying) continue

      const dx = zombie.x - towerX
      const dy = zombie.y - towerY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance <= range) {
        const progress = zombie.pathIndex + zombie.progress
        if (progress > bestProgress) {
          bestProgress = progress
          bestTarget = zombie
        }
      }
    }

    return bestTarget
  }

  private createProjectile(tower: Tower, target: Zombie): void {
    const startX = tower.gridX * CELL_SIZE + CELL_SIZE / 2 - GRID_SIZE / 2
    const startY = tower.gridY * CELL_SIZE + CELL_SIZE / 2 - GRID_SIZE / 2

    const projectile: Projectile = {
      id: `proj_${++this.idCounter}`,
      towerType: tower.type,
      startX,
      startY,
      targetId: target.id,
      targetX: target.x,
      targetY: target.y,
      progress: 0,
      speed: tower.type === 'flame' ? 15 : 25,
      damage: tower.damage,
      trail: []
    }

    this.projectiles.set(projectile.id, projectile)
    eventBus.emit('render:addProjectile', projectile)
  }

  private updateProjectiles(deltaTime: number, zombies: Zombie[]): void {
    const toRemove: string[] = []

    this.projectiles.forEach(proj => {
      const target = zombies.find(z => z.id === proj.targetId && !z.isDying)

      if (target) {
        proj.targetX = target.x
        proj.targetY = target.y
      }

      const dx = proj.targetX - proj.startX
      const dy = proj.targetY - proj.startY
      const distance = Math.sqrt(dx * dx + dy * dy)

      if (distance > 0) {
        proj.progress += (proj.speed * deltaTime) / distance
      }

      const currentX = proj.startX + dx * Math.min(proj.progress, 1)
      const currentY = proj.startY + dy * Math.min(proj.progress, 1)

      proj.trail.unshift({ x: currentX, y: currentY, alpha: 1 })
      if (proj.trail.length > 10) {
        proj.trail.pop()
      }
      proj.trail.forEach((point, i) => {
        point.alpha = 1 - i / proj.trail.length
      })

      if (proj.progress >= 1) {
        if (target) {
          this.hitZombie(target, proj)
        }
        toRemove.push(proj.id)
      }
    })

    toRemove.forEach(id => {
      this.projectiles.delete(id)
      eventBus.emit('render:removeProjectile', id)
    })
  }

  private hitZombie(zombie: Zombie, projectile: Projectile): void {
    zombie.currentHealth -= projectile.damage
    zombie.isHit = true
    zombie.hitTime = performance.now()

    if (projectile.towerType === 'slow') {
      zombie.slowEffect = 0.5
      zombie.slowEndTime = performance.now() + 2000
    }

    eventBus.emit('zombie:hit', zombie)

    if (zombie.currentHealth <= 0) {
      zombie.isDying = true
      zombie.deathTime = performance.now()
      eventBus.emit('zombie:death', zombie)
      eventBus.emit('render:addDeathEffect', { x: zombie.x, y: zombie.y })
    }
  }

  private removeTargetFromProjectiles(zombieId: string): void {
    this.projectiles.forEach(proj => {
      if (proj.targetId === zombieId) {
        proj.targetId = ''
      }
    })
  }

  getTowers(): Tower[] {
    return Array.from(this.towers.values())
  }

  getProjectiles(): Projectile[] {
    return Array.from(this.projectiles.values())
  }

  reset(): void {
    this.towers.clear()
    this.projectiles.clear()
    this.initGrid()
    this.selectedTowerType = null
    this.selectedTowerId = null
    this.idCounter = 0
  }
}
