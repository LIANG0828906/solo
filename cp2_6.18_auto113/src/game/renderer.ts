import { GameEngine, SonicPulse } from './gameEngine'

export class Renderer {
  private ctx: CanvasRenderingContext2D
  private engine: GameEngine

  constructor(ctx: CanvasRenderingContext2D, engine: GameEngine) {
    this.ctx = ctx
    this.engine = engine
  }

  public render(): void {
    const { width, height } = this.engine
    this.ctx.clearRect(0, 0, width, height)

    this.drawBackground()
    this.drawArena()
    this.drawRadarPoints()
    this.drawSonicPulses()
    this.drawTargets()
    this.drawParticles()
    this.drawPlayer()
    this.drawRipple()
    this.drawChargeIndicator()
    this.drawHUD()
    this.drawRadar()
  }

  private drawBackground(): void {
    const { width, height } = this.engine
    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, width, height)
  }

  private drawArena(): void {
    const { arenaCenter, arenaRadius } = this.engine

    const gradient = this.ctx.createRadialGradient(
      arenaCenter.x, arenaCenter.y, arenaRadius - 10,
      arenaCenter.x, arenaCenter.y, arenaRadius + 10
    )
    gradient.addColorStop(0, 'rgba(0, 191, 255, 0)')
    gradient.addColorStop(0.5, 'rgba(0, 191, 255, 0.3)')
    gradient.addColorStop(1, 'rgba(0, 191, 255, 0)')

    this.ctx.beginPath()
    this.ctx.arc(arenaCenter.x, arenaCenter.y, arenaRadius + 5, 0, Math.PI * 2)
    this.ctx.arc(arenaCenter.x, arenaCenter.y, arenaRadius - 5, 0, Math.PI * 2, true)
    this.ctx.fillStyle = gradient
    this.ctx.fill()

    this.ctx.beginPath()
    this.ctx.arc(arenaCenter.x, arenaCenter.y, arenaRadius, 0, Math.PI * 2)
    this.ctx.strokeStyle = 'rgba(0, 191, 255, 0.3)'
    this.ctx.lineWidth = 2
    this.ctx.stroke()
  }

  private drawPlayer(): void {
    const { playerPos, playerRadius } = this.engine

    const glowGradient = this.ctx.createRadialGradient(
      playerPos.x, playerPos.y, 0,
      playerPos.x, playerPos.y, playerRadius * 3
    )
    glowGradient.addColorStop(0, 'rgba(255, 255, 255, 0.5)')
    glowGradient.addColorStop(1, 'rgba(255, 255, 255, 0)')

    this.ctx.beginPath()
    this.ctx.arc(playerPos.x, playerPos.y, playerRadius * 3, 0, Math.PI * 2)
    this.ctx.fillStyle = glowGradient
    this.ctx.fill()

    this.ctx.beginPath()
    this.ctx.arc(playerPos.x, playerPos.y, playerRadius, 0, Math.PI * 2)
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.fill()
  }

  private drawSonicPulses(): void {
    for (const pulse of this.engine.pulses) {
      this.drawPulseWavefront(pulse)
    }
  }

  private drawPulseWavefront(pulse: SonicPulse): void {
    const activeRays = pulse.rays.filter(r => r.active)
    if (activeRays.length < 2) return

    this.ctx.beginPath()
    this.ctx.moveTo(activeRays[0].x, activeRays[0].y)

    for (let i = 1; i < activeRays.length; i++) {
      const ray = activeRays[i]
      const prevRay = activeRays[i - 1]

      const dx = ray.x - prevRay.x
      const dy = ray.y - prevRay.y
      const dist = Math.sqrt(dx * dx + dy * dy)

      if (dist > 50) {
        this.ctx.strokeStyle = `rgba(0, 191, 255, ${0.6 * pulse.energy})`
        this.ctx.lineWidth = 3
        this.ctx.stroke()
        this.ctx.beginPath()
        this.ctx.moveTo(ray.x, ray.y)
      } else {
        this.ctx.lineTo(ray.x, ray.y)
      }
    }

    this.ctx.strokeStyle = `rgba(0, 191, 255, ${0.6 * pulse.energy})`
    this.ctx.lineWidth = 3
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
    this.ctx.stroke()

    const glowGradient = this.ctx.createRadialGradient(
      0, 0, 0,
      0, 0, 15
    )
    glowGradient.addColorStop(0, 'rgba(0, 191, 255, 0.8)')
    glowGradient.addColorStop(1, 'rgba(0, 191, 255, 0)')

    for (const ray of activeRays) {
      this.ctx.beginPath()
      this.ctx.arc(ray.x, ray.y, 2, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(0, 191, 255, ${0.8 * pulse.energy})`
      this.ctx.fill()
    }
  }

  private drawTargets(): void {
    for (const target of this.engine.targets) {
      if (target.visible || target.visibleTimer > 0) {
        this.drawTarget(target)
      }
    }
  }

  private drawTarget(target: Target): void {
    const alpha = Math.min(1, target.visibleTimer / 2)

    const gradient = this.ctx.createRadialGradient(
      target.x, target.y, 0,
      target.x, target.y, target.radius
    )
    gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`)
    gradient.addColorStop(1, `rgba(255, 140, 0, ${alpha})`)

    this.ctx.save()
    this.ctx.translate(target.x, target.y)

    this.ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 2
      const x = Math.cos(angle) * target.radius
      const y = Math.sin(angle) * target.radius
      if (i === 0) {
        this.ctx.moveTo(x, y)
      } else {
        this.ctx.lineTo(x, y)
      }
    }
    this.ctx.closePath()

    this.ctx.fillStyle = gradient
    this.ctx.fill()

    this.ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`
    this.ctx.lineWidth = 2
    this.ctx.stroke()

    const glowGradient = this.ctx.createRadialGradient(0, 0, 0, 0, 0, target.radius * 2)
    glowGradient.addColorStop(0, `rgba(255, 200, 0, ${alpha * 0.3})`)
    glowGradient.addColorStop(1, 'rgba(255, 200, 0, 0)')

    this.ctx.beginPath()
    this.ctx.arc(0, 0, target.radius * 2, 0, Math.PI * 2)
    this.ctx.fillStyle = glowGradient
    this.ctx.fill()

    this.ctx.restore()
  }

  private drawParticles(): void {
    for (const particle of this.engine.particles) {
      if (!particle.active) continue
      this.drawParticle(particle)
    }
  }

  private drawParticle(particle: Particle): void {
    const alpha = particle.life / particle.maxLife

    const gradient = this.ctx.createRadialGradient(
      particle.x, particle.y, 0,
      particle.x, particle.y, particle.size
    )
    gradient.addColorStop(0, particle.color)
    gradient.addColorStop(1, this.hexToRgba(particle.color, 0))

    this.ctx.globalAlpha = alpha
    this.ctx.beginPath()
    this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
    this.ctx.fillStyle = gradient
    this.ctx.fill()
    this.ctx.globalAlpha = 1
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  private drawRadarPoints(): void {
    for (const point of this.engine.radarPoints) {
      if (point.alpha <= 0) continue
      this.ctx.beginPath()
      this.ctx.arc(point.x, point.y, 1.5, 0, Math.PI * 2)
      this.ctx.fillStyle = `rgba(0, 191, 255, ${point.alpha * 0.3})`
      this.ctx.fill()
    }
  }

  private drawRipple(): void {
    const ripple = this.engine.ripple
    if (!ripple.active) return

    this.ctx.beginPath()
    this.ctx.arc(ripple.x, ripple.y, ripple.radius, 0, Math.PI * 2)
    this.ctx.strokeStyle = `rgba(0, 191, 255, ${ripple.alpha})`
    this.ctx.lineWidth = 2
    this.ctx.stroke()
  }

  private drawChargeIndicator(): void {
    if (!this.engine['isCharging']) return

    const progress = this.engine.getChargeProgress()
    const isReady = this.engine.isChargeReady()
    const dir = this.engine.getChargeDirection()
    const { playerPos, playerRadius } = this.engine

    const indicatorRadius = playerRadius + 10 + progress * 30

    const color = isReady ? '#00FF7F' : '#FFD700'

    this.ctx.beginPath()
    this.ctx.arc(playerPos.x, playerPos.y, indicatorRadius, 0, Math.PI * 2)
    this.ctx.strokeStyle = `${color}80`
    this.ctx.lineWidth = 2
    this.ctx.setLineDash([5, 5])
    this.ctx.stroke()
    this.ctx.setLineDash([])

    const arrowLength = 30 + progress * 20
    const arrowX = playerPos.x + dir.x * arrowLength
    const arrowY = playerPos.y + dir.y * arrowLength

    this.ctx.beginPath()
    this.ctx.moveTo(playerPos.x + dir.x * (playerRadius + 5), playerPos.y + dir.y * (playerRadius + 5))
    this.ctx.lineTo(arrowX, arrowY)
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 3
    this.ctx.lineCap = 'round'
    this.ctx.stroke()

    const headLen = 8
    const angle = Math.atan2(dir.y, dir.x)
    this.ctx.beginPath()
    this.ctx.moveTo(arrowX, arrowY)
    this.ctx.lineTo(
      arrowX - headLen * Math.cos(angle - Math.PI / 6),
      arrowY - headLen * Math.sin(angle - Math.PI / 6)
    )
    this.ctx.moveTo(arrowX, arrowY)
    this.ctx.lineTo(
      arrowX - headLen * Math.cos(angle + Math.PI / 6),
      arrowY - headLen * Math.sin(angle + Math.PI / 6)
    )
    this.ctx.strokeStyle = color
    this.ctx.lineWidth = 3
    this.ctx.stroke()
  }

  private drawHUD(): void {
    const state = this.engine.getState()
    const { width } = this.engine

    this.ctx.font = 'bold 24px "Courier New", monospace'
    this.ctx.textBaseline = 'top'

    this.ctx.fillStyle = '#00BFFF'
    this.ctx.textAlign = 'left'
    this.ctx.fillText(`SCORE: ${state.score}`, 30, 30)

    this.ctx.font = '14px "Courier New", monospace'
    this.ctx.fillStyle = 'rgba(0, 191, 255, 0.6)'
    this.ctx.fillText(`LEVEL ${state.level}`, 30, 60)

    this.ctx.font = 'bold 24px "Courier New", monospace'
    this.ctx.fillStyle = state.timeLeft < 10 ? '#FF6347' : '#00BFFF'
    this.ctx.textAlign = 'right'
    this.ctx.fillText(`TIME: ${Math.ceil(state.timeLeft)}s`, width - 30, 30)

    this.ctx.font = '14px "Courier New", monospace'
    this.ctx.fillStyle = 'rgba(0, 191, 255, 0.6)'
    this.ctx.fillText(`HITS: ${state.currentLevelHits}/${state.targetsNeeded}`, width - 30, 60)
  }

  private drawRadar(): void {
    const { width, height, arenaCenter, arenaRadius } = this.engine
    const radarRadius = 60
    const radarX = width / 2
    const radarY = height - 80
    const scale = radarRadius / arenaRadius

    this.ctx.beginPath()
    this.ctx.arc(radarX, radarY, radarRadius, 0, Math.PI * 2)
    this.ctx.fillStyle = 'rgba(0, 50, 80, 0.3)'
    this.ctx.fill()

    this.ctx.beginPath()
    this.ctx.arc(radarX, radarY, radarRadius, 0, Math.PI * 2)
    this.ctx.strokeStyle = 'rgba(0, 191, 255, 0.5)'
    this.ctx.lineWidth = 2
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.arc(radarX, radarY, radarRadius * 0.5, 0, Math.PI * 2)
    this.ctx.strokeStyle = 'rgba(0, 191, 255, 0.2)'
    this.ctx.lineWidth = 1
    this.ctx.stroke()

    this.ctx.beginPath()
    this.ctx.moveTo(radarX - radarRadius, radarY)
    this.ctx.lineTo(radarX + radarRadius, radarY)
    this.ctx.moveTo(radarX, radarY - radarRadius)
    this.ctx.lineTo(radarX, radarY + radarRadius)
    this.ctx.strokeStyle = 'rgba(0, 191, 255, 0.15)'
    this.ctx.lineWidth = 1
    this.ctx.stroke()

    const playerRadarX = radarX
    const playerRadarY = radarY
    this.ctx.beginPath()
    this.ctx.arc(playerRadarX, playerRadarY, 3, 0, Math.PI * 2)
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.fill()

    for (const point of this.engine.radarPoints) {
      const relX = (point.x - arenaCenter.x) * scale
      const relY = (point.y - arenaCenter.y) * scale
      const dist = Math.sqrt(relX * relX + relY * relY)

      if (dist <= radarRadius) {
        this.ctx.beginPath()
        this.ctx.arc(radarX + relX, radarY + relY, 1.5, 0, Math.PI * 2)
        this.ctx.fillStyle = `rgba(0, 191, 255, ${point.alpha * 0.8})`
        this.ctx.fill()
      }
    }

    for (const target of this.engine.targets) {
      if (!target.visible) continue
      const relX = (target.x - arenaCenter.x) * scale
      const relY = (target.y - arenaCenter.y) * scale
      const dist = Math.sqrt(relX * relX + relY * relY)

      if (dist <= radarRadius) {
        const alpha = Math.min(1, target.visibleTimer / 2)
        this.ctx.beginPath()
        this.ctx.arc(radarX + relX, radarY + relY, 4, 0, Math.PI * 2)
        this.ctx.fillStyle = `rgba(255, 200, 0, ${alpha})`
        this.ctx.fill()
      }
    }

    this.ctx.font = '12px "Courier New", monospace'
    this.ctx.fillStyle = 'rgba(0, 191, 255, 0.6)'
    this.ctx.textAlign = 'center'
    this.ctx.fillText('RADAR', radarX, radarY + radarRadius + 8)
  }

  public drawGameOver(score: number, level: number): void {
    const { width, height } = this.engine

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.85)'
    this.ctx.fillRect(0, 0, width, height)

    this.ctx.font = 'bold 48px "Courier New", monospace'
    this.ctx.fillStyle = '#00BFFF'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('GAME OVER', width / 2, height / 2 - 80)

    this.ctx.font = '24px "Courier New", monospace'
    this.ctx.fillStyle = '#FFFFFF'
    this.ctx.fillText(`Final Score: ${score}`, width / 2, height / 2 - 20)
    this.ctx.fillText(`Level Reached: ${level}`, width / 2, height / 2 + 20)
  }

  public drawStartScreen(): void {
    const { width, height } = this.engine

    this.ctx.fillStyle = '#000000'
    this.ctx.fillRect(0, 0, width, height)

    this.ctx.font = 'bold 56px "Courier New", monospace'
    this.ctx.fillStyle = '#00BFFF'
    this.ctx.textAlign = 'center'
    this.ctx.textBaseline = 'middle'
    this.ctx.fillText('ECHO ARENA', width / 2, height / 2 - 100)

    this.ctx.font = '18px "Courier New", monospace'
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
    this.ctx.fillText('Hold left mouse to charge, release to fire sonic pulse', width / 2, height / 2 - 30)
    this.ctx.fillText('Use reflections to hit hidden targets', width / 2, height / 2)
    this.ctx.fillText('Each hit = 50 points', width / 2, height / 2 + 30)

    this.ctx.font = 'bold 24px "Courier New", monospace'
    this.ctx.fillStyle = '#00FF7F'
    this.ctx.fillText('Click to Start', width / 2, height / 2 + 100)
  }
}
