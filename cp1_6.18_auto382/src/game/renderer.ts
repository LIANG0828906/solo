import type { MapData } from './map'
import type { Monster, Dart, Particle } from './entities'
import type { SonarWave, MarkPoint } from './sonar'

interface PlayerState {
  x: number
  y: number
  invincible: boolean
  invincibleTimer: number
}

interface RenderState {
  mapData: MapData
  player: PlayerState
  monsters: Monster[]
  sonarWaves: SonarWave[]
  markPoints: MarkPoint[]
  darts: Dart[]
  particles: Particle[]
  score: number
  time: number
  gameOver: boolean
  gameStarted: boolean
  chargePower: number
  lives: number
}

export function render(ctx: CanvasRenderingContext2D, state: RenderState, canvasWidth: number, canvasHeight: number): void {
  ctx.fillStyle = '#0A1A0A'
  ctx.fillRect(0, 0, canvasWidth, canvasHeight)

  if (!state.gameStarted) {
    renderStartScreen(ctx, canvasWidth, canvasHeight)
    return
  }

  const cameraX = state.player.x - canvasWidth / 2
  const cameraY = state.player.y - canvasHeight / 2

  ctx.save()
  ctx.translate(-cameraX, -cameraY)

  renderFog(ctx, state.player.x, state.player.y, canvasWidth, canvasHeight, cameraX, cameraY)
  renderGrid(ctx, state.mapData, cameraX, cameraY, canvasWidth, canvasHeight)
  renderMap(ctx, state.mapData)
  renderMarkPoints(ctx, state.markPoints)
  renderMonsters(ctx, state.monsters)
  renderDarts(ctx, state.darts)
  renderSonarWaves(ctx, state.sonarWaves)
  renderParticles(ctx, state.particles)
  renderPlayer(ctx, state.player)

  ctx.restore()

  renderUI(ctx, state, canvasWidth, canvasHeight)

  if (state.gameOver) {
    renderGameOver(ctx, state, canvasWidth, canvasHeight)
  }
}

function renderStartScreen(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = '#00FFAA'
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#00FFAA'
  ctx.shadowBlur = 20
  ctx.fillText('回声猎手', w / 2, h / 2 - 60)
  ctx.shadowBlur = 0

  ctx.fillStyle = '#00FFAA'
  ctx.font = '18px monospace'
  ctx.globalAlpha = 0.8
  ctx.fillText('按住鼠标蓄力发射声波探测环境', w / 2, h / 2 + 10)
  ctx.fillText('按空格键发射追踪飞镖消灭标记的怪物', w / 2, h / 2 + 40)
  ctx.fillText('WASD 或方向键移动', w / 2, h / 2 + 70)
  ctx.globalAlpha = 0.6
  ctx.fillText('点击任意位置开始游戏', w / 2, h / 2 + 120)
  ctx.globalAlpha = 1
}

function renderFog(
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  cw: number,
  ch: number,
  camX: number,
  camY: number
): void {
  const centerX = camX + cw / 2
  const centerY = camY + ch / 2
  const radius = Math.max(cw, ch) * 0.6
  const gradient = ctx.createRadialGradient(px, py, 50, px, py, radius)
  gradient.addColorStop(0, 'rgba(10, 26, 10, 0)')
  gradient.addColorStop(0.5, 'rgba(5, 13, 5, 0.4)')
  gradient.addColorStop(1, 'rgba(0, 5, 0, 0.9)')
  ctx.fillStyle = gradient
  ctx.fillRect(camX - 10, camY - 10, cw + 20, ch + 20)
  void centerX; void centerY
}

function renderGrid(
  ctx: CanvasRenderingContext2D,
  mapData: MapData,
  camX: number,
  camY: number,
  cw: number,
  ch: number
): void {
  ctx.strokeStyle = '#1A3A1A'
  ctx.globalAlpha = 0.2
  ctx.lineWidth = 1

  const startX = Math.max(0, Math.floor(camX / 50) * 50)
  const endX = Math.min(mapData.width, camX + cw + 50)
  const startY = Math.max(0, Math.floor(camY / 50) * 50)
  const endY = Math.min(mapData.height, camY + ch + 50)

  ctx.beginPath()
  for (let x = startX; x <= endX; x += 50) {
    ctx.moveTo(x, startY)
    ctx.lineTo(x, endY)
  }
  for (let y = startY; y <= endY; y += 50) {
    ctx.moveTo(startX, y)
    ctx.lineTo(endX, y)
  }
  ctx.stroke()
  ctx.globalAlpha = 1
}

function renderMap(ctx: CanvasRenderingContext2D, mapData: MapData): void {
  for (const g of mapData.grass) {
    ctx.fillStyle = 'rgba(50, 150, 50, 0.3)'
    ctx.beginPath()
    ctx.arc(g.x, g.y, g.size, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const tree of mapData.trees) {
    ctx.fillStyle = '#3D2817'
    ctx.fillRect(tree.x, tree.y, tree.width, tree.height)
    ctx.fillStyle = '#1A5A1A'
    ctx.beginPath()
    ctx.arc(tree.x + tree.width / 2, tree.y, tree.width * 1.2, 0, Math.PI * 2)
    ctx.fill()
  }

  for (const rock of mapData.rocks) {
    ctx.fillStyle = '#555555'
    ctx.strokeStyle = '#777777'
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.moveTo(rock.vertices[0].x, rock.vertices[0].y)
    for (let i = 1; i < rock.vertices.length; i++) {
      ctx.lineTo(rock.vertices[i].x, rock.vertices[i].y)
    }
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
  }
}

function renderMonsters(ctx: CanvasRenderingContext2D, monsters: Monster[]): void {
  for (const m of monsters) {
    ctx.save()
    ctx.translate(m.x, m.y)

    if (m.marked) {
      ctx.shadowColor = '#FF0044'
      ctx.shadowBlur = 15
    }

    switch (m.type) {
      case 'lurker': {
        const alpha = m.hitBySonar ? 1 : m.marked ? 1 : 0.15
        ctx.globalAlpha = alpha
        ctx.fillStyle = m.marked ? '#FF0044' : '#3366FF'
        ctx.strokeStyle = '#6699FF'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, -10)
        ctx.lineTo(-10, 8)
        ctx.lineTo(10, 8)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      }
      case 'wanderer': {
        ctx.fillStyle = m.marked ? '#FF0044' : '#9933FF'
        ctx.strokeStyle = '#BB66FF'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(0, -12)
        ctx.lineTo(8, 0)
        ctx.lineTo(0, 8)
        ctx.lineTo(-8, 0)
        ctx.closePath()
        ctx.fill()
        ctx.stroke()
        break
      }
      case 'mimic': {
        if (m.state === 'idle') {
          ctx.fillStyle = '#FFAA66'
          ctx.beginPath()
          ctx.arc(0, -4, 10, Math.PI, 0)
          ctx.fill()
          ctx.fillStyle = '#FFFFFF'
          ctx.beginPath()
          ctx.arc(-3, -6, 2, 0, Math.PI * 2)
          ctx.arc(4, -4, 1.5, 0, Math.PI * 2)
          ctx.fill()
          ctx.fillStyle = '#DDAA88'
          ctx.fillRect(-3, -4, 6, 10)
          ctx.shadowColor = '#FFEEAA'
          ctx.shadowBlur = 10
          ctx.fillStyle = 'rgba(255, 238, 170, 0.3)'
          ctx.beginPath()
          ctx.arc(0, 0, 18, 0, Math.PI * 2)
          ctx.fill()
        } else {
          ctx.fillStyle = m.marked ? '#FF0044' : '#33FF66'
          ctx.strokeStyle = '#66FF99'
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(0, 0, 12, 0, Math.PI * 2)
          ctx.fill()
          ctx.stroke()
        }
        break
      }
    }
    ctx.restore()
  }
}

function renderSonarWaves(ctx: CanvasRenderingContext2D, waves: SonarWave[]): void {
  for (const w of waves) {
    const gradient = ctx.createRadialGradient(w.x, w.y, Math.max(0, w.radius - 40), w.x, w.y, w.radius)
    gradient.addColorStop(0, 'rgba(0, 255, 170, 0)')
    gradient.addColorStop(0.7, 'rgba(0, 255, 170, 0.15)')
    gradient.addColorStop(1, 'rgba(0, 255, 170, 0.6)')

    ctx.strokeStyle = '#00FFAA'
    ctx.lineWidth = 3
    ctx.globalAlpha = 0.8
    ctx.shadowColor = '#00FFAA'
    ctx.shadowBlur = 15
    ctx.beginPath()
    ctx.arc(w.x, w.y, w.radius, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0

    ctx.strokeStyle = gradient
    ctx.lineWidth = 35
    ctx.globalAlpha = 0.4
    ctx.beginPath()
    ctx.arc(w.x, w.y, w.radius - 15, 0, Math.PI * 2)
    ctx.stroke()
    ctx.globalAlpha = 1
  }
}

function renderMarkPoints(ctx: CanvasRenderingContext2D, marks: MarkPoint[]): void {
  for (const m of marks) {
    const pulse = 1 + Math.sin(Date.now() * 0.01) * 0.3
    ctx.strokeStyle = '#FF0044'
    ctx.lineWidth = 2
    ctx.shadowColor = '#FF0044'
    ctx.shadowBlur = 15
    ctx.globalAlpha = m.timer / 180
    ctx.beginPath()
    ctx.arc(m.x, m.y, 18 * pulse, 0, Math.PI * 2)
    ctx.stroke()
    ctx.beginPath()
    ctx.arc(m.x, m.y, 25 * pulse, 0, Math.PI * 2)
    ctx.stroke()
    ctx.shadowBlur = 0
    ctx.globalAlpha = 1
  }
}

function renderDarts(ctx: CanvasRenderingContext2D, darts: Dart[]): void {
  for (const d of darts) {
    ctx.fillStyle = '#FFFFFF'
    ctx.shadowColor = '#00FFAA'
    ctx.shadowBlur = 10
    ctx.beginPath()
    ctx.arc(d.x, d.y, 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0
  }
}

function renderParticles(ctx: CanvasRenderingContext2D, particles: Particle[]): void {
  for (const p of particles) {
    const alpha = p.life / p.maxLife
    ctx.globalAlpha = alpha
    ctx.fillStyle = p.color
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function renderPlayer(ctx: CanvasRenderingContext2D, player: PlayerState): void {
  ctx.save()
  if (player.invincible) {
    const flicker = Math.floor(player.invincibleTimer / 5) % 2
    ctx.globalAlpha = flicker === 0 ? 0.5 : 1
  }
  ctx.fillStyle = '#00FFAA'
  ctx.shadowColor = '#00FFAA'
  ctx.shadowBlur = 15
  ctx.beginPath()
  ctx.arc(player.x, player.y, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(player.x, player.y, 4, 0, Math.PI * 2)
  ctx.fill()
  ctx.shadowBlur = 0
  ctx.restore()
}

function renderUI(
  ctx: CanvasRenderingContext2D,
  state: RenderState,
  cw: number,
  ch: number
): void {
  for (let i = 0; i < 3; i++) {
    drawHeart(ctx, 25 + i * 30, 25, i < state.lives ? '#FF0044' : '#444444')
  }

  const seconds = Math.floor(state.time / 60)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  ctx.fillStyle = '#00FFAA'
  ctx.font = '16px monospace'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'top'
  ctx.shadowColor = '#00FFAA'
  ctx.shadowBlur = 8
  ctx.fillText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`, cw - 20, 18)
  ctx.fillText(`得分: ${state.score}`, cw - 20, 42)
  ctx.shadowBlur = 0

  if (state.chargePower > 0) {
    const barWidth = 120
    const barHeight = 6
    const bx = cw / 2 - barWidth / 2
    const by = ch - 40
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)'
    ctx.fillRect(bx, by, barWidth, barHeight)
    ctx.fillStyle = '#00FFAA'
    ctx.shadowColor = '#00FFAA'
    ctx.shadowBlur = 10
    ctx.fillRect(bx, by, barWidth * state.chargePower, barHeight)
    ctx.shadowBlur = 0
  }
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string): void {
  ctx.fillStyle = color
  ctx.shadowColor = color === '#FF0044' ? '#FF0044' : 'transparent'
  ctx.shadowBlur = color === '#FF0044' ? 8 : 0
  ctx.beginPath()
  const s = 10
  ctx.moveTo(cx, cy + s * 0.6)
  ctx.bezierCurveTo(cx, cy + s * 0.2, cx - s, cy, cx - s, cy + s * 0.3)
  ctx.bezierCurveTo(cx - s, cy + s * 0.6, cx, cy + s * 0.9, cx, cy + s * 1.1)
  ctx.bezierCurveTo(cx, cy + s * 0.9, cx + s, cy + s * 0.6, cx + s, cy + s * 0.3)
  ctx.bezierCurveTo(cx + s, cy, cx, cy + s * 0.2, cx, cy + s * 0.6)
  ctx.fill()
  ctx.shadowBlur = 0
}

function renderGameOver(ctx: CanvasRenderingContext2D, state: RenderState, cw: number, ch: number): void {
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
  ctx.fillRect(0, 0, cw, ch)

  ctx.fillStyle = '#FF0044'
  ctx.font = 'bold 48px monospace'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = '#FF0044'
  ctx.shadowBlur = 20
  ctx.fillText('游戏结束', cw / 2, ch / 2 - 50)
  ctx.shadowBlur = 0

  ctx.fillStyle = '#00FFAA'
  ctx.font = '24px monospace'
  ctx.shadowColor = '#00FFAA'
  ctx.shadowBlur = 10
  ctx.fillText(`最终得分: ${state.score}`, cw / 2, ch / 2 + 10)

  ctx.globalAlpha = 0.7
  ctx.font = '16px monospace'
  ctx.fillText('点击任意位置重新开始', cw / 2, ch / 2 + 60)
  ctx.globalAlpha = 1
  ctx.shadowBlur = 0
}
