import { Container, Graphics } from 'pixi.js'
import { GameManager, WaveType } from './GameManager'

interface Bullet {
  graphics: Graphics
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  playerId: number
  noteIndex: number
  color: number
  life: number
  maxLife: number
  waveType: WaveType
  hit: boolean
}

export class BulletManager {
  private game: GameManager
  private container: Container
  private bullets: Bullet[] = []
  private maxBullets: number = 300
  private collisionRadius: number = 60

  constructor(game: GameManager, container: Container) {
    this.game = game
    this.container = container
  }

  private createBulletGraphics(waveType: WaveType, color: number): Graphics {
    const graphics = new Graphics()
    
    const waveColors = {
      sine: 0xbf00ff,
      sawtooth: 0xff6600,
      square: 0x00ffff
    }
    
    const bulletColor = waveColors[waveType]
    
    switch (waveType) {
      case 'sine':
        graphics.beginFill(bulletColor, 0.9)
        graphics.drawCircle(0, 0, 8)
        graphics.endFill()
        graphics.lineStyle(2, 0xffffff, 0.5)
        graphics.drawCircle(0, 0, 10)
        break
      case 'sawtooth':
        graphics.beginFill(bulletColor, 0.9)
        graphics.drawPolygon([0, -10, 10, 10, -10, 10])
        graphics.endFill()
        graphics.lineStyle(2, 0xffffff, 0.5)
        graphics.drawPolygon([0, -12, 12, 12, -12, 12])
        break
      case 'square':
        graphics.beginFill(bulletColor, 0.9)
        graphics.drawRect(-8, -8, 16, 16)
        graphics.endFill()
        graphics.lineStyle(2, 0xffffff, 0.5)
        graphics.drawRect(-10, -10, 20, 20)
        break
    }
    
    return graphics
  }

  createBullet(playerId: number, noteIndex: number) {
    if (this.bullets.length >= this.maxBullets) {
      this.removeOldestBullet()
    }

    const player = this.game.getPlayerData(playerId)
    const targetPlayer = this.game.getPlayerData(playerId === 0 ? 1 : 0)
    
    const waveType = player.waveType
    
    const speedMultiplier = waveType === 'sine' ? 1 : waveType === 'sawtooth' ? 1.3 : 0.8
    const damageBase = waveType === 'sine' ? 0.8 : waveType === 'sawtooth' ? 1.2 : 1.5
    const damage = damageBase + (Math.random() * 0.7)

    const startX = player.position.x
    const startY = player.position.y

    const dx = targetPlayer.position.x - startX
    const dy = targetPlayer.position.y - startY
    const angle = Math.atan2(dy, dx)
    
    const baseSpeed = 350 + noteIndex * 40
    const speed = baseSpeed * speedMultiplier
    const vx = Math.cos(angle) * speed
    const vy = Math.sin(angle) * speed

    const graphics = this.createBulletGraphics(waveType, player.color)
    graphics.position.set(startX, startY)
    graphics.anchor.set(0.5)

    this.container.addChild(graphics)

    const bullet: Bullet = {
      graphics,
      x: startX,
      y: startY,
      vx,
      vy,
      damage,
      playerId,
      noteIndex,
      color: player.color,
      life: 3,
      maxLife: 3,
      waveType,
      hit: false,
    }

    this.bullets.push(bullet)
  }

  private removeOldestBullet() {
    const oldestIndex = this.bullets.findIndex(b => !b.hit)
    if (oldestIndex !== -1) {
      this.destroyBullet(oldestIndex)
    }
  }

  update(deltaTime: number) {
    const bulletsToRemove: number[] = []

    for (let i = 0; i < this.bullets.length; i++) {
      const bullet = this.bullets[i]
      
      if (bullet.hit) {
        bulletsToRemove.push(i)
        continue
      }
      
      bullet.x += bullet.vx * deltaTime
      bullet.y += bullet.vy * deltaTime
      bullet.life -= deltaTime
      
      bullet.graphics.position.set(bullet.x, bullet.y)
      bullet.graphics.alpha = Math.min(1, bullet.life / bullet.maxLife + 0.3)
      bullet.graphics.scale.set(0.5 + (bullet.life / bullet.maxLife) * 0.5)
      bullet.graphics.rotation += deltaTime * 3

      if (bullet.life <= 0) {
        bulletsToRemove.push(i)
        continue
      }

      if (this.checkCollision(bullet)) {
        const targetId = bullet.playerId === 0 ? 1 : 0
        this.game.takeDamage(targetId, bullet.damage)
        bullet.hit = true
        bulletsToRemove.push(i)
      }
    }

    for (let i = bulletsToRemove.length - 1; i >= 0; i--) {
      this.destroyBullet(bulletsToRemove[i])
    }
  }

  private checkCollision(bullet: Bullet): boolean {
    const targetPlayerId = bullet.playerId === 0 ? 1 : 0
    const targetPlayer = this.game.getPlayerData(targetPlayerId)
    
    const dx = bullet.x - targetPlayer.position.x
    const dy = bullet.y - targetPlayer.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    return distance < this.collisionRadius
  }

  private destroyBullet(index: number) {
    if (index < 0 || index >= this.bullets.length) return
    
    const bullet = this.bullets[index]
    this.container.removeChild(bullet.graphics)
    bullet.graphics.destroy()
    this.bullets.splice(index, 1)
  }

  getActiveBulletCount(): number {
    return this.bullets.length
  }

  getMaxBullets(): number {
    return this.maxBullets
  }
}
