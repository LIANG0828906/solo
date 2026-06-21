import { GameState, NoteBlock, Particle, TrailPoint, NoteColor, SlashDirection } from './GameEngine'
import { audioManager } from './AudioManager'

const COLOR_MAP: Record<NoteColor, string> = {
  red: '#ff4466',
  blue: '#4488ff',
  green: '#44ff88',
  yellow: '#ffdd44',
}

const DIRECTION_ARROWS: Record<SlashDirection, string> = {
  up: '↑',
  down: '↓',
  left: '←',
  right: '→',
}

interface Star {
  x: number
  y: number
  size: number
  brightness: number
  twinkleSpeed: number
  twinklePhase: number
}

class Renderer {
  private ctx: CanvasRenderingContext2D | null = null
  private stars: Star[] = []
  private time: number = 0
  private width: number = 0
  private height: number = 0

  init(canvas: HTMLCanvasElement) {
    const dpr = window.devicePixelRatio || 1
    this.width = window.innerWidth
    this.height = window.innerHeight
    canvas.width = this.width * dpr
    canvas.height = this.height * dpr
    canvas.style.width = this.width + 'px'
    canvas.style.height = this.height + 'px'
    
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      this.ctx = ctx
    }
    
    this.initStars()
  }

  private initStars() {
    this.stars = []
    const starCount = Math.floor((this.width * this.height) / 4000)
    for (let i = 0; i < starCount; i++) {
      this.stars.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: Math.random() * 2 + 0.5,
        brightness: Math.random() * 0.5 + 0.5,
        twinkleSpeed: Math.random() * 2 + 1,
        twinklePhase: Math.random() * Math.PI * 2,
      })
    }
  }

  resize() {
    this.width = window.innerWidth
    this.height = window.innerHeight
    this.initStars()
  }

  render(state: GameState) {
    if (!this.ctx) return
    
    this.time += 1 / 60
    const ctx = this.ctx
    const cx = this.width / 2
    const cy = this.height / 2
    const orbitRadius = state.orbitRadius
    const currentTime = audioManager.getCurrentTime()

    this.drawBackground(ctx)
    this.drawStars(ctx)
    this.drawOrbit(ctx, cx, cy, orbitRadius)
    this.drawCenterZone(ctx, cx, cy, state.hitZoneRadius)
    
    for (const note of state.notes) {
      this.drawNote(ctx, note, cx, cy, orbitRadius, currentTime)
    }
    
    this.drawParticles(ctx, state.particles)
    this.drawTrail(ctx, state.trail)
  }

  private drawBackground(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, Math.max(this.width, this.height) / 1.2
    )
    gradient.addColorStop(0, '#0f0a2a')
    gradient.addColorStop(0.5, '#0a0a1a')
    gradient.addColorStop(1, '#050510')
    
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, this.width, this.height)
  }

  private drawStars(ctx: CanvasRenderingContext2D) {
    for (const star of this.stars) {
      const twinkle = Math.sin(this.time * star.twinkleSpeed + star.twinklePhase) * 0.3 + 0.7
      const alpha = star.brightness * twinkle
      
      ctx.beginPath()
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(200, 200, 255, ${alpha})`
      ctx.fill()
      
      if (star.size > 1.5) {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size * 2, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(180, 180, 255, ${alpha * 0.2})`
        ctx.fill()
      }
    }
  }

  private drawOrbit(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
    const ringWidth = 20
    const pulse = Math.sin(this.time * 2) * 0.15 + 0.85

    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius + ringWidth / 2, 0, Math.PI * 2)
    ctx.arc(cx, cy, radius - ringWidth / 2, 0, Math.PI * 2, true)
    ctx.closePath()
    
    const gradient = ctx.createRadialGradient(cx, cy, radius - ringWidth, cx, cy, radius + ringWidth)
    gradient.addColorStop(0, 'rgba(136, 102, 255, 0)')
    gradient.addColorStop(0.3, `rgba(136, 102, 255, ${0.3 * pulse})`)
    gradient.addColorStop(0.5, `rgba(136, 102, 255, ${0.7 * pulse})`)
    gradient.addColorStop(0.7, `rgba(136, 102, 255, ${0.3 * pulse})`)
    gradient.addColorStop(1, 'rgba(136, 102, 255, 0)')
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(136, 102, 255, ${pulse})`
    ctx.lineWidth = 2
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(cx, cy, radius, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(136, 102, 255, ${0.3 * pulse})`
    ctx.lineWidth = 8
    ctx.stroke()

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 + this.time * 0.3
      const x = cx + Math.cos(angle) * radius
      const y = cy + Math.sin(angle) * radius
      const dotPulse = Math.sin(this.time * 3 + i) * 0.3 + 0.7
      
      ctx.beginPath()
      ctx.arc(x, y, 4 * dotPulse, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(200, 180, 255, ${dotPulse})`
      ctx.fill()
    }

    ctx.restore()
  }

  private drawCenterZone(ctx: CanvasRenderingContext2D, cx: number, cy: number, radius: number) {
    const pulse = Math.sin(this.time * 3) * 0.1 + 0.9

    ctx.save()
    ctx.beginPath()
    ctx.arc(cx, cy, radius * 1.2, 0, Math.PI * 2)
    const glowGradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius * 1.2)
    glowGradient.addColorStop(0, 'rgba(136, 102, 255, 0.1)')
    glowGradient.addColorStop(1, 'rgba(136, 102, 255, 0)')
    ctx.fillStyle = glowGradient
    ctx.fill()

    ctx.beginPath()
    ctx.arc(cx, cy, radius * pulse, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(136, 102, 255, 0.4)'
    ctx.lineWidth = 1.5
    ctx.setLineDash([5, 5])
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }

  private drawNote(ctx: CanvasRenderingContext2D, note: NoteBlock, cx: number, cy: number, orbitRadius: number, currentTime: number) {
    const progress = 1 - (note.beatTime - currentTime) / 2.5
    const clampedProgress = Math.max(0, Math.min(1.1, progress))
    const noteRadius = orbitRadius * (1 - clampedProgress)
    
    const x = cx + Math.cos(note.angle) * noteRadius
    const y = cy + Math.sin(note.angle) * noteRadius
    
    const size = 36
    const color = COLOR_MAP[note.color]

    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(this.time * 2 + note.id)

    let scale = 1
    let alpha = 1

    if (note.hit) {
      const hitAnimTime = (note as any).hitAnimTime
      const elapsed = (performance.now() - hitAnimTime) / 300
      scale = 1 + elapsed * 1.5
      alpha = 1 - elapsed
    } else if (note.missed) {
      const missAnimTime = (note as any).missAnimTime
      const elapsed = (performance.now() - missAnimTime) / 500
      scale = 1 + elapsed * 0.5
      alpha = 1 - elapsed
      ctx.rotate(elapsed * 2)
    }

    ctx.scale(scale, scale)
    ctx.globalAlpha = alpha

    const glowSize = size * 0.6
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, glowSize)
    glow.addColorStop(0, this.hexToRgba(color, 0.6))
    glow.addColorStop(0.5, this.hexToRgba(color, 0.2))
    glow.addColorStop(1, this.hexToRgba(color, 0))
    ctx.fillStyle = glow
    ctx.fillRect(-glowSize, -glowSize, glowSize * 2, glowSize * 2)

    ctx.fillStyle = color
    ctx.strokeStyle = this.hexToRgba(color, 0.9)
    ctx.lineWidth = 2
    
    const half = size / 2
    ctx.beginPath()
    ctx.moveTo(-half, -half * 0.7)
    ctx.lineTo(-half * 0.7, -half)
    ctx.lineTo(half * 0.7, -half)
    ctx.lineTo(half, -half * 0.7)
    ctx.lineTo(half, half * 0.7)
    ctx.lineTo(half * 0.7, half)
    ctx.lineTo(-half * 0.7, half)
    ctx.lineTo(-half, half * 0.7)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()

    const innerGradient = ctx.createLinearGradient(-half, -half, half, half)
    innerGradient.addColorStop(0, 'rgba(255, 255, 255, 0.3)')
    innerGradient.addColorStop(0.5, 'rgba(255, 255, 255, 0.05)')
    innerGradient.addColorStop(1, 'rgba(0, 0, 0, 0.2)')
    ctx.fillStyle = innerGradient
    ctx.fill()

    ctx.rotate(-(this.time * 2 + note.id))
    ctx.fillStyle = '#ffffff'
    ctx.font = 'bold 22px Arial'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(DIRECTION_ARROWS[note.direction], 0, 1)

    ctx.restore()
  }

  private drawParticles(ctx: CanvasRenderingContext2D, particles: Particle[]) {
    for (const p of particles) {
      const alpha = p.life / p.maxLife
      const size = p.size * (0.5 + alpha * 0.5)
      
      ctx.save()
      ctx.globalAlpha = alpha
      
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2)
      glow.addColorStop(0, this.hexToRgba(p.color, 0.8))
      glow.addColorStop(1, this.hexToRgba(p.color, 0))
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2)
      ctx.fill()
      
      ctx.beginPath()
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.fill()
      
      ctx.restore()
    }
  }

  private drawTrail(ctx: CanvasRenderingContext2D, trail: TrailPoint[]) {
    if (trail.length < 2) return

    const now = performance.now()

    for (let i = 1; i < trail.length; i++) {
      const prev = trail[i - 1]
      const curr = trail[i]
      const age = (now - prev.time) / 200
      const alpha = 1 - age
      
      if (alpha <= 0) continue

      ctx.save()
      ctx.strokeStyle = `rgba(200, 180, 255, ${alpha * 0.9})`
      ctx.lineWidth = 6 * alpha
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.shadowColor = 'rgba(136, 102, 255, 0.8)'
      ctx.shadowBlur = 15 * alpha
      ctx.beginPath()
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(curr.x, curr.y)
      ctx.stroke()
      ctx.restore()

      ctx.save()
      ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.6})`
      ctx.lineWidth = 2 * alpha
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(prev.x, prev.y)
      ctx.lineTo(curr.x, curr.y)
      ctx.stroke()
      ctx.restore()
    }
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }
}

export const renderer = new Renderer()
