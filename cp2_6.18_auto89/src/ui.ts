import { ARENA_SIZE, ARENA_PADDING } from './entities'

export interface UIState {
  lives: number
  maxLives: number
  score: number
  combo: number
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

export function renderGameOverPanel(
  ctx: CanvasRenderingContext2D,
  ui: UIState,
  canvasWidth: number,
  canvasHeight: number,
  scale: number
): { button: { x: number; y: number; w: number; h: number } } {
  ctx.save()
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  const cardW = 360 * scale
  const cardH = 320 * scale
  const cardX = (canvasWidth - cardW) / 2
  const cardY = (canvasHeight - cardH) / 2
  const cardRadius = 16 * scale
  const cardPadding = 32 * scale

  ctx.shadowColor = 'rgba(0, 0, 0, 0.5)'
  ctx.shadowBlur = 20 * scale
  ctx.fillStyle = '#1E293B'
  roundRect(ctx, cardX, cardY, cardW, cardH, cardRadius)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)'
  ctx.lineWidth = 1 * scale
  roundRect(ctx, cardX, cardY, cardW, cardH, cardRadius)
  ctx.stroke()

  const contentX = cardX + cardPadding
  const contentY = cardY + cardPadding
  const contentW = cardW - cardPadding * 2

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${28 * scale}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'top'
  ctx.fillText('游戏结束', contentX + contentW / 2, contentY)

  const statY = contentY + 60 * scale
  const statGap = 42 * scale

  ctx.font = `${16 * scale}px system-ui, -apple-system, sans-serif`
  ctx.fillStyle = '#94a3b8'

  ctx.textAlign = 'left'
  ctx.fillText('最终得分', contentX, statY)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${20 * scale}px system-ui, -apple-system, sans-serif`
  ctx.fillText(`${ui.finalScore}`, contentX + contentW, statY)

  ctx.font = `${16 * scale}px system-ui, -apple-system, sans-serif`
  ctx.fillStyle = '#94a3b8'
  ctx.textAlign = 'left'
  ctx.fillText('存活时间', contentX, statY + statGap)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${20 * scale}px system-ui, -apple-system, sans-serif`
  ctx.fillText(`${ui.survivalTime.toFixed(1)} 秒`, contentX + contentW, statY + statGap)

  ctx.font = `${16 * scale}px system-ui, -apple-system, sans-serif`
  ctx.fillStyle = '#94a3b8'
  ctx.textAlign = 'left'
  ctx.fillText('最高连击', contentX, statY + statGap * 2)
  ctx.textAlign = 'right'
  ctx.fillStyle = '#facc15'
  ctx.font = `bold ${20 * scale}px system-ui, -apple-system, sans-serif`
  ctx.fillText(`${ui.finalMaxCombo.toFixed(1)}x`, contentX + contentW, statY + statGap * 2)

  const btnW = contentW
  const btnH = 50 * scale
  const btnX = contentX
  const btnY = cardY + cardH - cardPadding - btnH

  const btnGradient = ctx.createLinearGradient(btnX, btnY, btnX, btnY + btnH)
  btnGradient.addColorStop(0, '#6366F1')
  btnGradient.addColorStop(1, '#8B5CF6')
  ctx.fillStyle = btnGradient
  ctx.shadowColor = 'rgba(99, 102, 241, 0.4)'
  ctx.shadowBlur = 10 * scale
  roundRect(ctx, btnX, btnY, btnW, btnH, 10 * scale)
  ctx.fill()
  ctx.shadowBlur = 0

  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${18 * scale}px system-ui, -apple-system, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('重新开始', btnX + btnW / 2, btnY + btnH / 2)

  ctx.restore()

  return {
    button: { x: btnX, y: btnY, w: btnW, h: btnH }
  }
}
