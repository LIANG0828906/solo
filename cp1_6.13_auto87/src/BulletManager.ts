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
}

export class BulletManager {
  private game: GameManager
  private container: Container
  private bullets: Bullet[] = []

  private maxBullets: number = 300

  constructor(game: GameManager, container: Container) {
    this.game = game
    this.container = container
  }

  private createBulletGraphics(waveType: WaveType, color: number): Graphics {
    const graphics = new Graphics()
    graphics.anchor.set(0.5)
    graphics.tint = color
    
    switch (waveType) {
      case 'sine':
        graphics.beginFill(color, 0.8)
        graphics.drawCircle(0, 0, 8)
        break
      case 'sawtooth':
        graphics.beginFill(color, 0.8)
        graphics.drawPolygon([0, -8, 8, 8, -8, 8])
        break
      case 'square':
        graphics.beginFill(color, 0.8)
        graphics.drawRect(-6, -6, 12, 12)
        break
    }
    
    return graphics
  }

  createBullet(playerId: number, noteIndex: number) {
    if (this.bullets.length >= this.maxBullets) return

    const player = this.game.getPlayerData(playerId)
    const targetPlayer = this.game.getPlayerData(playerId === 0 ? 1 : 0)
    
    const waveType = player.waveType
    
    const speedMultiplier = waveType === 'sine' ? 1 : waveType === 'sawtooth' ? 1.3 : 0.8
    const damage = waveType === 'sine' ? 0.8 : waveType === 'sawtooth' ? 1.2 : 1.5

    const startX = player.position.x
    const startY = player.position.y + 50

    const angle = Math.atan2(targetPlayer.position.y - startY, targetPlayer.position.x - startX)
    
    const baseSpeed = 400 + noteIndex * 50
    const vx = Math.cos(angle) * baseSpeed * speedMultiplier
    const vy = Math.sin(angle) * baseSpeed * speedMultiplier

    const graphics = this.createBulletGraphics(waveType, player.color)
    graphics.position.set(startX, startY)

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
    }

    this.bullets.push(bullet)
  }

  update(deltaTime: number) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const bullet = this.bullets[i]
      
      bullet.x += bullet.vx * deltaTime
      bullet.y += bullet.vy * deltaTime
      bullet.life -= deltaTime
      
      bullet.graphics.position.set(bullet.x, bullet.y)
      bullet.graphics.alpha = bullet.life / bullet.maxLife
      bullet.graphics.scale.set(0.5 + (bullet.life / bullet.maxLife) * 0.5)

      if (bullet.life <= 0) {
        this.destroyBullet(i)
        continue
      }

      if (this.checkCollision(bullet)) {
        this.game.takeDamage(bullet.playerId === 0 ? 1 : 0, bullet.damage)
        this.destroyBullet(i)
      }
    }
  }

  private checkCollision(bullet: Bullet): boolean {
    const targetPlayer = this.game.getPlayerData(bullet.playerId === 0 ? 1 : 0)
    
    const dx = bullet.x - targetPlayer.position.x
    const dy = bullet.y - targetPlayer.position.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    return distance < 80
  }

  private destroyBullet(index: number) {
    const bullet = this.bullets[index]
    this.container.removeChild(bullet.graphics)
    bullet.graphics.destroy()
    this.bullets.splice(index, 1)
  }

  getActiveBulletCount(): number {
    return this.bullets.length
  }
}
