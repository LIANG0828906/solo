import { GameEntity, PlayerEntity, EnemyEntity, BulletEntity, ParticleEntity, Star } from './types'

const STAR_COUNT = 80

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private stars: Star[] = []

  constructor(ctx: CanvasRenderingContext2D, cw: number, ch: number) {
    this.ctx = ctx
    this.initStars(cw, ch)
  }

  private initStars(cw: number, ch: number) {
    this.stars = []
    for (let i = 0; i < STAR_COUNT; i++) {
      this.stars.push({
        x: Math.random() * cw,
        y: Math.random() * ch,
        size: 2,
        alpha: 0.3 + Math.random() * 0.5,
        speed: 5
      })
    }
  }

  public resize(cw: number, ch: number) {
    this.initStars(cw, ch)
  }

  public updateStars(dt: number, ch: number) {
    for (const star of this.stars) {
      star.y += star.speed * dt
      if (star.y > ch) {
        star.y = 0
        star.x = Math.random() * (this.ctx.canvas.width || window.innerWidth)
      }
    }
  }

  public render(
    cw: number,
    ch: number,
    player: PlayerEntity,
    entities: GameEntity[],
    score: number,
    lives: number,
    maxLives: number,
    level: number,
    soundEnabled: boolean,
    gameState: string
  ) {
    const ctx = this.ctx
    ctx.fillStyle = '#0B0C10'
    ctx.fillRect(0, 0, cw, ch)

    this.renderStars()

    for (const entity of entities) {
      if (!entity.active) continue
      switch (entity.type) {
        case 'enemy':
          this.renderEnemy(entity as EnemyEntity)
          break
        case 'playerBullet':
        case 'enemyBullet':
          this.renderBullet(entity as BulletEntity)
          break
        case 'particle':
          this.renderParticle(entity as ParticleEntity)
          break
      }
    }

    this.renderPlayer(player)
    this.renderHUD(cw, ch, score, lives, maxLives, level)
    this.renderSoundButton(cw, soundEnabled)

    if (gameState === 'paused') {
      this.renderPauseOverlay(cw, ch)
    }
  }

  private renderStars() {
    const ctx = this.ctx
    for (const star of this.stars) {
      ctx.globalAlpha = star.alpha
      ctx.fillStyle = '#FFFFFF'
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1
  }

  private renderPlayer(player: PlayerEntity) {
    const ctx = this.ctx
    const { position, width, height } = player
    ctx.save()
    ctx.translate(position.x, position.y)

    if (player.invincible && Math.floor(Date.now() / 80) % 2 === 0) {
      ctx.globalAlpha = 0.5
    }

    ctx.fillStyle = '#4FC3F7'
    ctx.strokeStyle = '#0288D1'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, -height / 2)
    ctx.lineTo(-width / 2, height / 2)
    ctx.lineTo(0, height / 4)
    ctx.lineTo(width / 2, height / 2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    ctx.fillStyle = '#81D4FA'
    ctx.beginPath()
    ctx.arc(0, 0, width / 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = '#FF6B35'
    ctx.beginPath()
    ctx.moveTo(-width / 6, height / 3)
    ctx.lineTo(0, height / 2 + 8 + Math.random() * 6)
    ctx.lineTo(width / 6, height / 3)
    ctx.closePath()
    ctx.fill()

    ctx.restore()
  }

  private renderEnemy(enemy: EnemyEntity) {
    const ctx = this.ctx
    const { position, width, height, enemyType } = enemy
    ctx.save()
    ctx.translate(position.x, position.y)

    let color: string, strokeColor: string
    let sides: number

    switch (enemyType) {
      case 'normal':
        color = enemy.hitFlashTimer > 0 ? '#FFFFFF' : '#E53935'
        strokeColor = '#B71C1C'
        sides = 3
        break
      case 'elite':
        color = enemy.hitFlashTimer > 0 ? '#FFFFFF' : '#1E88E5'
        strokeColor = '#0D47A1'
        sides = 6
        break
      case 'boss':
        color = enemy.hitFlashTimer > 0 ? '#FFFFFF' : '#9C27B0'
        strokeColor = '#4A148C'
        sides = 8
        break
    }

    const r = Math.max(width, height) / 2
    ctx.fillStyle = color
    ctx.strokeStyle = strokeColor
    ctx.lineWidth = 2
    ctx.beginPath()
    for (let i = 0; i < sides; i++) {
      const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    if (enemy.maxHp > 1) {
      const barW = width
      const barH = 4
      ctx.fillStyle = '#333'
      ctx.fillRect(-barW / 2, -r - 10, barW, barH)
      ctx.fillStyle = '#4CAF50'
      ctx.fillRect(-barW / 2, -r - 10, barW * (enemy.hp / enemy.maxHp), barH)
    }

    ctx.restore()
  }

  private renderBullet(bullet: BulletEntity) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = bullet.color
    ctx.shadowColor = bullet.color
    ctx.shadowBlur = 8
    ctx.beginPath()
    ctx.arc(bullet.position.x, bullet.position.y, bullet.radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  private renderParticle(p: ParticleEntity) {
    const ctx = this.ctx
    const alpha = p.lifetime / p.maxLifetime
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.fillRect(
      p.position.x - p.size / 2,
      p.position.y - p.size / 2,
      p.size,
      p.size
    )
    ctx.restore()
  }

  private renderHUD(cw: number, ch: number, score: number, lives: number, maxLives: number, level: number) {
    const ctx = this.ctx
    ctx.save()

    ctx.font = 'bold 20px "Segoe UI", sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = '#000000'
    ctx.shadowBlur = 4
    ctx.shadowOffsetX = 2
    ctx.shadowOffsetY = 2
    ctx.textAlign = 'left'
    ctx.fillText(`得分: ${score}`, 20, 35)

    ctx.font = 'bold 16px "Segoe UI", sans-serif'
    ctx.fillStyle = '#FFD700'
    ctx.textAlign = 'center'
    ctx.fillText(`LV.${level}`, cw / 2, 30)

    ctx.textAlign = 'right'
    ctx.shadowBlur = 0
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 0
    const heartSize = 20
    const heartGap = 4
    for (let i = 0; i < maxLives; i++) {
      const x = cw - 20 - (maxLives - 1 - i) * (heartSize + heartGap)
      const y = 28
      const color = i < lives ? '#FF4444' : '#666666'
      this.renderHeart(x, y, heartSize, color)
    }

    ctx.restore()
  }

  private renderHeart(x: number, y: number, size: number, color: string) {
    const ctx = this.ctx
    ctx.save()
    ctx.translate(x - size / 2, y - size / 2)
    ctx.scale(size / 32, size / 32)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.moveTo(16, 28)
    ctx.bezierCurveTo(16, 28, 1, 18, 1, 10)
    ctx.bezierCurveTo(1, 4, 6, 0, 10, 0)
    ctx.bezierCurveTo(13, 0, 16, 3, 16, 6)
    ctx.bezierCurveTo(16, 3, 19, 0, 22, 0)
    ctx.bezierCurveTo(26, 0, 31, 4, 31, 10)
    ctx.bezierCurveTo(31, 18, 16, 28, 16, 28)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  private renderSoundButton(cw: number, enabled: boolean) {
    const ctx = this.ctx
    ctx.save()
    const btnX = cw - 20 - 40
    const btnY = 50
    const btnW = 40
    const btnH = 32
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    this.roundRect(ctx, btnX, btnY, btnW, btnH, 8)
    ctx.fill()
    ctx.font = '18px sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(enabled ? '🔊' : '🔇', btnX + btnW / 2, btnY + btnH / 2 + 1)
    ctx.restore()
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath()
    ctx.moveTo(x + r, y)
    ctx.lineTo(x + w - r, y)
    ctx.quadraticCurveTo(x + w, y, x + w, y + r)
    ctx.lineTo(x + w, y + h - r)
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
    ctx.lineTo(x + r, y + h)
    ctx.quadraticCurveTo(x, y + h, x, y + h - r)
    ctx.lineTo(x, y + r)
    ctx.quadraticCurveTo(x, y, x + r, y)
    ctx.closePath()
  }

  public renderPauseOverlay(cw: number, ch: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'
    ctx.fillRect(0, 0, cw, ch)

    ctx.font = 'bold 36px "Segoe UI", sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.shadowColor = '#000000'
    ctx.shadowBlur = 8
    ctx.fillText('已暂停', cw / 2, ch / 2 - 30)

    const btnW = 140, btnH = 48
    const btnX = cw / 2 - btnW / 2
    const btnY = ch / 2 + 20
    ctx.shadowBlur = 0
    ctx.fillStyle = '#4FC3F7'
    this.roundRect(ctx, btnX, btnY, btnW, btnH, 8)
    ctx.fill()
    ctx.font = 'bold 20px "Segoe UI", sans-serif'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('继续游戏', cw / 2, btnY + btnH / 2)
    ctx.restore()
  }

  public isSoundButtonClicked(cw: number, x: number, y: number): boolean {
    const btnX = cw - 20 - 40
    const btnY = 50
    const btnW = 40
    const btnH = 32
    return x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH
  }

  public isResumeButtonClicked(cw: number, ch: number, x: number, y: number): boolean {
    const btnW = 140, btnH = 48
    const btnX = cw / 2 - btnW / 2
    const btnY = ch / 2 + 20
    return x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH
  }
}
