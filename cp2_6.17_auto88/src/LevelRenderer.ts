import type { GameState } from '@/types'

const CANVAS_W = 800
const CANVAS_H = 400

const NOISE_DOTS: { x: number; y: number; size: number }[] = []
for (let i = 0; i < 220; i++) {
  NOISE_DOTS.push({
    x: Math.floor(Math.random() * CANVAS_W),
    y: Math.floor(Math.random() * CANVAS_H),
    size: Math.random() < 0.75 ? 1 : 2,
  })
}

export class LevelRenderer {
  private ctx: CanvasRenderingContext2D
  private canvas: HTMLCanvasElement
  private hillOffset = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('Canvas 2D context unavailable')
    this.ctx = ctx
    ctx.imageSmoothingEnabled = false
  }

  resize(scale: number) {
    this.canvas.width = CANVAS_W * scale
    this.canvas.height = CANVAS_H * scale
    this.ctx.imageSmoothingEnabled = false
  }

  render(state: GameState, alpha: number) {
    const ctx = this.ctx
    const scale = this.canvas.width / CANVAS_W
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    ctx.scale(scale, scale)

    this.drawBackground(state.cameraX, state.time)

    ctx.save()
    ctx.translate(-state.cameraX * (1 - alpha) * 0, 0)
    const camX = state.cameraX
    ctx.save()
    ctx.translate(-camX, 0)

    for (const plat of state.platforms) {
      this.drawPlatform(plat.x, plat.y, plat.w, plat.h)
    }

    for (const spike of state.spikes) {
      this.drawSpike(spike.x, spike.y, spike.w, spike.h, spike.warnT ?? 0, state.time)
    }

    for (const coin of state.coins) {
      this.drawCoin(coin.x, coin.y, coin.r, state.time, coin.collected ?? false, coin.collectT ?? 0)
    }

    for (const t of state.player.trail) {
      this.drawPlayerRect(t.x, t.y, state.player.w, state.player.h, '#4A90D9', Math.max(0, t.alpha - 0.2), false)
    }

    const isDashing = state.player.dashT > 0
    const baseColor = isDashing ? '#E74C3C' : '#4A90D9'
    const baseAlpha = isDashing ? 0.55 : 1
    this.drawPlayerRect(state.player.x, state.player.y, state.player.w, state.player.h, baseColor, baseAlpha, true)

    for (const line of state.player.speedLines) {
      ctx.save()
      ctx.strokeStyle = '#FFFFFF'
      ctx.globalAlpha = 0.3
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(line.x, line.y)
      ctx.lineTo(line.x - line.len, line.y)
      ctx.stroke()
      ctx.restore()
    }

    for (const pa of state.particles) {
      ctx.save()
      ctx.globalAlpha = pa.alpha
      ctx.fillStyle = pa.color
      ctx.fillRect(pa.x, pa.y, pa.size, pa.size)
      ctx.restore()
    }

    this.drawDashIndicator(
      state.player.x + state.player.w / 2,
      state.player.y + state.player.h + 5,
      state.dashIndicator,
    )

    ctx.restore()

    this.drawScore(state.score, state.time)

    if (state.status === 'START') this.drawStart(state.time)
    if (state.status === 'GAMEOVER') this.drawGameOver(state.score)

    if (state.deathFlash > 0) {
      ctx.save()
      ctx.globalAlpha = Math.min(1, state.deathFlash / 0.3)
      ctx.fillStyle = '#E74C3C'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
      ctx.restore()
    }

    ctx.restore()
    void alpha
  }

  private drawBackground(cameraX: number, time: number) {
    const ctx = this.ctx
    ctx.fillStyle = '#E8E8E8'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

    ctx.fillStyle = '#A8A8A8'
    for (const d of NOISE_DOTS) {
      const sx = ((d.x - cameraX * 0.15) % CANVAS_W + CANVAS_W) % CANVAS_W
      ctx.fillRect(sx, d.y, d.size, d.size)
    }

    this.hillOffset = (time * 12) % CANVAS_W
    ctx.save()
    ctx.globalAlpha = 0.65
    ctx.fillStyle = '#B0B8BC'
    const hills = [
      { base: 310, amp: 40, freq: 0.006, offset: 0 },
      { base: 330, amp: 30, freq: 0.01, offset: 150 },
    ]
    for (const h of hills) {
      ctx.beginPath()
      ctx.moveTo(0, CANVAS_H)
      for (let x = 0; x <= CANVAS_W; x += 4) {
        const wx = x + cameraX * 0.3 + this.hillOffset + h.offset
        const y = h.base + Math.sin(wx * h.freq) * h.amp + Math.sin(wx * h.freq * 2.3) * (h.amp * 0.3)
        ctx.lineTo(x, y)
      }
      ctx.lineTo(CANVAS_W, CANVAS_H)
      ctx.closePath()
      ctx.fill()
    }
    ctx.restore()

    ctx.fillStyle = '#C8CDD0'
    ctx.fillRect(0, 0, CANVAS_W, 2)
    ctx.fillRect(0, CANVAS_H - 2, CANVAS_W, 2)
  }

  private drawPlatform(x: number, y: number, w: number, h: number) {
    const ctx = this.ctx
    ctx.fillStyle = '#2D5A3D'
    ctx.fillRect(x + 2, y + 2, w, h)
    ctx.fillStyle = '#3A6848'
    ctx.fillRect(x + 1, y + 1, w, h)
    ctx.fillStyle = '#4A7C59'
    ctx.fillRect(x, y, w, h)
    ctx.strokeStyle = '#2D5A3D'
    ctx.lineWidth = 1
    ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)
    ctx.fillStyle = '#3F6B4B'
    for (let i = 0; i < w; i += 12) {
      ctx.fillRect(x + i, y + h - 4, 6, 2)
    }
    ctx.fillStyle = 'rgba(45, 90, 61, 0.55)'
    ctx.fillRect(x, y + h, w, 2)
    ctx.fillRect(x + w, y, 2, h)
  }

  private drawSpike(x: number, y: number, w: number, h: number, warnT: number, time: number) {
    const ctx = this.ctx
    if (warnT > 0) {
      const blink = Math.sin(time * 20) > 0 ? 1 : 0.25
      ctx.save()
      ctx.globalAlpha = blink
      ctx.fillStyle = '#E74C3C'
      ctx.fillRect(x - 2, y - 2, w + 4, h + 4)
      ctx.restore()
    }
    ctx.fillStyle = '#E74C3C'
    ctx.beginPath()
    const count = Math.max(1, Math.floor(w / 10))
    const unitW = w / count
    for (let i = 0; i < count; i++) {
      const sx = x + i * unitW
      ctx.moveTo(sx, y + h)
      ctx.lineTo(sx + unitW / 2, y)
      ctx.lineTo(sx + unitW, y + h)
    }
    ctx.closePath()
    ctx.fill()
    ctx.strokeStyle = '#000000'
    ctx.lineWidth = 1
    ctx.stroke()
  }

  private drawCoin(cx: number, cy: number, r: number, time: number, collected: boolean, collectT: number) {
    const ctx = this.ctx
    const t = (time % 1.5) / 1.5
    const scaleX = Math.cos(t * Math.PI * 2)
    const absX = Math.abs(scaleX)
    let finalR = r
    let alpha = 1
    if (collected) {
      const k = 1 - Math.max(0, collectT) / 0.2
      finalR = r * (1 + k * 0.5)
      alpha = 1 - k
    }
    ctx.save()
    ctx.globalAlpha = alpha
    ctx.translate(cx, cy)

    const glowR = finalR + 4
    const glow = ctx.createRadialGradient(0, 0, finalR * 0.5, 0, 0, glowR)
    glow.addColorStop(0, 'rgba(255, 215, 0, 0.55)')
    glow.addColorStop(1, 'rgba(255, 215, 0, 0)')
    ctx.fillStyle = glow
    ctx.beginPath()
    ctx.arc(0, 0, glowR, 0, Math.PI * 2)
    ctx.fill()

    ctx.scale(Math.max(0.2, absX), 1)
    ctx.fillStyle = '#FFD700'
    ctx.beginPath()
    ctx.arc(0, 0, finalR, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#B8860B'
    ctx.lineWidth = 1
    ctx.stroke()
    ctx.fillStyle = '#FFEB70'
    ctx.beginPath()
    ctx.arc(-finalR * 0.25, -finalR * 0.25, finalR * 0.25, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  private drawPlayerRect(
    x: number,
    y: number,
    w: number,
    h: number,
    color: string,
    alpha: number,
    stroke: boolean,
  ) {
    const ctx = this.ctx
    ctx.save()
    ctx.globalAlpha = alpha
    const isDash = color === '#E74C3C'
    const borderColor = isDash ? '#922B21' : '#1F4E79'
    const shadowColor = isDash ? 'rgba(146, 43, 33, 0.6)' : 'rgba(31, 78, 121, 0.6)'

    ctx.fillStyle = shadowColor
    ctx.fillRect(x + 2, y + 2, w, h)
    ctx.fillStyle = color
    ctx.fillRect(x, y, w, h)

    if (stroke) {
      ctx.strokeStyle = borderColor
      ctx.lineWidth = 1
      ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1)

      ctx.fillStyle = shadowColor
      ctx.fillRect(x + w, y, 2, h + 2)
      ctx.fillRect(x, y + h, w + 2, 2)

      ctx.fillStyle = isDash ? '#FADBD8' : '#FFFFFF'
      ctx.fillRect(x + 5, y + 6, 3, 3)
      ctx.fillRect(x + w - 8, y + 6, 3, 3)

      ctx.fillStyle = borderColor
      ctx.fillRect(x + 5, y + 8, 3, 1)
      ctx.fillRect(x + w - 8, y + 8, 3, 1)
    }
    ctx.restore()
  }

  private drawDashIndicator(cx: number, bottomY: number, indicator: { cooldown: number; maxCooldown: number; showT: number }) {
    const ctx = this.ctx
    const size = 16
    const r = size / 2
    const x = cx - r
    const y = bottomY
    const showProgress = indicator.cooldown > 0 || indicator.showT > 0
    if (!showProgress) return
    ctx.save()
    ctx.translate(x + r, y + r)
    ctx.strokeStyle = 'rgba(255,255,255,0.25)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, r - 1, 0, Math.PI * 2)
    ctx.stroke()

    const progress = indicator.cooldown > 0 ? 1 - indicator.cooldown / indicator.maxCooldown : 1
    ctx.strokeStyle = '#FFFFFF'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.arc(0, 0, r - 1, -Math.PI / 2, -Math.PI / 2 + progress * Math.PI * 2)
    ctx.stroke()
    ctx.restore()
  }

  private drawScore(score: number, time: number) {
    const ctx = this.ctx
    const text = String(score)
    ctx.save()
    ctx.font = 'bold 24px "Courier New", monospace'
    ctx.textAlign = 'right'
    ctx.textBaseline = 'top'
    ctx.fillStyle = 'rgba(255,255,255,0.15)'
    for (let i = 4; i >= 1; i--) {
      ctx.fillText(text, CANVAS_W - 20 + i * 0.8, 16 + i * 0.8)
    }
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillText(text, CANVAS_W - 19, 17)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(text, CANVAS_W - 20, 16)
    ctx.restore()
    void time
  }

  private drawStart(time: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.55)'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    const title = 'PixelDash'
    ctx.font = 'bold 48px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#000000'
    for (let i = 4; i >= 1; i--) {
      ctx.fillText(title, CANVAS_W / 2 + i, CANVAS_H / 2 - 40 + i)
    }
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(title, CANVAS_W / 2, CANVAS_H / 2 - 40)

    const blink = Math.sin(time * Math.PI * 2 / 1) > 0
    if (blink) {
      ctx.font = 'bold 20px "Courier New", monospace'
      ctx.fillStyle = '#FFFFFF'
      ctx.fillText('按空格开始', CANVAS_W / 2, CANVAS_H / 2 + 20)
    }
    ctx.restore()
  }

  private drawGameOver(score: number) {
    const ctx = this.ctx
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.6)'
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)
    ctx.font = 'bold 40px "Courier New", monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillStyle = '#000000'
    ctx.fillText('游戏结束', CANVAS_W / 2 + 2, CANVAS_H / 2 - 30 + 2)
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('游戏结束', CANVAS_W / 2, CANVAS_H / 2 - 30)
    ctx.font = 'bold 24px "Courier New", monospace'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText(`最终得分: ${score}`, CANVAS_W / 2, CANVAS_H / 2 + 20)
    ctx.font = 'bold 18px "Courier New", monospace'
    ctx.fillStyle = '#FFFFFF'
    ctx.fillText('按 R 键重新开始', CANVAS_W / 2, CANVAS_H / 2 + 60)
    ctx.restore()
  }
}
