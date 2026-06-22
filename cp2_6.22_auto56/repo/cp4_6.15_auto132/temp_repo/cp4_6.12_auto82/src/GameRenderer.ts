import type { GameState, Snake, Food } from './GameEngine'

const SEGMENT_SIZE = 6
const DEATH_FADE_DURATION = 2000
const BORDER_BLINK_PERIOD = 2000
const BORDER_COLOR = '#33ccff'

export class GameRenderer {
  private ctx: CanvasRenderingContext2D
  private minimapCtx: CanvasRenderingContext2D | null = null
  private stars: { x: number; y: number; size: number; brightness: number }[] = []

  constructor(canvas: HTMLCanvasElement, minimapCanvas?: HTMLCanvasElement) {
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('无法获取Canvas上下文')
    this.ctx = ctx
    if (minimapCanvas) {
      const mctx = minimapCanvas.getContext('2d')
      if (mctx) this.minimapCtx = mctx
    }
    this.generateStars()
  }

  private generateStars(): void {
    this.stars = []
    for (let i = 0; i < 120; i++) {
      this.stars.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        size: Math.random() * 1.5 + 0.5,
        brightness: Math.random() * 0.6 + 0.4,
      })
    }
  }

  render(state: GameState): void {
    const startTime = performance.now()
    this.drawBackground(state)
    this.drawBorder(state)
    this.drawFoods(state.foods)
    const sortedSnakes = [...state.snakes].sort((a, b) => {
      const aDead = a.isAlive ? 0 : 1
      const bDead = b.isAlive ? 0 : 1
      return aDead - bDead
    })
    for (const snake of sortedSnakes) {
      this.drawSnake(snake, state.tickCount)
    }
    if (this.minimapCtx) {
      this.drawMinimap(state)
    }
    const elapsed = performance.now() - startTime
    if (elapsed > 8) {
      console.warn(`渲染耗时: ${elapsed.toFixed(2)}ms`)
    }
  }

  private drawBackground(state: GameState): void {
    const ctx = this.ctx
    const w = state.mapWidth
    const h = state.mapHeight
    const gradient = ctx.createRadialGradient(w / 2, h / 2, 50, w / 2, h / 2, Math.max(w, h))
    gradient.addColorStop(0, '#0f172a')
    gradient.addColorStop(0.5, '#0b1120')
    gradient.addColorStop(1, '#020617')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    const tick = state.tickCount
    for (const star of this.stars) {
      const twinkle = Math.sin(tick * 0.02 + star.x) * 0.2 + 0.8
      ctx.fillStyle = `rgba(255, 255, 255, ${star.brightness * twinkle})`
      ctx.fillRect(star.x, star.y, star.size, star.size)
    }
  }

  private drawBorder(state: GameState): void {
    const ctx = this.ctx
    const w = state.mapWidth
    const h = state.mapHeight
    const time = performance.now()
    const phase = (time % BORDER_BLINK_PERIOD) / BORDER_BLINK_PERIOD
    const glow = (Math.sin(phase * Math.PI * 2) + 1) / 2
    const alpha = 0.5 + glow * 0.5

    ctx.save()
    ctx.shadowColor = BORDER_COLOR
    ctx.shadowBlur = 15 + glow * 15
    ctx.strokeStyle = BORDER_COLOR
    ctx.globalAlpha = alpha
    ctx.lineWidth = 3
    ctx.strokeRect(1.5, 1.5, w - 3, h - 3)
    ctx.restore()
  }

  private drawFoods(foods: Food[]): void {
    const ctx = this.ctx
    for (const food of foods) {
      if (food.type === 'normal') {
        ctx.save()
        ctx.shadowColor = '#66ff66'
        ctx.shadowBlur = 8
        ctx.fillStyle = '#66ff66'
        ctx.beginPath()
        ctx.arc(
          food.position.x + SEGMENT_SIZE / 2,
          food.position.y + SEGMENT_SIZE / 2,
          4,
          0,
          Math.PI * 2
        )
        ctx.fill()
        ctx.restore()
      } else {
        const cx = food.position.x + SEGMENT_SIZE / 2
        const cy = food.position.y + SEGMENT_SIZE / 2
        ctx.save()
        ctx.shadowColor = '#cc66ff'
        ctx.shadowBlur = 10
        ctx.fillStyle = '#cc66ff'
        ctx.beginPath()
        ctx.moveTo(cx, cy - 5)
        ctx.lineTo(cx + 5, cy)
        ctx.lineTo(cx, cy + 5)
        ctx.lineTo(cx - 5, cy)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      }
    }
  }

  private drawSnake(snake: Snake, tickCount: number): void {
    const ctx = this.ctx
    const now = performance.now()
    let alpha = 1
    let dimFactor = 1

    if (!snake.isAlive && snake.deathTime !== null) {
      const elapsed = now - snake.deathTime
      const progress = Math.min(1, elapsed / DEATH_FADE_DURATION)
      alpha = 1 - progress
      dimFactor = 0.4
    }

    if (alpha <= 0) return

    let shouldBlink = false
    if (snake.speedBoost) {
      shouldBlink = Math.floor(tickCount / 3) % 2 === 0
    }

    ctx.save()
    ctx.globalAlpha = alpha

    for (let i = snake.body.length - 1; i >= 0; i--) {
      const seg = snake.body[i]
      const isHead = i === 0
      let color = snake.color

      if (!snake.isAlive) {
        color = this.dimColor(color, dimFactor)
      }

      let draw = true
      if (snake.speedBoost && shouldBlink && i % 2 === 0) {
        draw = Math.floor(tickCount / 2) % 2 === 0
      }

      if (!draw) continue

      ctx.fillStyle = color
      if (isHead) {
        ctx.shadowColor = color
        ctx.shadowBlur = 10
      }

      const x = seg.x
      const y = seg.y
      const size = SEGMENT_SIZE
      const pad = isHead ? 0 : 0.5

      if (isHead) {
        ctx.beginPath()
        ctx.roundRect(x - pad, y - pad, size + pad * 2, size + pad * 2, 2)
        ctx.fill()
        this.drawEyes(snake, x, y)
      } else {
        ctx.fillRect(x - pad, y - pad, size + pad * 2, size + pad * 2)
      }
      ctx.shadowBlur = 0
    }

    ctx.restore()
  }

  private drawEyes(snake: Snake, headX: number, headY: number): void {
    const ctx = this.ctx
    const size = SEGMENT_SIZE
    let ex1 = 0, ey1 = 0, ex2 = 0, ey2 = 0
    const eyeSize = 1.2
    switch (snake.direction) {
      case 'up':
        ex1 = headX + 1.5; ey1 = headY + 1
        ex2 = headX + size - 2.5; ey2 = headY + 1
        break
      case 'down':
        ex1 = headX + 1.5; ey1 = headY + size - 2
        ex2 = headX + size - 2.5; ey2 = headY + size - 2
        break
      case 'left':
        ex1 = headX + 1; ey1 = headY + 1.5
        ex2 = headX + 1; ey2 = headY + size - 2.5
        break
      case 'right':
        ex1 = headX + size - 2; ey1 = headY + 1.5
        ex2 = headX + size - 2; ey2 = headY + size - 2.5
        break
    }
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(ex1 - 0.1, ey1 - 0.1, eyeSize + 0.2, eyeSize + 0.2)
    ctx.fillRect(ex2 - 0.1, ey2 - 0.1, eyeSize + 0.2, eyeSize + 0.2)
    ctx.fillStyle = '#000000'
    ctx.fillRect(ex1 + 0.3, ey1 + 0.3, 0.6, 0.6)
    ctx.fillRect(ex2 + 0.3, ey2 + 0.3, 0.6, 0.6)
  }

  private dimColor(hex: string, factor: number): string {
    const r = parseInt(hex.slice(1, 3), 16)
    const g = parseInt(hex.slice(3, 5), 16)
    const b = parseInt(hex.slice(5, 7), 16)
    const nr = Math.floor(r * factor)
    const ng = Math.floor(g * factor)
    const nb = Math.floor(b * factor)
    return `rgb(${nr},${ng},${nb})`
  }

  private drawMinimap(state: GameState): void {
    if (!this.minimapCtx) return
    const mctx = this.minimapCtx
    const mw = 200
    const mh = 150
    const scaleX = mw / state.mapWidth
    const scaleY = mh / state.mapHeight

    mctx.fillStyle = 'rgba(10, 15, 30, 0.95)'
    mctx.fillRect(0, 0, mw, mh)

    mctx.strokeStyle = 'rgba(51, 204, 255, 0.6)'
    mctx.lineWidth = 1
    mctx.strokeRect(0.5, 0.5, mw - 1, mh - 1)

    for (const food of state.foods) {
      const fx = food.position.x * scaleX
      const fy = food.position.y * scaleY
      if (food.type === 'normal') {
        mctx.fillStyle = '#66ff66'
        mctx.fillRect(fx - 1, fy - 1, 2, 2)
      } else {
        mctx.fillStyle = '#cc66ff'
        mctx.fillRect(fx - 1.5, fy - 1.5, 3, 3)
      }
    }

    for (const snake of state.snakes) {
      if (!snake.isAlive && snake.deathTime !== null) {
        const now = performance.now()
        if (now - snake.deathTime > DEATH_FADE_DURATION) continue
      }
      mctx.fillStyle = snake.color
      for (let i = 0; i < snake.body.length; i++) {
        const seg = snake.body[i]
        const sx = seg.x * scaleX
        const sy = seg.y * scaleY
        mctx.fillRect(sx, sy, 2, 2)
      }
    }
  }
}
