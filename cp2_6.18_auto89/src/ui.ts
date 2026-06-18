import { ARENA_SIZE, ARENA_PADDING } from './entities'

export interface UIState {
  lives: number
  maxLives: number
  score: number
  combo: number
  comboCount: number
  maxCombo: number
  comboAnimTimer: number
  gameOver: boolean
  finalScore: number
  survivalTime: number
  finalMaxCombo: number
}

export function createUIState(): UIState {
  return {
    lives: 3,
    maxLives: 3,
    score: 0,
    combo: 1,
    comboCount: 0,
    maxCombo: 1,
    comboAnimTimer: 0,
    gameOver: false,
    finalScore: 0,
    survivalTime: 0,
    finalMaxCombo: 1,
  }
}

export function updateUI(ui: UIState, deltaTime: number): void {
  if (ui.comboAnimTimer > 0) {
    ui.comboAnimTimer -= deltaTime
  }
}

export function renderArenaBackground(
  ctx: CanvasRenderingContext2D,
  offsetX: number,
  offsetY: number,
  scale: number
): void {
  const bgGradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height)
  bgGradient.addColorStop(0, '#0F172A')
  bgGradient.addColorStop(1, '#1E3A5F')
  ctx.fillStyle = bgGradient
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)

  const x = offsetX + ARENA_PADDING * scale
  const y = offsetY + ARENA_PADDING * scale
  const size = ARENA_SIZE * scale

  ctx.save()

  ctx.shadowColor = 'rgba(99, 102, 241, 0.25)'
  ctx.shadowBlur = 30

  ctx.fillStyle = 'rgba(15, 23, 42, 0.85)'
  const radius = 12 * scale
  roundRect(ctx, x, y, size, size, radius)
  ctx.fill()

  ctx.restore()

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)'
  ctx.lineWidth = 2 * scale
  roundRect(ctx, x, y, size, size, radius)
  ctx.stroke()
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number,
  w: number, h: number,
  r: number
): void {
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

export function renderHUD(
  ctx: CanvasRenderingContext2D,
  ui: UIState,
  offsetX: number,
  offsetY: number,
  scale: number
): void {
  const padding = 16 * scale
  const arenaX = offsetX + ARENA_PADDING * scale
  const arenaY = offsetY + ARENA_PADDING * scale

  renderLives(ctx, ui.lives, ui.maxLives, arenaX + padding, arenaY + padding, scale)

  const scoreText = `${ui.score}`
  ctx.font = `bold ${24 * scale}px system-ui, -apple-system, sans-serif`
  ctx.fillStyle = '#ffffff'
  ctx.textBaseline = 'top'
  const scoreX = arenaX + padding
  const scoreY = arenaY + padding + 36 * scale
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 4
  ctx.fillText(scoreText, scoreX, scoreY)
  ctx.shadowBlur = 0

  renderCombo(ctx, ui.combo, ui.comboAnimTimer, arenaX + ARENA_SIZE * scale - padding, arenaY + padding, scale)
}

function renderLives(
  ctx: CanvasRenderingContext2D,
  lives: number,
  maxLives: number,
  x: number,
  y: number,
  scale: number
): void {
  const size = 22 * scale
  const gap = 6 * scale

  for (let i = 0; i < maxLives; i++) {
    const cx = x + (size + gap) * i + size / 2
    const cy = y + size / 2
    drawHeart(ctx, cx, cy, size * 0.5, i < lives)
  }
}

function drawHeart(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  size: number,
  filled: boolean
): void {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.beginPath()
  ctx.moveTo(0, size * 0.6)
  ctx.bezierCurveTo(size, size * 0.2, size, -size * 0.6, 0, -size * 0.2)
  ctx.bezierCurveTo(-size, -size * 0.6, -size, size * 0.2, 0, size * 0.6)
  ctx.closePath()

  if (filled) {
    const gradient = ctx.createLinearGradient(0, -size, 0, size)
    gradient.addColorStop(0, '#ff6b8a')
    gradient.addColorStop(1, '#ef4444')
    ctx.fillStyle = gradient
    ctx.shadowColor = 'rgba(239, 68, 68, 0.6)'
    ctx.shadowBlur = 6
    ctx.fill()
  } else {
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)'
    ctx.lineWidth = 2
    ctx.stroke()
  }
  ctx.restore()
}

function renderCombo(
  ctx: CanvasRenderingContext2D,
  combo: number,
  animTimer: number,
  x: number,
  y: number,
  scale: number
): void {
  const baseSize = 20 * scale
  let displayScale = 1
  if (animTimer > 0) {
    const t = animTimer / 0.25
    displayScale = 1 + 0.2 * Math.sin(t * Math.PI)
  }

  const fontSize = baseSize * displayScale
  ctx.font = `bold ${fontSize}px system-ui, -apple-system, sans-serif`
  ctx.fillStyle = '#facc15'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 4
  ctx.fillText(`${combo.toFixed(1)}x COMBO`, x, y)
  ctx.shadowBlur = 0
  ctx.textAlign = 'left'
}

export interface GameOverDOM {
  overlay: HTMLElement
  scoreEl: HTMLElement
  timeEl: HTMLElement
  comboEl: HTMLElement
  restartBtn: HTMLElement
}

export function getGameOverDOM(): GameOverDOM | null {
  const overlay = document.getElementById('game-over-overlay')
  const scoreEl = document.getElementById('final-score')
  const timeEl = document.getElementById('survival-time')
  const comboEl = document.getElementById('final-combo')
  const restartBtn = document.getElementById('restart-btn')

  if (!overlay || !scoreEl || !timeEl || !comboEl || !restartBtn) {
    return null
  }

  return { overlay, scoreEl, timeEl, comboEl, restartBtn }
}

export function showGameOverPanel(ui: UIState): void {
  const dom = getGameOverDOM()
  if (!dom) return

  dom.scoreEl.textContent = `${ui.finalScore}`
  dom.timeEl.textContent = `${ui.survivalTime.toFixed(1)} 秒`
  dom.comboEl.textContent = `${ui.finalMaxCombo.toFixed(1)}x`
  dom.overlay.classList.add('visible')
}

export function hideGameOverPanel(): void {
  const dom = getGameOverDOM()
  if (!dom) return
  dom.overlay.classList.remove('visible')
}
