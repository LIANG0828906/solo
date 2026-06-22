import { useEffect, useRef, useCallback } from 'react'
import {
  useGameStore,
  CellType,
  KeyboardState,
  createInitialKeyboardState,
  MAZE_SIZE,
  CELL_PIXEL_SIZE,
} from '../stores/gameStore'

const BG_COLOR = '#1A1A2E'
const WALL_COLOR = '#16213E'
const PATH_COLOR = '#0F3460'
const DOT_COLOR = '#E94560'
const EXIT_COLOR = '#00FF00'

function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const keyboardStateRef = useRef<KeyboardState>(createInitialKeyboardState())
  const prevPauseRef = useRef<boolean>(false)
  const stateRef = useRef(useGameStore.getState())

  useEffect(() => {
    stateRef.current = useGameStore.getState()
    const unsubscribe = useGameStore.subscribe((s) => {
      stateRef.current = s
    })
    return unsubscribe
  }, [])

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const kb = keyboardStateRef.current
    switch (e.code) {
      case 'KeyW':
        kb.player1.up = true
        break
      case 'KeyS':
        kb.player1.down = true
        break
      case 'KeyA':
        kb.player1.left = true
        break
      case 'KeyD':
        kb.player1.right = true
        break
      case 'ArrowUp':
        kb.player2.up = true
        kb.player1.up = true
        break
      case 'ArrowDown':
        kb.player2.down = true
        kb.player1.down = true
        break
      case 'ArrowLeft':
        kb.player2.left = true
        kb.player1.left = true
        break
      case 'ArrowRight':
        kb.player2.right = true
        kb.player1.right = true
        break
      case 'Escape':
      case 'KeyP':
        kb.pause = true
        break
    }
    if (
      [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'KeyW',
        'KeyA',
        'KeyS',
        'KeyD',
      ].includes(e.code)
    ) {
      e.preventDefault()
    }
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const kb = keyboardStateRef.current
    switch (e.code) {
      case 'KeyW':
        kb.player1.up = false
        break
      case 'KeyS':
        kb.player1.down = false
        break
      case 'KeyA':
        kb.player1.left = false
        break
      case 'KeyD':
        kb.player1.right = false
        break
      case 'ArrowUp':
        kb.player2.up = false
        kb.player1.up = false
        break
      case 'ArrowDown':
        kb.player2.down = false
        kb.player1.down = false
        break
      case 'ArrowLeft':
        kb.player2.left = false
        kb.player1.left = false
        break
      case 'ArrowRight':
        kb.player2.right = false
        kb.player1.right = false
        break
      case 'Escape':
      case 'KeyP':
        kb.pause = false
        break
    }
  }, [])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current
      const container = containerRef.current
      if (!canvas || !container) return

      const dpr = window.devicePixelRatio || 1
      const containerWidth = container.clientWidth
      const containerHeight = container.clientHeight
      const logicalSize = MAZE_SIZE * CELL_PIXEL_SIZE

      let cellSize = CELL_PIXEL_SIZE
      const scale = Math.min(containerWidth / logicalSize, containerHeight / logicalSize)
      cellSize = Math.floor(CELL_PIXEL_SIZE * scale)

      const displayWidth = cellSize * MAZE_SIZE
      const displayHeight = cellSize * MAZE_SIZE

      canvas.style.width = `${displayWidth}px`
      canvas.style.height = `${displayHeight}px`
      canvas.width = displayWidth * dpr
      canvas.height = displayHeight * dpr
    }

    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [])

  useEffect(() => {
    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp
      const deltaTime = Math.min(40, timestamp - lastTimeRef.current)
      lastTimeRef.current = timestamp

      const kb = keyboardStateRef.current
      const state = stateRef.current

      const pausePressed = kb.pause
      if (pausePressed && !prevPauseRef.current) {
        if (state.gameStatus === 'playing') {
          state.pause()
        } else if (state.gameStatus === 'paused') {
          state.resume()
        }
      }
      prevPauseRef.current = pausePressed

      if (state.gameStatus === 'playing') {
        state.tick(deltaTime, kb)
      }

      render()
      animationRef.current = requestAnimationFrame(gameLoop)
    }

    animationRef.current = requestAnimationFrame(gameLoop)
    return () => cancelAnimationFrame(animationRef.current)
  }, [])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = stateRef.current
    const { maze, players, ghosts, shockwaves } = state
    if (!maze || maze.length === 0) return

    const dpr = window.devicePixelRatio || 1
    const size = maze.length
    const displayWidth = canvas.width
    const displayHeight = canvas.height
    const cellPx = displayWidth / size

    ctx.save()
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, displayWidth, displayHeight)

    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const cell = maze[y][x]
        const px = x * cellPx
        const py = y * cellPx

        if (cell === CellType.WALL) {
          ctx.fillStyle = WALL_COLOR
          ctx.fillRect(px, py, cellPx, cellPx)
          ctx.strokeStyle = '#0a1128'
          ctx.lineWidth = 1 * dpr
          ctx.strokeRect(px + 0.5, py + 0.5, cellPx - 1, cellPx - 1)
        } else {
          ctx.fillStyle = PATH_COLOR
          ctx.fillRect(px, py, cellPx, cellPx)

          if (cell === CellType.DOT) {
            const radius = cellPx * 0.12
            ctx.fillStyle = DOT_COLOR
            ctx.beginPath()
            ctx.arc(px + cellPx / 2, py + cellPx / 2, radius, 0, Math.PI * 2)
            ctx.fill()
          } else if (cell === CellType.POWER_PELLET) {
            const t = performance.now() / 1000
            const pulse = 0.5 + 0.5 * Math.sin(t * 8)
            const baseRadius = cellPx * 0.3
            const radius = baseRadius * (0.75 + 0.25 * pulse)

            const gradient = ctx.createRadialGradient(
              px + cellPx / 2,
              py + cellPx / 2,
              0,
              px + cellPx / 2,
              py + cellPx / 2,
              radius,
            )
            gradient.addColorStop(0, '#FFFFFF')
            gradient.addColorStop(0.4, '#FFF59D')
            gradient.addColorStop(1, 'rgba(255, 245, 157, 0)')
            ctx.fillStyle = gradient
            ctx.beginPath()
            ctx.arc(px + cellPx / 2, py + cellPx / 2, radius, 0, Math.PI * 2)
            ctx.fill()

            ctx.fillStyle = '#FFEB3B'
            drawStar(ctx, px + cellPx / 2, py + cellPx / 2, 5, radius * 0.6, radius * 0.3)
          } else if (cell === CellType.EXIT) {
            ctx.strokeStyle = EXIT_COLOR
            ctx.lineWidth = 2 * dpr
            const margin = cellPx * 0.15
            ctx.strokeRect(px + margin, py + margin, cellPx - margin * 2, cellPx - margin * 2)
            ctx.fillStyle = EXIT_COLOR
            ctx.font = `${cellPx * 0.35}px 'Press Start 2P', monospace`
            ctx.textAlign = 'center'
            ctx.textBaseline = 'middle'
            ctx.fillText('E', px + cellPx / 2, py + cellPx / 2)
          }
        }
      }
    }

    for (const ghost of ghosts) {
      if (ghost.isEaten) continue
      const prevX = ghost.prevPosition.x * cellPx
      const prevY = ghost.prevPosition.y * cellPx
      const currX = ghost.position.x * cellPx
      const currY = ghost.position.y * cellPx
      const t = 1 - ghost.moveProgress
      const gx = prevX + (currX - prevX) * t + cellPx / 2
      const gy = prevY + (currY - prevY) * t + cellPx / 2
      const ghostRadius = cellPx * 0.4

      drawGhost(ctx, gx, gy, ghostRadius, ghost.color, ghost.isScared)
    }

    for (const p of players) {
      if (p.lives <= 0) continue
      const prevX = p.prevPosition.x * cellPx
      const prevY = p.prevPosition.y * cellPx
      const currX = p.position.x * cellPx
      const currY = p.position.y * cellPx
      const t = 1 - p.moveProgress
      const px = prevX + (currX - prevX) * t + cellPx / 2
      const py = prevY + (currY - prevY) * t + cellPx / 2
      const pRadius = cellPx * 0.4

      let angle = 0
      switch (p.direction) {
        case 'right':
          angle = 0
          break
        case 'down':
          angle = Math.PI / 2
          break
        case 'left':
          angle = Math.PI
          break
        case 'up':
          angle = -Math.PI / 2
          break
        default:
          angle = 0
      }

      const mouthPulse = 0.5 + 0.5 * Math.sin(performance.now() / 80)
      const mouthAngle = 0.05 + mouthPulse * 0.35

      drawPacman(ctx, px, py, pRadius, p.color, angle, mouthAngle)

      if (p.hasPowerPellet) {
        const t2 = performance.now() / 200
        const pulse = 0.5 + 0.5 * Math.sin(t2)
        ctx.strokeStyle = `rgba(139, 0, 255, ${0.4 + pulse * 0.5})`
        ctx.lineWidth = 2 * dpr
        ctx.beginPath()
        ctx.arc(px, py, pRadius * (1.2 + pulse * 0.1), 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    for (const s of shockwaves) {
      const scaleX = canvas.width / (MAZE_SIZE * CELL_PIXEL_SIZE)
      const scaleY = canvas.height / (MAZE_SIZE * CELL_PIXEL_SIZE)
      const sx = s.x * scaleX
      const sy = s.y * scaleY
      const sr = s.radius * ((scaleX + scaleY) / 2)

      const gradient = ctx.createRadialGradient(sx, sy, 0, sx, sy, sr)
      gradient.addColorStop(0, 'rgba(255,255,255,0)')
      gradient.addColorStop(0.7, `${s.color}`)
      gradient.addColorStop(1, 'rgba(255,255,255,0)')

      ctx.globalAlpha = s.opacity * 0.7
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(sx, sy, sr, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = s.color
      ctx.globalAlpha = s.opacity
      ctx.lineWidth = 3 * dpr
      ctx.stroke()
      ctx.globalAlpha = 1
    }

    ctx.restore()
  }, [])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: BG_COLOR,
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          imageRendering: 'pixelated',
          borderRadius: '4px',
          boxShadow: '0 0 40px rgba(0, 255, 0, 0.15)',
        }}
      />
    </div>
  )
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  spikes: number,
  outer: number,
  inner: number,
) {
  let rot = (Math.PI / 2) * 3
  let x = cx
  let y = cy
  const step = Math.PI / spikes
  ctx.beginPath()
  ctx.moveTo(cx, cy - outer)
  for (let i = 0; i < spikes; i++) {
    x = cx + Math.cos(rot) * outer
    y = cy + Math.sin(rot) * outer
    ctx.lineTo(x, y)
    rot += step
    x = cx + Math.cos(rot) * inner
    y = cy + Math.sin(rot) * inner
    ctx.lineTo(x, y)
    rot += step
  }
  ctx.lineTo(cx, cy - outer)
  ctx.closePath()
  ctx.fill()
}

function drawPacman(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  angle: number,
  mouthAngle: number,
) {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.arc(0, 0, radius, mouthAngle, Math.PI * 2 - mouthAngle)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawGhost(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  color: string,
  isScared: boolean,
) {
  ctx.save()
  const t = performance.now() / 150
  const flash = isScared ? (Math.sin(t) > 0 ? '#8B00FF' : '#FFFFFF') : color

  const bodyWidth = radius * 2
  const bodyHeight = radius * 2.1
  const x = cx - radius
  const y = cy - radius * 0.9

  ctx.fillStyle = flash
  ctx.beginPath()
  ctx.moveTo(x + bodyWidth / 2, y)
  ctx.arc(x + bodyWidth / 2, y + radius, radius, Math.PI, 0, false)
  ctx.lineTo(x + bodyWidth, y + bodyHeight)

  const waveCount = 4
  const waveWidth = bodyWidth / waveCount
  const waveHeight = radius * 0.25
  for (let i = 0; i < waveCount; i++) {
    const wx1 = x + bodyWidth - i * waveWidth
    const wx2 = wx1 - waveWidth / 2
    const wx3 = wx1 - waveWidth
    ctx.lineTo(wx2, y + bodyHeight - waveHeight)
    ctx.lineTo(wx3, y + bodyHeight)
  }
  ctx.closePath()
  ctx.fill()

  const eyeRadius = radius * 0.22
  const eyeY = cy - radius * 0.2
  const eyeLeftX = cx - radius * 0.35
  const eyeRightX = cx + radius * 0.35

  ctx.fillStyle = '#FFFFFF'
  ctx.beginPath()
  ctx.arc(eyeLeftX, eyeY, eyeRadius, 0, Math.PI * 2)
  ctx.arc(eyeRightX, eyeY, eyeRadius, 0, Math.PI * 2)
  ctx.fill()

  if (isScared) {
    ctx.fillStyle = flash === '#FFFFFF' ? '#0000FF' : '#FF0000'
    ctx.beginPath()
    ctx.arc(eyeLeftX, eyeY, eyeRadius * 0.5, 0, Math.PI * 2)
    ctx.arc(eyeRightX, eyeY, eyeRadius * 0.5, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = flash === '#FFFFFF' ? '#0000FF' : '#FF0000'
    ctx.lineWidth = Math.max(1, radius * 0.1)
    ctx.beginPath()
    const mouthY = cy + radius * 0.35
    const mStartX = cx - radius * 0.55
    const mEndX = cx + radius * 0.55
    const stepX = (mEndX - mStartX) / 5
    ctx.moveTo(mStartX, mouthY + (0 % 2 === 0 ? 0 : -radius * 0.12))
    for (let i = 1; i <= 5; i++) {
      const mx = mStartX + i * stepX
      const my = mouthY + (i % 2 === 0 ? 0 : -radius * 0.12)
      ctx.lineTo(mx, my)
    }
    ctx.stroke()
  } else {
    ctx.fillStyle = '#000080'
    ctx.beginPath()
    ctx.arc(eyeLeftX + eyeRadius * 0.2, eyeY, eyeRadius * 0.45, 0, Math.PI * 2)
    ctx.arc(eyeRightX + eyeRadius * 0.2, eyeY, eyeRadius * 0.45, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.restore()
}

export default GameCanvas
