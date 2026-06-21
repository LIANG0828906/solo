const NEON_COLORS = ['#FF3366', '#33CCFF', '#FFCC00', '#00FF88']

interface Player {
  x: number
  targetX: number
  y: number
  width: number
  height: number
  smoothTime: number
}

interface TrackSegment {
  y: number
  height: number
  width: number
  color: string
  active: boolean
}

interface Obstacle {
  x: number
  y: number
  size: number
  active: boolean
}

interface Crystal {
  x: number
  y: number
  size: number
  rotation: number
  active: boolean
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  color: string
  size: number
}

interface Ripple {
  x: number
  y: number
  radius: number
  maxRadius: number
  life: number
  maxLife: number
  active: boolean
}

interface SpeedLine {
  x: number
  y: number
  length: number
  opacity: number
  active: boolean
}

export interface GameState {
  score: number
  highScore: number
  speed: number
  baseSpeed: number
  energy: number
  maxEnergy: number
  comboCount: number
  isSpeedBurst: boolean
  speedBurstTimer: number
  isGameOver: boolean
  gameOverFlashTimer: number
}

const HIGH_SCORE_KEY = 'speed_light_track_high_score'

export class GameEngine {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D
  private width: number = 0
  private height: number = 0

  private player: Player
  private trackSegments: TrackSegment[] = []
  private segmentPool: TrackSegment[] = []
  private obstacles: Obstacle[] = []
  private obstaclePool: Obstacle[] = []
  private crystals: Crystal[] = []
  private crystalPool: Crystal[] = []
  private particles: Particle[] = []
  private ripples: Ripple[] = []
  private speedLines: SpeedLine[] = []

  private state: GameState

  private lastObstacleY: number = -200
  private lastCrystalY: number = -150
  private boundaryOffset: number = 0
  private trackBaseWidth: number = 0

  private isRunning: boolean = false

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context not available')
    this.ctx = ctx

    this.player = {
      x: 0,
      targetX: 0,
      y: 0,
      width: 40,
      height: 50,
      smoothTime: 0.1
    }

    const savedHighScore = localStorage.getItem(HIGH_SCORE_KEY)
    this.state = {
      score: 0,
      highScore: savedHighScore ? parseInt(savedHighScore, 10) : 0,
      speed: 300,
      baseSpeed: 300,
      energy: 0,
      maxEnergy: 100,
      comboCount: 0,
      isSpeedBurst: false,
      speedBurstTimer: 0,
      isGameOver: false,
      gameOverFlashTimer: 0
    }

    this.resize()
    this.initObjectPools()
    this.initTrack()
  }

  private initObjectPools(): void {
    for (let i = 0; i < 30; i++) {
      this.segmentPool.push({ y: 0, height: 0, width: 0, color: '', active: false })
    }
    for (let i = 0; i < 20; i++) {
      this.obstaclePool.push({ x: 0, y: 0, size: 20, active: false })
    }
    for (let i = 0; i < 15; i++) {
      this.crystalPool.push({ x: 0, y: 0, size: 12, rotation: 0, active: false })
    }
    for (let i = 0; i < 50; i++) {
      this.particles.push({ x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, color: '', size: 0 })
    }
    for (let i = 0; i < 5; i++) {
      this.ripples.push({ x: 0, y: 0, radius: 0, maxRadius: 40, life: 0, maxLife: 0.3, active: false })
    }
    for (let i = 0; i < 30; i++) {
      this.speedLines.push({ x: 0, y: 0, length: 0, opacity: 0, active: false })
    }
  }

  private initTrack(): void {
    let y = this.height
    while (y > -300) {
      this.spawnTrackSegmentAt(y)
      y -= 90 + Math.random() * 30
    }
  }

  resize(): void {
    const dpr = window.devicePixelRatio || 1
    this.width = this.canvas.clientWidth
    this.height = this.canvas.clientHeight
    this.canvas.width = this.width * dpr
    this.canvas.height = this.height * dpr
    this.ctx.scale(dpr, dpr)

    this.player.y = this.height * 2 / 3
    this.player.targetX = this.width / 2
    this.player.x = this.width / 2
    this.trackBaseWidth = Math.min(this.width * 0.7, 400)
  }

  getState(): GameState {
    return { ...this.state }
  }

  handleInput(x: number): void {
    if (this.state.isGameOver) return
    const halfTrack = this.trackBaseWidth / 2
    const trackLeft = this.width / 2 - halfTrack
    const trackRight = this.width / 2 + halfTrack
    this.player.targetX = Math.max(trackLeft + this.player.width / 2, Math.min(trackRight - this.player.width / 2, x))
  }

  start(): void {
    this.isRunning = true
  }

  stop(): void {
    this.isRunning = false
  }

  reset(): void {
    this.state = {
      score: 0,
      highScore: this.state.highScore,
      speed: 300,
      baseSpeed: 300,
      energy: 0,
      maxEnergy: 100,
      comboCount: 0,
      isSpeedBurst: false,
      speedBurstTimer: 0,
      isGameOver: false,
      gameOverFlashTimer: 0
    }

    this.trackSegments.forEach(s => s.active = false)
    this.obstacles.forEach(o => o.active = false)
    this.crystals.forEach(c => c.active = false)
    this.particles.forEach(p => p.life = 0)
    this.ripples.forEach(r => r.active = false)
    this.speedLines.forEach(l => l.active = false)

    this.lastObstacleY = -200
    this.lastCrystalY = -150

    this.player.x = this.width / 2
    this.player.targetX = this.width / 2

    this.initTrack()
  }

  update(deltaTime: number): void {
    if (!this.isRunning) return

    if (this.state.isGameOver) {
      if (this.state.gameOverFlashTimer > 0) {
        this.state.gameOverFlashTimer -= deltaTime
      }
      return
    }

    this.updateDifficulty()
    this.updateSpeedBurst(deltaTime)
    this.updatePlayer(deltaTime)
    this.updateTrack(deltaTime)
    this.updateObstacles(deltaTime)
    this.updateCrystals(deltaTime)
    this.updateParticles(deltaTime)
    this.updateRipples(deltaTime)
    this.updateSpeedLines(deltaTime)
    this.updateBoundary(deltaTime)
    this.checkCollisions()
    this.spawnObjects()
  }

  private updateDifficulty(): void {
    const level = Math.floor(this.state.score / 10)
    const speedMultiplier = 1 + level * 0.05
    this.state.baseSpeed = 300 * speedMultiplier
    this.state.speed = this.state.isSpeedBurst ? this.state.baseSpeed * 2 : this.state.baseSpeed
  }

  private updateSpeedBurst(deltaTime: number): void {
    if (this.state.isSpeedBurst) {
      this.state.speedBurstTimer -= deltaTime
      if (this.state.speedBurstTimer <= 0) {
        this.state.isSpeedBurst = false
        this.state.speed = this.state.baseSpeed
      }
    }
  }

  private updatePlayer(deltaTime: number): void {
    const lerpFactor = 1 - Math.exp(-deltaTime / this.player.smoothTime)
    this.player.x += (this.player.targetX - this.player.x) * lerpFactor
    this.spawnTrailParticles()
  }

  private spawnTrailParticles(): void {
    const speedRatio = this.state.speed / 600
    const particleCount = Math.floor(speedRatio * 3) + 1

    for (let i = 0; i < particleCount; i++) {
      const particle = this.particles.find(p => p.life <= 0)
      if (!particle) return

      let color = '#33CCFF'
      if (this.state.isSpeedBurst) {
        color = '#00FF88'
      } else if (speedRatio > 0.8) {
        color = '#FF3366'
      } else if (speedRatio > 0.5) {
        color = '#FFCC00'
      }

      particle.x = this.player.x + (Math.random() - 0.5) * 15
      particle.y = this.player.y + this.player.height / 2
      particle.vx = (Math.random() - 0.5) * 30
      particle.vy = 50 + Math.random() * 80 + this.state.speed * 0.3
      particle.life = 0.4 + Math.random() * 0.3
      particle.maxLife = particle.life
      particle.color = color
      particle.size = 3 + Math.random() * 4
    }
  }

  private updateTrack(deltaTime: number): void {
    const speed = this.state.speed

    for (const segment of this.trackSegments) {
      if (!segment.active) continue
      segment.y += speed * deltaTime
      if (segment.y > this.height + 100) {
        segment.active = false
      }
    }
  }

  private spawnTrackSegmentAt(y: number): void {
    let segment = this.segmentPool.find(s => !s.active)
    if (!segment) {
      segment = { y: 0, height: 0, width: 0, color: '', active: false }
      this.segmentPool.push(segment)
    }

    const widthVariation = 0.85 + Math.random() * 0.3
    segment.y = y
    segment.height = 100 + Math.random() * 80
    segment.width = this.trackBaseWidth * widthVariation
    segment.color = NEON_COLORS[Math.floor(Math.random() * NEON_COLORS.length)]
    segment.active = true

    this.trackSegments.push(segment)
  }

  private updateObstacles(deltaTime: number): void {
    const speed = this.state.speed

    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue
      obstacle.y += speed * deltaTime
      if (obstacle.y > this.height + 50) {
        obstacle.active = false
      }
    }
  }

  private updateCrystals(deltaTime: number): void {
    const speed = this.state.speed

    for (const crystal of this.crystals) {
      if (!crystal.active) continue
      crystal.y += speed * deltaTime
      crystal.rotation += Math.PI * 2 * deltaTime * 2
      if (crystal.y > this.height + 50) {
        crystal.active = false
      }
    }
  }

  private updateParticles(deltaTime: number): void {
    for (const particle of this.particles) {
      if (particle.life <= 0) continue
      particle.x += particle.vx * deltaTime
      particle.y += particle.vy * deltaTime
      particle.life -= deltaTime
    }
  }

  private updateRipples(deltaTime: number): void {
    for (const ripple of this.ripples) {
      if (!ripple.active) continue
      ripple.life -= deltaTime
      const progress = 1 - ripple.life / ripple.maxLife
      ripple.radius = ripple.maxRadius * progress
      if (ripple.life <= 0) {
        ripple.active = false
      }
    }
  }

  private updateSpeedLines(deltaTime: number): void {
    if (!this.state.isSpeedBurst) return

    const speed = this.state.speed

    for (const line of this.speedLines) {
      if (line.active) {
        line.y += speed * deltaTime
        line.opacity -= deltaTime * 2
        if (line.y > this.height || line.opacity <= 0) {
          line.active = false
        }
      }
    }

    if (Math.random() < 0.5) {
      const line = this.speedLines.find(l => !l.active)
      if (line) {
        const halfTrack = this.trackBaseWidth / 2
        line.x = this.width / 2 - halfTrack + Math.random() * this.trackBaseWidth
        line.y = -20
        line.length = 30 + Math.random() * 50
        line.opacity = 0.6 + Math.random() * 0.4
        line.active = true
      }
    }
  }

  private updateBoundary(deltaTime: number): void {
    this.boundaryOffset = (this.boundaryOffset + this.state.speed * deltaTime) % 30
  }

  private spawnObjects(): void {
    const topSegment = this.trackSegments
      .filter(s => s.active)
      .sort((a, b) => a.y - b.y)[0]

    if (!topSegment) return

    if (topSegment.y > 0) {
      this.spawnTrackSegmentAt(topSegment.y - topSegment.height + 10)
    }

    const level = Math.floor(this.state.score / 10)
    const obstacleInterval = Math.max(120, 250 - level * 10)
    const crystalInterval = Math.min(250, 180 + level * 5)

    if (this.lastObstacleY - topSegment.y > obstacleInterval) {
      if (Math.random() < 0.7) {
        this.spawnObstacle(topSegment.y)
      }
      this.lastObstacleY = topSegment.y
    }

    if (this.lastCrystalY - topSegment.y > crystalInterval) {
      if (Math.random() < 0.6) {
        this.spawnCrystal(topSegment.y)
      }
      this.lastCrystalY = topSegment.y
    }
  }

  private spawnObstacle(y: number): void {
    let obstacle = this.obstaclePool.find(o => !o.active)
    if (!obstacle) {
      obstacle = { x: 0, y: 0, size: 20, active: false }
      this.obstaclePool.push(obstacle)
    }

    const halfTrack = this.trackBaseWidth / 2 - 30
    obstacle.x = this.width / 2 + (Math.random() - 0.5) * halfTrack * 2
    obstacle.y = y
    obstacle.size = 20
    obstacle.active = true

    this.obstacles.push(obstacle)
  }

  private spawnCrystal(y: number): void {
    let crystal = this.crystalPool.find(c => !c.active)
    if (!crystal) {
      crystal = { x: 0, y: 0, size: 12, rotation: 0, active: false }
      this.crystalPool.push(crystal)
    }

    const positions = [-1, 0, 1]
    const posIndex = Math.floor(Math.random() * positions.length)
    const halfTrack = this.trackBaseWidth / 2 - 30
    crystal.x = this.width / 2 + positions[posIndex] * halfTrack * 0.6
    crystal.y = y
    crystal.size = 12
    crystal.rotation = 0
    crystal.active = true

    this.crystals.push(crystal)
  }

  private checkCollisions(): void {
    const playerLeft = this.player.x - this.player.width / 2
    const playerRight = this.player.x + this.player.width / 2
    const playerTop = this.player.y - this.player.height / 2
    const playerBottom = this.player.y + this.player.height / 2

    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue
      const obsLeft = obstacle.x - obstacle.size / 2
      const obsRight = obstacle.x + obstacle.size / 2
      const obsTop = obstacle.y - obstacle.size / 2
      const obsBottom = obstacle.y + obstacle.size / 2

      if (this.aabbCollide(playerLeft, playerRight, playerTop, playerBottom, obsLeft, obsRight, obsTop, obsBottom)) {
        this.gameOver()
        return
      }
    }

    for (const crystal of this.crystals) {
      if (!crystal.active) continue
      const cryLeft = crystal.x - crystal.size
      const cryRight = crystal.x + crystal.size
      const cryTop = crystal.y - crystal.size
      const cryBottom = crystal.y + crystal.size

      if (this.aabbCollide(playerLeft, playerRight, playerTop, playerBottom, cryLeft, cryRight, cryTop, cryBottom)) {
        this.collectCrystal(crystal)
      }
    }
  }

  private aabbCollide(l1: number, r1: number, t1: number, b1: number, l2: number, r2: number, t2: number, b2: number): boolean {
    return l1 < r2 && r1 > l2 && t1 < b2 && b1 > t2
  }

  private collectCrystal(crystal: Crystal): void {
    crystal.active = false
    this.state.comboCount++

    const pointsPerCrystal = this.state.isSpeedBurst ? 20 : 10
    this.state.score += pointsPerCrystal

    this.state.energy = Math.min(this.state.maxEnergy, this.state.energy + 10)

    this.spawnRipple(crystal.x, crystal.y)

    if (this.state.comboCount >= 3 && !this.state.isSpeedBurst) {
      this.triggerSpeedBurst()
      this.state.comboCount = 0
    }
  }

  private spawnRipple(x: number, y: number): void {
    let ripple = this.ripples.find(r => !r.active)
    if (!ripple) {
      ripple = { x: 0, y: 0, radius: 0, maxRadius: 40, life: 0, maxLife: 0.3, active: false }
      this.ripples.push(ripple)
    }

    ripple.x = x
    ripple.y = y
    ripple.radius = 0
    ripple.maxRadius = 40
    ripple.life = 0.3
    ripple.maxLife = 0.3
    ripple.active = true
  }

  private triggerSpeedBurst(): void {
    this.state.isSpeedBurst = true
    this.state.speedBurstTimer = 3
    this.state.speed = this.state.baseSpeed * 2
  }

  private gameOver(): void {
    this.state.isGameOver = true
    this.state.gameOverFlashTimer = 0.3
    this.state.comboCount = 0

    if (this.state.score > this.state.highScore) {
      this.state.highScore = this.state.score
      localStorage.setItem(HIGH_SCORE_KEY, this.state.highScore.toString())
    }
  }

  render(): void {
    this.ctx.clearRect(0, 0, this.width, this.height)

    this.renderBackground()
    this.renderTrack()
    this.renderBoundary()
    this.renderSpeedLines()
    this.renderObstacles()
    this.renderCrystals()
    this.renderParticles()
    this.renderRipples()
    this.renderPlayer()
    this.renderGameOverFlash()
  }

  private renderBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height)
    gradient.addColorStop(0, '#0F172A')
    gradient.addColorStop(1, '#1E1B4B')
    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.width, this.height)
  }

  private renderTrack(): void {
    const centerX = this.width / 2

    const activeSegments = this.trackSegments.filter(s => s.active).sort((a, b) => a.y - b.y)

    for (const segment of activeSegments) {
      const halfWidth = segment.width / 2
      const x = centerX - halfWidth

      const gradient = this.ctx.createLinearGradient(x, segment.y, x + segment.width, segment.y)
      gradient.addColorStop(0, 'rgba(255,255,255,0)')
      gradient.addColorStop(0.1, segment.color)
      gradient.addColorStop(0.5, segment.color)
      gradient.addColorStop(0.9, segment.color)
      gradient.addColorStop(1, 'rgba(255,255,255,0)')

      this.ctx.save()
      this.ctx.shadowColor = segment.color
      this.ctx.shadowBlur = 30
      this.ctx.globalAlpha = 0.7
      this.ctx.fillStyle = gradient
      this.ctx.fillRect(x, segment.y, segment.width, segment.height)
      this.ctx.restore()

      this.ctx.save()
      this.ctx.shadowColor = segment.color
      this.ctx.shadowBlur = 20
      this.ctx.fillStyle = '#FFFFFF'
      this.ctx.globalAlpha = 0.8
      this.ctx.fillRect(x + segment.width * 0.12, segment.y + segment.height / 2 - 1, segment.width * 0.76, 2)
      this.ctx.restore()
    }
  }

  private renderBoundary(): void {
    const centerX = this.width / 2
    const halfTrack = this.trackBaseWidth / 2
    const leftX = centerX - halfTrack
    const rightX = centerX + halfTrack

    this.ctx.strokeStyle = '#33CCFF'
    this.ctx.lineWidth = 2
    this.ctx.shadowColor = '#33CCFF'
    this.ctx.shadowBlur = 10
    this.ctx.setLineDash([15, 15])
    this.ctx.lineDashOffset = -this.boundaryOffset

    this.ctx.beginPath()
    this.ctx.moveTo(leftX, 0)
    this.ctx.lineTo(leftX, this.height)
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.moveTo(rightX, 0)
    this.ctx.lineTo(rightX, this.height)
    this.ctx.stroke()

    this.ctx.setLineDash([])
    this.ctx.shadowBlur = 0
  }

  private renderSpeedLines(): void {
    if (!this.state.isSpeedBurst) return

    this.ctx.strokeStyle = '#00FF88'
    this.ctx.lineWidth = 2
    this.ctx.shadowColor = '#00FF88'
    this.ctx.shadowBlur = 5

    for (const line of this.speedLines) {
      if (!line.active) continue
      this.ctx.globalAlpha = line.opacity
      this.ctx.beginPath()
      this.ctx.moveTo(line.x, line.y)
      this.ctx.lineTo(line.x, line.y + line.length)
      this.ctx.stroke()
    }

    this.ctx.globalAlpha = 1
    this.ctx.shadowBlur = 0
  }

  private renderObstacles(): void {
    for (const obstacle of this.obstacles) {
      if (!obstacle.active) continue

      this.ctx.save()
      this.ctx.translate(obstacle.x, obstacle.y)
      this.ctx.rotate(Math.PI / 4)

      this.ctx.shadowColor = '#FF3366'
      this.ctx.shadowBlur = 15
      this.ctx.fillStyle = '#FF3366'
      this.ctx.fillRect(-obstacle.size / 2, -obstacle.size / 2, obstacle.size, obstacle.size)

      this.ctx.strokeStyle = '#FF6688'
      this.ctx.lineWidth = 2
      this.ctx.strokeRect(-obstacle.size / 2, -obstacle.size / 2, obstacle.size, obstacle.size)

      this.ctx.restore()
    }
  }

  private renderCrystals(): void {
    for (const crystal of this.crystals) {
      if (!crystal.active) continue

      this.ctx.save()
      this.ctx.translate(crystal.x, crystal.y)
      this.ctx.rotate(crystal.rotation)

      this.ctx.shadowColor = '#FFD700'
      this.ctx.shadowBlur = 15

      this.ctx.fillStyle = '#FFD700'
      this.ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
        const x = Math.cos(angle) * crystal.size
        const y = Math.sin(angle) * crystal.size
        if (i === 0) {
          this.ctx.moveTo(x, y)
        } else {
          this.ctx.lineTo(x, y)
        }
      }
      this.ctx.closePath()
      this.ctx.fill()

      this.ctx.fillStyle = '#FFFACD'
      this.ctx.globalAlpha = 0.5
      this.ctx.beginPath()
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 2
        const x = Math.cos(angle) * crystal.size * 0.5
        const y = Math.sin(angle) * crystal.size * 0.5
        if (i === 0) {
          this.ctx.moveTo(x, y)
        } else {
          this.ctx.lineTo(x, y)
        }
      }
      this.ctx.closePath()
      this.ctx.fill()

      this.ctx.restore()
    }
  }

  private renderParticles(): void {
    for (const particle of this.particles) {
      if (particle.life <= 0) continue

      const alpha = particle.life / particle.maxLife
      this.ctx.globalAlpha = alpha
      this.ctx.fillStyle = particle.color
      this.ctx.shadowColor = particle.color
      this.ctx.shadowBlur = 5
      this.ctx.beginPath()
      this.ctx.arc(particle.x, particle.y, particle.size * alpha, 0, Math.PI * 2)
      this.ctx.fill()
    }
    this.ctx.globalAlpha = 1
    this.ctx.shadowBlur = 0
  }

  private renderRipples(): void {
    for (const ripple of this.ripples) {
      if (!ripple.active) continue

      const alpha = ripple.life / ripple.maxLife
      this.ctx.strokeStyle = '#FFD700'
      this.ctx.lineWidth = 3
      this.ctx.globalAlpha = alpha
      this.ctx.shadowColor = '#FFD700'
      this.ctx.shadowBlur = 10
      this.ctx.beginPath()
      this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
      this.ctx.stroke()
    }
    this.ctx.globalAlpha = 1
    this.ctx.shadowBlur = 0
  }

  private renderPlayer(): void {
    const { x, y, width, height } = this.player

    const bodyColor = this.state.isSpeedBurst ? '#00FF88' : '#33CCFF'

    this.ctx.save()
    this.ctx.translate(x, y)

    this.ctx.shadowColor = bodyColor
    this.ctx.shadowBlur = 20

    this.ctx.fillStyle = bodyColor
    this.ctx.beginPath()
    this.ctx.moveTo(0, -height / 2)
    this.ctx.lineTo(width / 2, height / 3)
    this.ctx.lineTo(width / 3, height / 2)
    this.ctx.lineTo(-width / 3, height / 2)
    this.ctx.lineTo(-width / 2, height / 3)
    this.ctx.closePath()
    this.ctx.fill()

    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.globalAlpha = 0.5
    this.ctx.beginPath()
    this.ctx.moveTo(0, -height / 3)
    this.ctx.lineTo(width / 4, height / 6)
    this.ctx.lineTo(-width / 4, height / 6)
    this.ctx.closePath()
    this.ctx.fill()

    if (this.state.isSpeedBurst) {
      this.ctx.globalAlpha = 0.3
      this.ctx.strokeStyle = '#00FF88'
      this.ctx.lineWidth = 2
      this.ctx.beginPath()
      this.ctx.moveTo(0, -height / 2 - 10)
      this.ctx.lineTo(width / 2 + 10, height / 3 + 5)
      this.ctx.lineTo(width / 3 + 5, height / 2 + 10)
      this.ctx.lineTo(-width / 3 - 5, height / 2 + 10)
      this.ctx.lineTo(-width / 2 - 10, height / 3 + 5)
      this.ctx.closePath()
      this.ctx.stroke()
    }

    this.ctx.restore()
  }

  private renderGameOverFlash(): void {
    if (this.state.gameOverFlashTimer > 0) {
      const alpha = (this.state.gameOverFlashTimer / 0.3) * 0.3
      this.ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`
      this.ctx.fillRect(0, 0, this.width, this.height)
    }
  }
}
