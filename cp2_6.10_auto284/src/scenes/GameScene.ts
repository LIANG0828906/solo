import Phaser from 'phaser'
import { Player } from '../entities/Player'

type ObstacleType = 'asteroid' | 'blackhole' | 'storm'

interface ObstacleConfig {
  type: ObstacleType
  texture: string
  speed: number
  rotationSpeed: number
  scale: number
}

const OBSTACLE_CONFIGS: Record<ObstacleType, ObstacleConfig> = {
  asteroid: { type: 'asteroid', texture: 'asteroid', speed: 3, rotationSpeed: 0.02, scale: 1 },
  blackhole: { type: 'blackhole', texture: 'blackhole', speed: 1.5, rotationSpeed: 0.01, scale: 1.2 },
  storm: { type: 'storm', texture: 'storm', speed: 5, rotationSpeed: 0, scale: 1 }
}

export class GameScene extends Phaser.Scene {
  private player!: Player
  private score: number = 0
  private stardust: number = 0
  private stardustForStarBurst: number = 0
  private gameSpeed: number = 4
  private baseSpeed: number = 4
  private isPaused: boolean = false
  private isGameOver: boolean = false

  private obstacleGroup!: Phaser.Physics.Arcade.Group
  private stardustGroup!: Phaser.Physics.Arcade.Group
  private starParticles!: Phaser.GameObjects.Particles.ParticleEmitterManager

  private scoreText!: Phaser.GameObjects.Text
  private stardustText!: Phaser.GameObjects.Text
  private pauseButton!: Phaser.GameObjects.Container
  private pauseIcon!: Phaser.GameObjects.Graphics

  private obstacleTimer!: Phaser.Time.TimerEvent
  private stardustTimer!: Phaser.Time.TimerEvent
  private scoreTimer!: Phaser.Time.TimerEvent
  private starTrailGraphics!: Phaser.GameObjects.Graphics
  private bgStars!: Phaser.GameObjects.Group

  private targetX: number = 0
  private targetY: number = 0

  constructor() {
    super('GameScene')
  }

  create(): void {
    this.score = 0
    this.stardust = 0
    this.stardustForStarBurst = 0
    this.gameSpeed = this.baseSpeed
    this.isPaused = false
    this.isGameOver = false

    const { width, height } = this.cameras.main

    this.createBackground()
    this.createStarTrail()

    this.player = new Player(this, width * 0.2, height / 2)
    this.targetX = this.player.x
    this.targetY = this.player.y

    this.obstacleGroup = this.physics.add.group()
    this.stardustGroup = this.physics.add.group()

    this.physics.add.overlap(
      this.player,
      this.obstacleGroup,
      this.handleObstacleCollision,
      undefined,
      this
    )

    this.physics.add.overlap(
      this.player,
      this.stardustGroup,
      this.handleStardustCollision,
      undefined,
      this
    )

    this.createUI()
    this.setupInput()
    this.startSpawning()
  }

  private createBackground(): void {
    const { width, height } = this.cameras.main
    
    const gradient = this.add.graphics()
    gradient.fillGradientStyle(0x0b0f2a, 0x0b0f2a, 0x1a1a4a, 0x1a1a4a)
    gradient.fillRect(0, 0, width, height)
    gradient.setDepth(-10)

    this.bgStars = this.add.group()
    for (let i = 0; i < 150; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, width),
        Phaser.Math.Between(0, height),
        Phaser.Math.Between(1, 3),
        0xffffff,
        Phaser.Math.Between(0.3, 1)
      )
      star.setData('speed', Phaser.Math.Between(0.5, 2))
      this.bgStars.add(star)
    }

    this.starParticles = this.add.particles(0, 0, 'particle', {
      lifespan: 2000,
      speedX: { min: -50, max: -20 },
      scale: { start: 0.5, end: 0 },
      alpha: { start: 0.8, end: 0 },
      quantity: 1,
      blendMode: 'ADD',
      tint: 0x7b2ff7,
      emitZone: {
        type: 'random',
        source: new Phaser.Geom.Rectangle(width, 0, 50, height),
        quantity: 1
      }
    })
    this.starParticles.setDepth(-5)
  }

  private createStarTrail(): void {
    this.starTrailGraphics = this.add.graphics()
    this.starTrailGraphics.setDepth(-3)
  }

  private updateStarTrail(): void {
    const { width, height } = this.cameras.main
    this.starTrailGraphics.clear()

    const centerY = height / 2
    const amplitude = height * 0.15
    const frequency = 0.003
    const time = this.time.now * 0.001

    const points: { x: number; y: number }[] = []
    for (let x = 0; x <= width; x += 10) {
      const y = centerY + Math.sin(x * frequency + time * this.gameSpeed * 0.5) * amplitude
      points.push({ x, y })
    }

    for (let layer = 0; layer < 3; layer++) {
      const lineWidth = layer === 0 ? 6 : layer === 1 ? 3 : 1
      const alpha = layer === 0 ? 0.4 : layer === 1 ? 0.7 : 0.3
      const color = layer === 0 ? 0x7b2ff7 : layer === 1 ? 0xff4b8b : 0xffffff

      this.starTrailGraphics.lineStyle(lineWidth, color, alpha)
      this.starTrailGraphics.beginPath()
      this.starTrailGraphics.moveTo(points[0].x, points[0].y)
      
      for (let i = 1; i < points.length; i++) {
        const progress = i / points.length
        let segmentAlpha = alpha
        
        if (layer === 0 || layer === 1) {
          const wave = Math.sin(progress * Math.PI)
          segmentAlpha = alpha * (0.5 + wave * 0.5)
        }
        
        this.starTrailGraphics.lineStyle(lineWidth, color, segmentAlpha)
        this.starTrailGraphics.lineTo(points[i].x, points[i].y)
      }
      
      this.starTrailGraphics.strokePath()
    }
  }

  private createUI(): void {
    const { width, height } = this.cameras.main

    this.scoreText = this.add.text(20, 20, '分数: 0', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    })
    this.scoreText.setScrollFactor(0)
    this.scoreText.setDepth(50)
    this.scoreText.setShadow(2, 2, '#000000', 2, true, true)

    this.stardustText = this.add.text(20, 55, '星尘: 0/10', {
      fontFamily: 'Arial, sans-serif',
      fontSize: '24px',
      color: '#ffd700',
      fontStyle: 'bold'
    })
    this.stardustText.setScrollFactor(0)
    this.stardustText.setDepth(50)
    this.stardustText.setShadow(2, 2, '#000000', 2, true, true)

    this.pauseButton = this.add.container(width - 70, height - 70)
    this.pauseButton.setSize(60, 60)
    this.pauseButton.setScrollFactor(0)
    this.pauseButton.setDepth(50)

    const pauseBg = this.add.circle(0, 0, 30, 0x000000, 0.5)
    pauseBg.setStrokeStyle(2, 0x00e5ff, 0.8)

    this.pauseIcon = this.add.graphics()
    this.drawPauseIcon()

    this.pauseButton.add([pauseBg, this.pauseIcon])
    this.pauseButton.setSize(60, 60)
    this.pauseButton.setInteractive({ useHandCursor: true })

    this.pauseButton.on('pointerover', () => {
      pauseBg.setStrokeStyle(3, 0x00ffff, 1)
      this.tweens.add({
        targets: this.pauseButton,
        scale: 1.1,
        duration: 150
      })
    })

    this.pauseButton.on('pointerout', () => {
      pauseBg.setStrokeStyle(2, 0x00e5ff, 0.8)
      this.tweens.add({
        targets: this.pauseButton,
        scale: 1,
        duration: 150
      })
    })

    this.pauseButton.on('pointerdown', () => this.togglePause())
  }

  private drawPauseIcon(): void {
    this.pauseIcon.clear()
    if (this.isPaused) {
      this.pauseIcon.fillStyle(0x00e5ff, 1)
      this.pauseIcon.beginPath()
      this.pauseIcon.moveTo(8, -12)
      this.pauseIcon.lineTo(-12, 0)
      this.pauseIcon.lineTo(8, 12)
      this.pauseIcon.closePath()
      this.pauseIcon.fillPath()
    } else {
      this.pauseIcon.fillStyle(0x00e5ff, 1)
      this.pauseIcon.fillRect(-12, -10, 8, 20)
      this.pauseIcon.fillRect(4, -10, 8, 20)
    }
  }

  private setupInput(): void {
    this.input.on('pointermove', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPaused && !this.isGameOver) {
        this.targetX = pointer.x
        this.targetY = pointer.y
      }
    })

    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (!this.isPaused && !this.isGameOver) {
        this.targetX = pointer.x
        this.targetY = pointer.y
      }
    })

    this.input.keyboard?.on('keydown-SPACE', () => this.togglePause())
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause())
  }

  private startSpawning(): void {
    this.obstacleTimer = this.time.addEvent({
      delay: 1200,
      callback: this.spawnObstacle,
      callbackScope: this,
      loop: true
    })

    this.stardustTimer = this.time.addEvent({
      delay: 800,
      callback: this.spawnStardust,
      callbackScope: this,
      loop: true
    })

    this.scoreTimer = this.time.addEvent({
      delay: 100,
      callback: () => {
        if (!this.isPaused && !this.isGameOver) {
          this.score += Math.floor(this.gameSpeed)
          this.updateUI()
        }
      },
      callbackScope: this,
      loop: true
    })
  }

  private spawnObstacle(): void {
    if (this.isPaused || this.isGameOver) return

    const { width, height } = this.cameras.main
    const types: ObstacleType[] = ['asteroid', 'blackhole', 'storm']
    const weights = [0.5, 0.2, 0.3]
    
    let rand = Math.random()
    let type: ObstacleType = 'asteroid'
    let cumulative = 0
    for (let i = 0; i < types.length; i++) {
      cumulative += weights[i]
      if (rand < cumulative) {
        type = types[i]
        break
      }
    }

    const config = OBSTACLE_CONFIGS[type]
    const y = Phaser.Math.Between(80, height - 80)

    const obstacle = this.obstacleGroup.get(width + 50, y, config.texture) as Phaser.Physics.Arcade.Image
    
    if (obstacle) {
      obstacle.setActive(true)
      obstacle.setVisible(true)
      obstacle.setScale(config.scale)
      obstacle.setData('type', type)
      obstacle.setData('rotationSpeed', config.rotationSpeed)
      obstacle.setData('speed', config.speed * this.gameSpeed)
      obstacle.setDepth(3)

      const body = obstacle.body as Phaser.Physics.Arcade.Body
      body.setEnable(true)

      if (type === 'asteroid') {
        body.setCircle(20)
      } else if (type === 'blackhole') {
        body.setCircle(18)
      } else {
        body.setSize(70, 18)
      }

      if (type === 'storm') {
        obstacle.setData('oscillationY', y)
        obstacle.setData('oscillationPhase', Math.random() * Math.PI * 2)
      }
    }
  }

  private spawnStardust(): void {
    if (this.isPaused || this.isGameOver) return

    const { width, height } = this.cameras.main
    const x = width + 30
    const y = Phaser.Math.Between(60, height - 60)

    const stardust = this.stardustGroup.get(x, y, 'stardust') as Phaser.Physics.Arcade.Image
    
    if (stardust) {
      stardust.setActive(true)
      stardust.setVisible(true)
      stardust.setScale(0.7)
      stardust.setDepth(2)

      const body = stardust.body as Phaser.Physics.Arcade.Body
      body.setEnable(true)
      body.setCircle(12)

      stardust.setData('collected', false)
    }
  }

  private handleObstacleCollision(
    _player: Phaser.GameObjects.GameObject,
    obstacle: Phaser.GameObjects.GameObject
  ): void {
    const obs = obstacle as Phaser.Physics.Arcade.Image
    const type = obs.getData('type') as ObstacleType

    if (this.player.hit()) {
      this.gameOver()
    } else if (type === 'blackhole' && !this.player.getInvincible()) {
      const dx = obs.x - this.player.x
      const dy = obs.y - this.player.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      if (distance < 150) {
        const pullForce = 2
        this.player.x += (dx / distance) * pullForce
        this.player.y += (dy / distance) * pullForce
      }
    }
  }

  private handleStardustCollision(
    _player: Phaser.GameObjects.GameObject,
    stardust: Phaser.GameObjects.GameObject
  ): void {
    const sd = stardust as Phaser.Physics.Arcade.Image
    
    if (sd.getData('collected')) return
    
    sd.setData('collected', true)
    
    this.stardust++
    this.stardustForStarBurst++
    this.score += 50
    this.gameSpeed = Math.min(this.baseSpeed + this.stardust * 0.05, 12)

    const collectParticles = this.add.particles(sd.x, sd.y, 'particle', {
      lifespan: 400,
      speed: { min: 50, max: 150 },
      scale: { start: 0.6, end: 0 },
      alpha: { start: 1, end: 0 },
      quantity: 10,
      blendMode: 'ADD',
      tint: 0xffd700
    })

    this.time.delayedCall(300, () => collectParticles.destroy())

    this.sound.play('collect')

    sd.disableBody(true, true)
    this.updateUI()

    if (this.stardustForStarBurst >= 10) {
      this.stardustForStarBurst = 0
      this.triggerStarBurst()
    }
  }

  private triggerStarBurst(): void {
    this.player.activateStarBurst(2000)

    const { width, height } = this.cameras.main
    const playerPos = new Phaser.Geom.Circle(this.player.x, this.player.y, 400)

    this.obstacleGroup.getChildren().forEach(child => {
      const obstacle = child as Phaser.Physics.Arcade.Image
      if (obstacle.active && Phaser.Geom.Circle.ContainsPoint(playerPos, obstacle)) {
        const explosion = this.add.particles(obstacle.x, obstacle.y, 'particle', {
          lifespan: 500,
          speed: { min: 80, max: 200 },
          scale: { start: 0.8, end: 0 },
          alpha: { start: 1, end: 0 },
          quantity: 20,
          blendMode: 'ADD',
          tint: 0xff4b8b
        })
        this.time.delayedCall(400, () => explosion.destroy())
        obstacle.disableBody(true, true)
      }
    })

    this.cameras.main.flash(200, 255, 255, 255)
  }

  update(time: number, delta: number): void {
    if (this.isPaused || this.isGameOver) return

    this.player.update(time, delta)
    this.player.move(this.targetX, this.targetY)

    this.updateStarTrail()
    this.updateBackground(delta)
    this.updateObstacles(delta)
    this.updateStardust(delta)
    this.adjustDifficulty()
  }

  private updateBackground(delta: number): void {
    const { width } = this.cameras.main

    this.bgStars.getChildren().forEach(star => {
      const s = star as Phaser.GameObjects.Arc
      const speed = s.getData('speed') * this.gameSpeed
      s.x -= speed * (delta / 16)
      if (s.x < -10) {
        s.x = width + 10
        s.y = Phaser.Math.Between(0, this.cameras.main.height)
      }
    })
  }

  private updateObstacles(delta: number): void {
    this.obstacleGroup.getChildren().forEach(child => {
      const obstacle = child as Phaser.Physics.Arcade.Image
      if (!obstacle.active) return

      const speed = obstacle.getData('speed') as number
      obstacle.x -= speed * (delta / 16)

      const rotationSpeed = obstacle.getData('rotationSpeed') as number
      if (rotationSpeed > 0) {
        obstacle.rotation += rotationSpeed
      }

      const type = obstacle.getData('type') as ObstacleType
      if (type === 'storm') {
        const baseY = obstacle.getData('oscillationY') as number
        const phase = obstacle.getData('oscillationPhase') as number
        obstacle.y = baseY + Math.sin(this.time.now * 0.005 + phase) * 40
      }

      if (obstacle.x < -100) {
        obstacle.disableBody(true, true)
      }
    })
  }

  private updateStardust(delta: number): void {
    this.stardustGroup.getChildren().forEach(child => {
      const sd = child as Phaser.Physics.Arcade.Image
      if (!sd.active) return

      sd.x -= this.gameSpeed * 2 * (delta / 16)
      sd.rotation += 0.02

      if (sd.x < -50) {
        sd.disableBody(true, true)
      }
    })
  }

  private adjustDifficulty(): void {
    const newDelay = Math.max(500, 1200 - this.score * 0.05)
    if (this.obstacleTimer && this.obstacleTimer.delay !== newDelay) {
      this.obstacleTimer.delay = newDelay
    }

    const stardustDelay = Math.max(400, 800 - this.score * 0.02)
    if (this.stardustTimer && this.stardustTimer.delay !== stardustDelay) {
      this.stardustTimer.delay = stardustDelay
    }
  }

  private updateUI(): void {
    this.scoreText.setText(`分数: ${this.score}`)
    this.stardustText.setText(`星尘: ${this.stardustForStarBurst}/10 (总: ${this.stardust})`)
  }

  private togglePause(): void {
    if (this.isGameOver) return

    this.isPaused = !this.isPaused
    this.drawPauseIcon()

    if (this.isPaused) {
      this.obstacleTimer.paused = true
      this.stardustTimer.paused = true
      this.scoreTimer.paused = true
      this.physics.pause()
      this.starParticles.pause()

      const { width, height } = this.cameras.main
      const overlay = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.5)
      overlay.setDepth(60)
      overlay.setScrollFactor(0)
      overlay.setName('pauseOverlay')

      const pauseText = this.add.text(width / 2, height / 2, '暂停', {
        fontFamily: 'Arial, sans-serif',
        fontSize: '64px',
        color: '#00e5ff',
        fontStyle: 'bold'
      })
      pauseText.setOrigin(0.5)
      pauseText.setDepth(61)
      pauseText.setScrollFactor(0)
      pauseText.setName('pauseText')
      pauseText.setShadow(4, 4, '#000000', 4, true, true)
    } else {
      this.obstacleTimer.paused = false
      this.stardustTimer.paused = false
      this.scoreTimer.paused = false
      this.physics.resume()
      this.starParticles.resume()

      this.children.getByName('pauseOverlay')?.destroy()
      this.children.getByName('pauseText')?.destroy()
    }
  }

  private gameOver(): void {
    this.isGameOver = true
    this.physics.pause()
    this.obstacleTimer.paused = true
    this.stardustTimer.paused = true
    this.scoreTimer.paused = true
    this.starParticles.pause()

    const highScore = parseInt(localStorage.getItem('starTrailHighScore') || '0', 10)
    if (this.score > highScore) {
      localStorage.setItem('starTrailHighScore', this.score.toString())
    }

    this.time.delayedCall(500, () => {
      this.scene.start('GameOverScene', {
        score: this.score,
        stardust: this.stardust,
        highScore: Math.max(this.score, highScore)
      })
    })
  }
}
