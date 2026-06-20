import type { GameState, Star, Bullet, Minion, BossPhase } from './store'
import { getStateLabel, getStateColor } from './BossAI'

export function render(ctx: CanvasRenderingContext2D, state: GameState, now: number) {
  const { gameWidth, gameHeight } = state

  ctx.clearRect(0, 0, gameWidth, gameHeight)

  drawBackground(ctx, gameWidth, gameHeight)
  drawStars(ctx, state.stars, now)
  drawBullets(ctx, state.bullets)
  drawMinions(ctx, state.minions)
  drawBoss(ctx, state, now)
  drawFireGlow(ctx, state, now)
  drawPlayer(ctx, state, now)
  drawShield(ctx, state, now)
  drawStateBar(ctx, state, now)
  drawScore(ctx, state)
  drawFPS(ctx, state)
  drawLives(ctx, state)
  drawMinimap(ctx, state)
  drawScreenFlash(ctx, state, now, gameWidth, gameHeight)
}

function drawBackground(ctx: CanvasRenderingContext2D, w: number, h: number) {
  const gradient = ctx.createLinearGradient(0, 0, 0, h)
  gradient.addColorStop(0, '#0B0C10')
  gradient.addColorStop(1, '#1F2833')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, w, h)
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], now: number) {
  for (const star of stars) {
    const time = (now / 1000 + star.twinkleOffset) % star.twinkleDuration
    const alpha = 0.3 + 0.7 * Math.abs(Math.sin((time / star.twinkleDuration) * Math.PI))
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawBullets(ctx: CanvasRenderingContext2D, bullets: Bullet[]) {
  ctx.fillStyle = '#FF4444'
  for (const bullet of bullets) {
    ctx.beginPath()
    ctx.arc(bullet.x, bullet.y, 6, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = 'rgba(255, 68, 68, 0.3)'
    ctx.beginPath()
    ctx.arc(bullet.x, bullet.y, 10, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#FF4444'
  }
}

function drawMinions(ctx: CanvasRenderingContext2D, minions: Minion[]) {
  ctx.fillStyle = '#8844AA'
  for (const minion of minions) {
    const size = 20
    ctx.fillRect(minion.x - size / 2, minion.y - size / 2, size, size)

    ctx.strokeStyle = 'rgba(136, 68, 170, 0.5)'
    ctx.lineWidth = 2
    ctx.strokeRect(minion.x - size / 2 - 3, minion.y - size / 2 - 3, size + 6, size + 6)
  }
}

function drawBoss(ctx: CanvasRenderingContext2D, state: GameState, now: number) {
  const { bossX, bossY, bossPhase, chargeStartTime } = state

  let glowIntensity = 0.3
  if (bossPhase === 'charge') {
    const chargeProgress = Math.min(1, (now - chargeStartTime) / 1000)
    glowIntensity = 0.3 + chargeProgress * 0.7
  }

  const gradient = ctx.createRadialGradient(bossX, bossY, 10, bossX, bossY, 60)
  gradient.addColorStop(0, `rgba(255, 68, 68, ${glowIntensity})`)
  gradient.addColorStop(1, 'rgba(255, 68, 68, 0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(bossX, bossY, 60, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#E74C3C'
  ctx.beginPath()
  ctx.arc(bossX, bossY, 30, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#C0392B'
  ctx.beginPath()
  ctx.arc(bossX, bossY, 20, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(bossX - 8, bossY - 5, 5, 0, Math.PI * 2)
  ctx.arc(bossX + 8, bossY - 5, 5, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#000000'
  ctx.beginPath()
  ctx.arc(bossX - 8, bossY - 5, 2.5, 0, Math.PI * 2)
  ctx.arc(bossX + 8, bossY - 5, 2.5, 0, Math.PI * 2)
  ctx.fill()

  if (bossPhase === 'charge') {
    const rings = 3
    for (let i = 0; i < rings; i++) {
      const progress = ((now / 1000 + i * 0.3) % 1)
      const radius = 30 + progress * 30
      const alpha = (1 - progress) * 0.8
      ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(bossX, bossY, radius, 0, Math.PI * 2)
      ctx.stroke()
    }
  }
}

function drawFireGlow(ctx: CanvasRenderingContext2D, state: GameState, now: number) {
  const { bossX, bossY, lastFireTime } = state
  if (!lastFireTime) return

  const elapsed = now - lastFireTime
  const duration = 150
  if (elapsed > duration) return

  const progress = elapsed / duration
  const radius = 30 + progress * 50
  const alpha = (1 - progress) * 0.8

  const gradient = ctx.createRadialGradient(bossX, bossY, 20, bossX, bossY, radius)
  gradient.addColorStop(0, `rgba(255, 68, 68, 0)`)
  gradient.addColorStop(0.5, `rgba(255, 68, 68, ${alpha * 0.5})`)
  gradient.addColorStop(1, `rgba(255, 68, 68, 0)`)

  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(bossX, bossY, radius, 0, Math.PI * 2)
  ctx.fill()
}

function drawPlayer(ctx: CanvasRenderingContext2D, state: GameState, now: number) {
  const { playerX, playerY } = state

  ctx.save()
  ctx.translate(playerX, playerY)

  const engineGlow = ctx.createRadialGradient(0, 18, 2, 0, 18, 15)
  engineGlow.addColorStop(0, 'rgba(68, 255, 68, 0.8)')
  engineGlow.addColorStop(1, 'rgba(68, 255, 68, 0)')
  ctx.fillStyle = engineGlow
  ctx.beginPath()
  ctx.arc(0, 18, 15, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#44FF44'
  ctx.beginPath()
  ctx.moveTo(0, -18)
  ctx.lineTo(15, 18)
  ctx.lineTo(0, 10)
  ctx.lineTo(-15, 18)
  ctx.closePath()
  ctx.fill()

  ctx.fillStyle = '#2ECC71'
  ctx.beginPath()
  ctx.moveTo(0, -10)
  ctx.lineTo(8, 10)
  ctx.lineTo(0, 5)
  ctx.lineTo(-8, 10)
  ctx.closePath()
  ctx.fill()

  ctx.restore()
}

function drawShield(ctx: CanvasRenderingContext2D, state: GameState, now: number) {
  const { shield, playerX, playerY } = state
  if (!shield.active) return

  const elapsed = now - shield.startTime
  const progress = elapsed / shield.duration
  const alpha = progress < 0.8 ? 1 : (1 - progress) / 0.2
  const rotation = (now / 500) * Math.PI * 2

  ctx.save()
  ctx.translate(playerX, playerY)
  ctx.rotate(rotation)

  ctx.strokeStyle = `rgba(68, 255, 68, ${alpha})`
  ctx.lineWidth = 2

  const sides = 6
  const radius = 60
  ctx.beginPath()
  for (let i = 0; i < sides; i++) {
    const angle = (i / sides) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) {
      ctx.moveTo(x, y)
    } else {
      ctx.lineTo(x, y)
    }
  }
  ctx.closePath()
  ctx.stroke()

  const gradient = ctx.createRadialGradient(0, 0, 40, 0, 0, 60)
  gradient.addColorStop(0, 'rgba(68, 255, 68, 0)')
  gradient.addColorStop(1, `rgba(68, 255, 68, ${alpha * 0.2})`)
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(0, 0, 60, 0, Math.PI * 2)
  ctx.fill()

  ctx.restore()
}

function drawStateBar(ctx: CanvasRenderingContext2D, state: GameState, now: number) {
  const { gameWidth, bossPhase, stateBarProgress } = state
  const barWidth = gameWidth * 0.6
  const barHeight = 30
  const barX = (gameWidth - barWidth) / 2
  const barY = 15

  ctx.fillStyle = 'rgba(11, 12, 16, 0.7)'
  ctx.strokeStyle = '#45A29E'
  ctx.lineWidth = 1
  roundRect(ctx, barX, barY, barWidth, barHeight, 8)
  ctx.fill()
  ctx.stroke()

  const progressWidth = barWidth * stateBarProgress
  const gradient = ctx.createLinearGradient(barX, 0, barX + barWidth, 0)
  gradient.addColorStop(0, '#E74C3C')
  gradient.addColorStop(1, '#2ECC71')
  ctx.fillStyle = gradient
  roundRect(ctx, barX + 2, barY + 2, Math.max(0, progressWidth - 4), barHeight - 4, 6)
  ctx.fill()

  const label = getStateLabel(bossPhase)
  const color = getStateColor(bossPhase)

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 14px "Segoe UI", sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0, 0, 0, 0.8)'
  ctx.shadowBlur = 4
  ctx.fillText(`BOSS状态: ${label}`, gameWidth / 2, barY + barHeight / 2)
  ctx.shadowBlur = 0
}

function drawScore(ctx: CanvasRenderingContext2D, state: GameState) {
  const { score } = state

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 32px "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'top'

  ctx.shadowColor = '#000000'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  ctx.fillText(`得分: ${score}`, 20, 60)
  ctx.shadowBlur = 0
  ctx.shadowOffsetX = 0
  ctx.shadowOffsetY = 0
}

function drawFPS(ctx: CanvasRenderingContext2D, state: GameState) {
  const { fps, gameWidth } = state

  let color = '#2ECC71'
  if (fps < 30) color = '#E74C3C'
  else if (fps < 50) color = '#F39C12'

  ctx.fillStyle = color
  ctx.font = 'bold 18px "Segoe UI", sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.fillText(`FPS: ${fps}`, gameWidth - 20, 60)
}

function drawLives(ctx: CanvasRenderingContext2D, state: GameState) {
  const { playerLives, gameHeight } = state
  const startY = gameHeight - 40

  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 16px "Segoe UI", sans-serif'
  ctx.textAlign = 'left'
  ctx.textBaseline = 'middle'
  ctx.fillText('生命:', 20, startY)

  for (let i = 0; i < 3; i++) {
    const x = 80 + i * 30
    const y = startY

    if (i < playerLives) {
      ctx.fillStyle = '#E74C3C'
    } else {
      ctx.fillStyle = '#555555'
    }

    ctx.beginPath()
    ctx.moveTo(x, y - 8)
    ctx.lineTo(x + 10, y + 8)
    ctx.lineTo(x - 10, y + 8)
    ctx.closePath()
    ctx.fill()
  }
}

function drawMinimap(ctx: CanvasRenderingContext2D, state: GameState) {
  const { gameWidth, gameHeight, playerX, playerY, bossX, bossY, bullets, minions } = state

  const mapScale = 0.25
  const mapWidth = gameWidth * mapScale
  const mapHeight = gameHeight * mapScale
  const mapX = gameWidth - mapWidth - 20
  const mapY = gameHeight - mapHeight - 20

  ctx.fillStyle = 'rgba(11, 12, 16, 0.7)'
  ctx.strokeStyle = '#45A29E'
  ctx.lineWidth = 1
  roundRect(ctx, mapX, mapY, mapWidth, mapHeight, 8)
  ctx.fill()
  ctx.stroke()

  ctx.fillStyle = 'rgba(128, 128, 128, 0.6)'
  for (const bullet of bullets) {
    const bx = mapX + bullet.x * mapScale
    const by = mapY + bullet.y * mapScale
    ctx.beginPath()
    ctx.arc(bx, by, 1.5, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const minion of minions) {
    const mx = mapX + minion.x * mapScale
    const my = mapY + minion.y * mapScale
    ctx.beginPath()
    ctx.arc(mx, my, 2, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = '#E74C3C'
  ctx.beginPath()
  ctx.arc(mapX + bossX * mapScale, mapY + bossY * mapScale, 4, 0, Math.PI * 2)
  ctx.fill()

  ctx.fillStyle = '#2ECC71'
  ctx.beginPath()
  ctx.arc(mapX + playerX * mapScale, mapY + playerY * mapScale, 3, 0, Math.PI * 2)
  ctx.fill()
}

function drawScreenFlash(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  now: number,
  w: number,
  h: number
) {
  if (state.screenFlash === 0) return

  const elapsed = now - state.screenFlash
  const duration = state.gameOver ? 1000 : 300
  if (elapsed > duration) return

  const alpha = (1 - elapsed / duration) * 0.5
  ctx.fillStyle = `rgba(255, 0, 0, ${alpha})`
  ctx.fillRect(0, 0, w, h)
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
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
