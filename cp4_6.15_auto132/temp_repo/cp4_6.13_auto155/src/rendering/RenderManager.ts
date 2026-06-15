import { ThemeManager, ThemeConfig } from '../data/ThemeManager'
import { PlayerState, Obstacle, Fragment } from '../core/PhysicsManager'

export interface RenderState {
  player: PlayerState
  obstacles: Obstacle[]
  fragments: Fragment[]
  score: number
  eraProgress: number
  isInTimeWarp: boolean
  timeWarpProgress: number
  isBossRush: boolean
  bossRushProgress: number
  transitionProgress: number
  isTransitioning: boolean
}

export class RenderManager {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private themeManager: ThemeManager
  private groundY: number
  private tileOffset: number = 0
  private particles: Array<{ x: number; y: number; life: number }> = []
  private animationFrame: number = 0

  constructor(canvas: HTMLCanvasElement, themeManager: ThemeManager) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')!
    this.themeManager = themeManager
    this.groundY = canvas.height - 80
  }

  resize(width: number, height: number): void {
    this.canvas.width = Math.max(width, 1024)
    this.canvas.height = Math.max(height, 600)
    this.groundY = this.canvas.height - 80
  }

  update(state: RenderState, deltaTime: number): void {
    this.tileOffset += 6 * deltaTime * 60
    if (this.tileOffset > 60) this.tileOffset -= 60

    if (state.player.isSliding) {
      this.addParticles(state.player.position.x, this.groundY - 10)
    }

    this.particles = this.particles.filter(p => {
      p.life -= deltaTime
      p.x -= 4
      return p.life > 0
    })

    this.render(state)
  }

  private addParticles(x: number, y: number): void {
    for (let i = 0; i < 3; i++) {
      this.particles.push({
        x: x + Math.random() * 40,
        y: y - Math.random() * 10,
        life: 0.5
      })
    }
  }

  private render(state: RenderState): void {
    const theme = this.themeManager.getCurrentTheme()
    
    this.ctx.save()

    if (state.isInTimeWarp) {
      this.applyFishEyeEffect()
    }

    this.drawSky(theme)
    this.drawParallaxBackground(theme, state)
    this.drawGround(theme)
    this.drawObstacles(state.obstacles, theme, state.isInTimeWarp)
    this.drawFragments(state.fragments, theme)
    this.drawPlayer(state.player, theme)
    this.drawParticles()
    this.drawUI(state)

    if (state.isInTimeWarp) {
      this.applyColorShift(theme)
    }

    if (state.isTransitioning) {
      this.drawTransition(state.transitionProgress)
    }

    if (state.isBossRush) {
      this.drawBossRushOverlay(state.bossRushProgress)
    }

    this.ctx.restore()
  }

  private drawSky(theme: ThemeConfig): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height)
    gradient.addColorStop(0, theme.skyColors.top)
    gradient.addColorStop(1, theme.skyColors.bottom)
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  private drawParallaxBackground(theme: ThemeConfig, state: RenderState): void {
    const speedMultiplier = state.isInTimeWarp ? 2 : 1
    
    this.drawParallaxLayer(theme.parallaxElements.background, 0.5 * speedMultiplier, 0.1)
    this.drawParallaxLayer(theme.parallaxElements.middle, 1 * speedMultiplier, 0.3)
    this.drawParallaxLayer(theme.parallaxElements.foreground, 1.5 * speedMultiplier, 0.5)
  }

  private drawParallaxLayer(elements: Array<{ type: string; color: string }>, speed: number, scale: number): void {
    const offset = (this.tileOffset * speed) % (this.canvas.width + 200) - 100
    
    for (let i = -1; i < 3; i++) {
      const x = i * (this.canvas.width / 2) + offset
      elements.forEach((elem, index) => {
        this.ctx.save()
        this.ctx.translate(x + index * 150, this.canvas.height * (0.3 + scale * 0.4))
        this.ctx.scale(scale, scale)
        this.drawParallaxElement(elem.type, elem.color)
        this.ctx.restore()
      })
    }
  }

  private drawParallaxElement(type: string, color: string): void {
    this.ctx.fillStyle = color
    this.ctx.strokeStyle = color

    switch (type) {
      case 'dinosaur':
        this.ctx.beginPath()
        this.ctx.arc(0, -50, 30, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.beginPath()
        this.ctx.moveTo(-20, -50)
        this.ctx.lineTo(-40, -70)
        this.ctx.lineTo(-10, -50)
        this.ctx.fill()
        break
      case 'tree':
        this.ctx.fillRect(-5, -60, 10, 60)
        this.ctx.beginPath()
        this.ctx.moveTo(-25, -60)
        this.ctx.lineTo(0, -100)
        this.ctx.lineTo(25, -60)
        this.ctx.fill()
        break
      case 'mountain':
        this.ctx.beginPath()
        this.ctx.moveTo(-60, 0)
        this.ctx.lineTo(0, -80)
        this.ctx.lineTo(60, 0)
        this.ctx.fill()
        break
      case 'volcano':
        this.ctx.beginPath()
        this.ctx.moveTo(-50, 0)
        this.ctx.lineTo(0, -60)
        this.ctx.lineTo(50, 0)
        this.ctx.fill()
        this.ctx.fillStyle = '#FF6347'
        this.ctx.beginPath()
        this.ctx.arc(-10, -55, 5, 0, Math.PI * 2)
        this.ctx.fill()
        break
      case 'cloud':
        this.ctx.beginPath()
        this.ctx.arc(-30, -10, 15, 0, Math.PI * 2)
        this.ctx.arc(0, -15, 20, 0, Math.PI * 2)
        this.ctx.arc(30, -10, 15, 0, Math.PI * 2)
        this.ctx.fill()
        break
      case 'gear':
        this.ctx.beginPath()
        for (let i = 0; i < 8; i++) {
          const angle = (i / 8) * Math.PI * 2
          this.ctx.lineTo(Math.cos(angle) * 25, Math.sin(angle) * 25)
          this.ctx.lineTo(Math.cos(angle) * 20, Math.sin(angle) * 20)
        }
        this.ctx.closePath()
        this.ctx.fill()
        this.ctx.beginPath()
        this.ctx.arc(0, 0, 15, 0, Math.PI * 2)
        this.ctx.fillStyle = theme.groundColor
        this.ctx.fill()
        break
      case 'smoke':
        this.ctx.globalAlpha = 0.3
        this.ctx.beginPath()
        this.ctx.arc(0, -30, 20, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.beginPath()
        this.ctx.arc(15, -40, 15, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.globalAlpha = 1
        break
      case 'factory':
        this.ctx.fillRect(-30, -80, 60, 80)
        this.ctx.fillRect(-10, -100, 20, 20)
        break
      case 'billboard':
        this.ctx.fillRect(-40, -50, 80, 40)
        this.ctx.fillStyle = '#FF00FF'
        this.ctx.font = '12px monospace'
        this.ctx.fillText('CYBER', -15, -30)
        this.ctx.fillStyle = '#00FFFF'
        this.ctx.fillText('NEON', -10, -15)
        break
      case 'neon':
        this.ctx.strokeStyle = '#00FFFF'
        this.ctx.lineWidth = 3
        this.ctx.beginPath()
        this.ctx.moveTo(-20, -50)
        this.ctx.lineTo(-20, -10)
        this.ctx.lineTo(20, -10)
        this.ctx.stroke()
        break
      case 'building':
        this.ctx.fillRect(-50, -100, 100, 100)
        for (let row = 0; row < 4; row++) {
          for (let col = 0; col < 5; col++) {
            this.ctx.fillStyle = '#FF00FF'
            this.ctx.fillRect(-40 + col * 20, -90 + row * 20, 8, 8)
          }
        }
        break
      case 'planet':
        this.ctx.beginPath()
        this.ctx.arc(0, -40, 35, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.beginPath()
        this.ctx.arc(-5, -35, 20, 0, Math.PI, true)
        this.ctx.strokeStyle = '#6B8E23'
        this.ctx.lineWidth = 3
        this.ctx.stroke()
        break
      case 'satellite':
        this.ctx.strokeStyle = '#C0C0C0'
        this.ctx.lineWidth = 2
        this.ctx.beginPath()
        this.ctx.arc(0, 0, 25, 0, Math.PI * 2)
        this.ctx.stroke()
        this.ctx.fillRect(-30, 0, 60, 3)
        break
      case 'star':
        this.ctx.globalAlpha = 0.8 + Math.sin(Date.now() / 500) * 0.2
        this.ctx.beginPath()
        this.ctx.arc(0, 0, 2, 0, Math.PI * 2)
        this.ctx.fill()
        this.ctx.globalAlpha = 1
        break
    }
  }

  private drawGround(theme: ThemeConfig): void {
    this.ctx.fillStyle = theme.groundColor
    this.ctx.fillRect(0, this.groundY, this.canvas.width, 80)

    this.ctx.strokeStyle = theme.fragmentColor
    this.ctx.lineWidth = 2

    const patternSize = 60
    const offset = this.tileOffset % patternSize

    for (let x = -patternSize + offset; x < this.canvas.width + patternSize; x += patternSize) {
      for (let y = this.groundY; y < this.groundY + 80; y += patternSize / 2) {
        this.drawGroundPattern(x, y, theme.groundPattern, theme.fragmentColor)
      }
    }
  }

  private drawGroundPattern(x: number, y: number, pattern: string, color: string): void {
    this.ctx.strokeStyle = color
    this.ctx.globalAlpha = 0.3

    switch (pattern) {
      case 'earth':
        this.ctx.beginPath()
        this.ctx.arc(x + 15, y + 15, 12, 0, Math.PI * 2)
        this.ctx.stroke()
        break
      case 'metal':
        this.ctx.fillStyle = color
        this.ctx.fillRect(x + 5, y + 5, 20, 20)
        this.ctx.fillStyle = '#8B4513'
        this.ctx.fillRect(x + 8, y + 8, 14, 14)
        break
      case 'neon':
        this.ctx.strokeStyle = '#00FFFF'
        this.ctx.lineWidth = 1
        this.ctx.strokeRect(x + 5, y + 5, 20, 20)
        this.ctx.strokeStyle = '#FF00FF'
        this.ctx.beginPath()
        this.ctx.moveTo(x + 5, y + 25)
        this.ctx.lineTo(x + 25, y + 5)
        this.ctx.stroke()
        break
      case 'honeycomb':
        this.ctx.beginPath()
        for (let i = 0; i < 6; i++) {
          const angle = (i / 6) * Math.PI * 2
          this.ctx.lineTo(x + 15 + Math.cos(angle) * 12, y + 15 + Math.sin(angle) * 12)
        }
        this.ctx.closePath()
        this.ctx.stroke()
        break
    }

    this.ctx.globalAlpha = 1
  }

  private drawObstacles(obstacles: Obstacle[], theme: ThemeConfig, isTransparent: boolean): void {
    this.ctx.globalAlpha = isTransparent ? 0.3 : 1

    obstacles.forEach(obs => {
      const color = theme.obstacleColors[obs.type]
      this.ctx.fillStyle = color
      this.ctx.strokeStyle = color

      switch (obs.type) {
        case 'spike':
          this.ctx.beginPath()
          this.ctx.moveTo(obs.x, obs.y + obs.height)
          this.ctx.lineTo(obs.x + obs.width / 2, obs.y)
          this.ctx.lineTo(obs.x + obs.width, obs.y + obs.height)
          this.ctx.closePath()
          this.ctx.fill()
          break
        case 'bar':
          this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height)
          this.ctx.shadowColor = color
          this.ctx.shadowBlur = 10
          this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height)
          this.ctx.shadowBlur = 0
          break
        case 'robot':
          this.ctx.fillRect(obs.x, obs.y, obs.width, obs.height)
          this.ctx.fillStyle = '#333'
          this.ctx.fillRect(obs.x + 5, obs.y + 5, 10, 10)
          this.ctx.fillRect(obs.x + 25, obs.y + 5, 10, 10)
          break
      }
    })

    this.ctx.globalAlpha = 1
  }

  private drawFragments(fragments: Fragment[], theme: ThemeConfig): void {
    fragments.forEach(frag => {
      if (frag.collected) return

      this.ctx.save()
      this.ctx.translate(frag.x, frag.y)
      this.ctx.rotate(frag.rotation)

      this.ctx.shadowColor = theme.fragmentColor
      this.ctx.shadowBlur = 15

      this.ctx.fillStyle = theme.fragmentColor
      this.ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        const x = Math.cos(angle) * 12
        const y = Math.sin(angle) * 12
        if (i === 0) this.ctx.moveTo(x, y)
        else this.ctx.lineTo(x, y)
      }
      this.ctx.closePath()
      this.ctx.fill()

      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2
        const x = Math.cos(angle) * 6
        const y = Math.sin(angle) * 6
        if (i === 0) this.ctx.moveTo(x, y)
        else this.ctx.lineTo(x, y)
      }
      this.ctx.closePath()
      this.ctx.fill()

      this.ctx.shadowBlur = 0
      this.ctx.restore()
    })
  }

  private drawPlayer(player: PlayerState, theme: ThemeConfig): void {
    this.ctx.save()
    this.ctx.translate(player.position.x, player.position.y)

    if (player.isSliding) {
      this.ctx.scale(1.5, 0.6)
      this.ctx.translate(-16, 20)
    }

    this.animationFrame = (this.animationFrame + 1) % 24

    const frame = Math.floor(this.animationFrame / 6)

    this.drawPixelPlayer(frame, player.isJumping, theme.fragmentColor)

    this.ctx.restore()
  }

  private drawPixelPlayer(frame: number, isJumping: boolean, color: string): void {
    this.ctx.fillStyle = '#FF6B6B'
    this.ctx.fillRect(16, 0, 32, 32)
    
    this.ctx.fillStyle = '#4ECDC4'
    this.ctx.fillRect(20, 4, 24, 24)

    this.ctx.fillStyle = '#333'
    this.ctx.fillRect(24, 8, 6, 6)
    this.ctx.fillRect(34, 8, 6, 6)

    const armOffset = isJumping ? -8 : (frame % 2 === 0 ? -8 : 8)
    this.ctx.fillStyle = '#FF6B6B'
    this.ctx.fillRect(4, 8, 12, 8)
    this.ctx.fillRect(44, 8, 12, 8)
    this.ctx.save()
    this.ctx.translate(16, 12)
    this.ctx.rotate(isJumping ? -0.5 : (frame % 2 === 0 ? -0.3 : 0.3))
    this.ctx.fillStyle = '#FF6B6B'
    this.ctx.fillRect(-8, -4, 12, 8)
    this.ctx.restore()
    this.ctx.save()
    this.ctx.translate(48, 12)
    this.ctx.rotate(isJumping ? 0.5 : (frame % 2 === 0 ? 0.3 : -0.3))
    this.ctx.fillStyle = '#FF6B6B'
    this.ctx.fillRect(-4, -4, 12, 8)
    this.ctx.restore()

    this.ctx.fillStyle = '#FFE66D'
    const legOffset = frame % 2 === 0 ? 4 : -4
    this.ctx.fillRect(16, 32, 12, 16)
    this.ctx.fillRect(32, 32, 12, 16)
    this.ctx.fillRect(16, 40 + legOffset, 12, 8)
    this.ctx.fillRect(32, 40 - legOffset, 12, 8)

    this.ctx.fillStyle = '#333'
    this.ctx.fillRect(16, 48 + legOffset, 12, 4)
    this.ctx.fillRect(32, 48 - legOffset, 12, 4)
  }

  private drawParticles(): void {
    this.particles.forEach(p => {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${p.life / 0.5})`
      this.ctx.beginPath()
      this.ctx.arc(p.x, p.y, 2, 0, Math.PI * 2)
      this.ctx.fill()
    })
  }

  private drawUI(state: RenderState): void {
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.strokeStyle = '#000000'
    this.ctx.lineWidth = 2
    this.ctx.font = 'bold 40px monospace'

    this.ctx.strokeText(`分数: ${state.score}`, 20, 50)
    this.ctx.fillText(`分数: ${state.score}`, 20, 50)

    const progressBarX = this.canvas.width - 220
    const progressBarY = 20
    const progressBarWidth = 200
    const progressBarHeight = 20

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.beginPath()
    this.ctx.roundRect(progressBarX, progressBarY, progressBarWidth, progressBarHeight, 10)
    this.ctx.fill()

    const gradient = this.ctx.createLinearGradient(progressBarX, progressBarY, progressBarX + progressBarWidth, progressBarY)
    gradient.addColorStop(0, '#FF6B6B')
    gradient.addColorStop(0.5, '#4ECDC4')
    gradient.addColorStop(1, '#FFE66D')

    this.ctx.fillStyle = gradient
    this.ctx.beginPath()
    this.ctx.roundRect(progressBarX, progressBarY, progressBarWidth * state.eraProgress, progressBarHeight, 10)
    this.ctx.fill()

    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '14px monospace'
    this.ctx.fillText('时代进度', progressBarX, progressBarY + 35)
  }

  private applyFishEyeEffect(): void {
    const centerX = this.canvas.width / 2
    const centerY = this.canvas.height / 2
    const radius = Math.min(this.canvas.width, this.canvas.height) / 2

    this.ctx.save()
    this.ctx.translate(centerX, centerY)
    this.ctx.scale(1.1, 1.1)
    this.ctx.translate(-centerX, -centerY)
  }

  private applyColorShift(theme: ThemeConfig): void {
    const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i]
      const g = data[i + 1]
      const b = data[i + 2]

      data[i] = 255 - r
      data[i + 1] = 255 - g
      data[i + 2] = 255 - b
    }

    this.ctx.putImageData(imageData, 0, 0)
  }

  private drawTransition(progress: number): void {
    const slideWidth = this.canvas.width * progress
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.fillRect(this.canvas.width - slideWidth, 0, slideWidth, this.canvas.height)
  }

  private drawBossRushOverlay(progress: number): void {
    const alpha = 0.3 * Math.sin(progress * Math.PI * 2)
    this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  drawMainMenu(highScore: number, unlockedThemes: string[]): void {
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.fillStyle = '#FFE66D'
    this.ctx.font = 'bold 60px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = '#FFE66D'
    this.ctx.shadowBlur = 20
    this.ctx.fillText('时空穿越跑酷', this.canvas.width / 2, 150)
    this.ctx.shadowBlur = 0

    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '30px monospace'
    this.ctx.fillText(`最高分: ${highScore}`, this.canvas.width / 2, 220)

    const startButton = this.drawButton(this.canvas.width / 2 - 100, 300, 200, 60, '开始游戏')
    const galleryButton = this.drawButton(this.canvas.width / 2 - 100, 380, 200, 60, '时代图鉴')

    this.ctx.font = '20px monospace'
    this.ctx.fillStyle = '#888888'
    this.ctx.fillText('空格键跳跃 | Shift键滑铲', this.canvas.width / 2, 500)

    this.ctx.textAlign = 'left'

    return { startButton, galleryButton }
  }

  drawButton(x: number, y: number, width: number, height: number, text: string): { x: number; y: number; width: number; height: number } {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    this.ctx.strokeStyle = '#FFFFFF'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.roundRect(x, y, width, height, 10)
    this.ctx.fill()
    this.ctx.stroke()

    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = 'bold 24px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText(text, x + width / 2, y + height / 2 + 8)

    this.ctx.textAlign = 'left'

    return { x, y, width, height }
  }

  drawPauseMenu(): { continueButton: { x: number; y: number; width: number; height: number }; menuButton: { x: number; y: number; width: number; height: number } } {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.fillStyle = '#FFE66D'
    this.ctx.font = 'bold 48px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('游戏暂停', this.canvas.width / 2, 200)

    const continueButton = this.drawButton(this.canvas.width / 2 - 100, 280, 200, 60, '继续游戏')
    const menuButton = this.drawButton(this.canvas.width / 2 - 100, 360, 200, 60, '返回主菜单')

    this.ctx.textAlign = 'left'

    return { continueButton, menuButton }
  }

  drawGameOver(score: number, era: string, highScore: number): { restartButton: { x: number; y: number; width: number; height: number } } {
    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.fillStyle = '#FF6B6B'
    this.ctx.font = 'bold 56px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.shadowColor = '#FF6B6B'
    this.ctx.shadowBlur = 20
    this.ctx.fillText('游戏结束', this.canvas.width / 2, 180)
    this.ctx.shadowBlur = 0

    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.font = '32px monospace'
    this.ctx.fillText(`最终分数: ${score}`, this.canvas.width / 2, 260)
    this.ctx.fillText(`当前时代: ${era}`, this.canvas.width / 2, 310)
    this.ctx.fillText(`最高分: ${highScore}`, this.canvas.width / 2, 360)

    const restartButton = this.drawButton(this.canvas.width / 2 - 100, 420, 200, 60, '重新开始')

    this.ctx.textAlign = 'left'

    return { restartButton }
  }

  drawThemeGallery(themes: Array<{ name: string; icon: string; unlocked: boolean }>): { backButton: { x: number; y: number; width: number; height: number } } {
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height)
    gradient.addColorStop(0, '#1a1a2e')
    gradient.addColorStop(1, '#16213e')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.fillStyle = '#FFE66D'
    this.ctx.font = 'bold 48px monospace'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('时代图鉴', this.canvas.width / 2, 100)

    themes.forEach((theme, index) => {
      const x = this.canvas.width / 2 - 200 + index * 150
      const y = 200

      this.ctx.fillStyle = theme.unlocked ? 'rgba(255, 230, 109, 0.2)' : 'rgba(50, 50, 50, 0.5)'
      this.ctx.strokeStyle = theme.unlocked ? '#FFE66D' : '#555555'
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.roundRect(x, y, 120, 140, 10)
      this.ctx.fill()
      this.ctx.stroke()

      this.ctx.font = '60px Arial'
      this.ctx.fillStyle = theme.unlocked ? '#FFFFFF' : '#555555'
      this.ctx.textAlign = 'center'
      this.ctx.fillText(theme.icon, x + 60, y + 70)

      this.ctx.font = '16px monospace'
      this.ctx.fillStyle = theme.unlocked ? '#FFFFFF' : '#555555'
      this.ctx.fillText(theme.name, x + 60, y + 110)

      if (!theme.unlocked) {
        this.ctx.fillStyle = '#FF6B6B'
        this.ctx.font = '12px monospace'
        this.ctx.fillText('未解锁', x + 60, y + 130)
      }
    })

    const backButton = this.drawButton(this.canvas.width / 2 - 100, 450, 200, 60, '返回')

    this.ctx.textAlign = 'left'