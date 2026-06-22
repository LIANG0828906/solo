import React, { useEffect, useRef } from 'react'
import { useGameStore } from '../store/useGameStore'

const CANVAS_WIDTH = 900
const CANVAS_HEIGHT = 600

const CanvasBoard: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>(0)
  const victoryShownRef = useRef<boolean>(false)
  const victoryStartRef = useRef<number>(0)

  const gameState = useGameStore()

  useEffect(() => {
    gameState.dispatchPhysicsUpdate()
  }, [])

  useEffect(() => {
    if (gameState.isVictory && !victoryShownRef.current) {
      victoryShownRef.current = true
      victoryStartRef.current = performance.now()
    } else if (!gameState.isVictory) {
      victoryShownRef.current = false
    }
  }, [gameState.isVictory])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = (timestamp: number) => {
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

      const progress = gameState.transitionProgress
      ctx.save()
      if (progress < 1) {
        const cx = CANVAS_WIDTH / 2
        const cy = CANVAS_HEIGHT / 2
        ctx.translate(cx, cy)
        ctx.scale(progress, progress)
        ctx.globalAlpha = progress
        ctx.translate(-cx, -cy)
      }

      drawGrid(ctx)
      drawTargets(ctx, gameState.targets, timestamp)
      drawMirrors(ctx, gameState.mirrors)
      drawLightPath(ctx, gameState.lightPath, gameState.lightAngle)
      drawLightSource(ctx, gameState.sourcePosition, gameState.lightAngle, gameState.lightIntensity, timestamp)
      drawVictory(ctx, timestamp, gameState.isVictory)

      ctx.restore()

      animationFrameRef.current = requestAnimationFrame(render)
    }

    animationFrameRef.current = requestAnimationFrame(render)
    return () => {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [gameState])

  return (
    <div
      style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <canvas
        ref={canvasRef}
        width={CANVAS_WIDTH}
        height={CANVAS_HEIGHT}
        style={{
          background: '#000000',
          borderRadius: 12,
          boxShadow: '0 4px 32px rgba(0,0,0,0.6), inset 0 0 60px rgba(102, 252, 241, 0.03)',
          maxWidth: '100%',
          maxHeight: 'calc(100vh - 40px)',
        }}
      />
    </div>
  )
}

function drawGrid(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = 'rgba(102, 252, 241, 0.04)'
  ctx.lineWidth = 1
  const gridSize = 40

  for (let x = 0; x <= CANVAS_WIDTH; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, CANVAS_HEIGHT)
    ctx.stroke()
  }
  for (let y = 0; y <= CANVAS_HEIGHT; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(CANVAS_WIDTH, y)
    ctx.stroke()
  }
}

function drawLightSource(
  ctx: CanvasRenderingContext2D,
  pos: { x: number; y: number },
  angle: number,
  intensity: number,
  timestamp: number
) {
  const pulse = 1 + Math.sin(timestamp / 300) * 0.05
  const baseRadius = 18 * pulse
  const hue = angle % 360
  const alpha = 0.5 + (intensity / 100) * 0.5

  const gradient = ctx.createRadialGradient(pos.x, pos.y, 0, pos.x, pos.y, baseRadius * 2.5)
  gradient.addColorStop(0, `hsla(${hue}, 100%, 70%, ${alpha})`)
  gradient.addColorStop(0.3, `hsla(${hue}, 90%, 60%, ${alpha * 0.6})`)
  gradient.addColorStop(0.6, `hsla(${hue}, 80%, 50%, ${alpha * 0.2})`)
  gradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)')

  ctx.beginPath()
  ctx.arc(pos.x, pos.y, baseRadius * 2.5, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()

  ctx.beginPath()
  ctx.arc(pos.x, pos.y, baseRadius * 0.6, 0, Math.PI * 2)
  ctx.fillStyle = `hsl(${hue}, 100%, 85%)`
  ctx.shadowColor = `hsl(${hue}, 100%, 60%)`
  ctx.shadowBlur = 20
  ctx.fill()
  ctx.shadowBlur = 0

  const dirX = Math.cos((angle * Math.PI) / 180)
  const dirY = -Math.sin((angle * Math.PI) / 180)
  const arrowLen = baseRadius * 1.4
  const tipX = pos.x + dirX * arrowLen
  const tipY = pos.y + dirY * arrowLen

  ctx.strokeStyle = `hsl(${hue}, 100%, 80%)`
  ctx.lineWidth = 3
  ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(pos.x, pos.y)
  ctx.lineTo(tipX, tipY)
  ctx.stroke()

  const ang = Math.atan2(dirY, dirX)
  const headLen = 7
  ctx.beginPath()
  ctx.moveTo(tipX, tipY)
  ctx.lineTo(
    tipX - headLen * Math.cos(ang - Math.PI / 6),
    tipY - headLen * Math.sin(ang - Math.PI / 6)
  )
  ctx.lineTo(
    tipX - headLen * Math.cos(ang + Math.PI / 6),
    tipY - headLen * Math.sin(ang + Math.PI / 6)
  )
  ctx.closePath()
  ctx.fillStyle = `hsl(${hue}, 100%, 80%)`
  ctx.fill()
}

function drawMirrors(ctx: CanvasRenderingContext2D, mirrors: Array<{
  x: number
  y: number
  width: number
  height: number
  rotation: number
}>) {
  for (const mirror of mirrors) {
    ctx.save()
    ctx.translate(mirror.x, mirror.y)
    ctx.rotate((mirror.rotation * Math.PI) / 180)

    ctx.shadowColor = '#66FCF1'
    ctx.shadowBlur = 12
    ctx.strokeStyle = '#66FCF1'
    ctx.lineWidth = 2
    ctx.strokeRect(-mirror.width / 2, -mirror.height / 2, mirror.width, mirror.height)
    ctx.shadowBlur = 0

    ctx.fillStyle = 'rgba(197, 198, 199, 0.7)'
    ctx.fillRect(-mirror.width / 2, -mirror.height / 2, mirror.width, mirror.height)

    const highlightGrad = ctx.createLinearGradient(
      -mirror.width / 2,
      -mirror.height / 2,
      mirror.width / 2,
      mirror.height / 2
    )
    highlightGrad.addColorStop(0, 'rgba(255,255,255,0.3)')
    highlightGrad.addColorStop(0.5, 'rgba(255,255,255,0.1)')
    highlightGrad.addColorStop(1, 'rgba(255,255,255,0.3)')
    ctx.fillStyle = highlightGrad
    ctx.fillRect(-mirror.width / 2, -mirror.height / 2, mirror.width, mirror.height)

    ctx.restore()
  }
}

function drawLightPath(
  ctx: CanvasRenderingContext2D,
  path: Array<{
    start: { x: number; y: number }
    end: { x: number; y: number }
    intensity: number
    hitTargetId: string | null
  }>,
  baseAngle: number
) {
  for (let i = 0; i < path.length; i++) {
    const segment = path[i]
    const hue = (baseAngle + i * 25) % 360
    const alpha = Math.max(0.2, segment.intensity)

    const glowWidth = 10 * segment.intensity
    const glow = ctx.createLinearGradient(
      segment.start.x,
      segment.start.y,
      segment.end.x,
      segment.end.y
    )
    glow.addColorStop(0, `hsla(${hue}, 100%, 65%, ${alpha * 0.15})`)
    glow.addColorStop(0.5, `hsla(${hue}, 100%, 60%, ${alpha * 0.1})`)
    glow.addColorStop(1, `hsla(${hue}, 100%, 55%, ${alpha * 0.15})`)

    ctx.strokeStyle = glow
    ctx.lineWidth = glowWidth
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(segment.start.x, segment.start.y)
    ctx.lineTo(segment.end.x, segment.end.y)
    ctx.stroke()

    ctx.shadowColor = `hsl(${hue}, 100%, 60%)`
    ctx.shadowBlur = 15 * segment.intensity
    ctx.strokeStyle = `hsla(${hue}, 100%, 65%, ${alpha})`
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(segment.start.x, segment.start.y)
    ctx.lineTo(segment.end.x, segment.end.y)
    ctx.stroke()
    ctx.shadowBlur = 0

    if (segment.hitTargetId) {
      const hitRadius = 6
      const grad = ctx.createRadialGradient(
        segment.end.x,
        segment.end.y,
        0,
        segment.end.x,
        segment.end.y,
        hitRadius * 3
      )
      grad.addColorStop(0, `hsla(${hue}, 100%, 90%, ${alpha})`)
      grad.addColorStop(0.4, `hsla(${hue}, 100%, 65%, ${alpha * 0.7})`)
      grad.addColorStop(1, 'hsla(0, 0%, 0%, 0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(segment.end.x, segment.end.y, hitRadius * 3, 0, Math.PI * 2)
      ctx.fill()
    }
  }
}

function drawTargets(
  ctx: CanvasRenderingContext2D,
  targets: Array<{
    x: number
    y: number
    radius: number
    activated: boolean
    activatedAt: number
  }>,
  timestamp: number
) {
  for (const target of targets) {
    const activatedProgress = target.activated
      ? Math.min((timestamp - target.activatedAt) / 500, 1)
      : 0
    const pulsePhase = target.activated ? (timestamp / 800) % (Math.PI * 2) : 0
    const pulseScale = 1 + Math.sin(pulsePhase) * 0.15

    if (target.activated) {
      const haloRadius = target.radius * (2 + activatedProgress * 3)
      const haloGrad = ctx.createRadialGradient(
        target.x,
        target.y,
        target.radius * 0.5,
        target.x,
        target.y,
        haloRadius
      )
      haloGrad.addColorStop(0, 'rgba(255, 215, 0, 0.5)')
      haloGrad.addColorStop(0.4, 'rgba(255, 215, 0, 0.2)')
      haloGrad.addColorStop(1, 'rgba(255, 215, 0, 0)')
      ctx.fillStyle = haloGrad
      ctx.beginPath()
      ctx.arc(target.x, target.y, haloRadius * pulseScale, 0, Math.PI * 2)
      ctx.fill()

      if (activatedProgress < 1) {
        const ringRadius = target.radius * (1 + activatedProgress * 6)
        const ringAlpha = 1 - activatedProgress
        ctx.strokeStyle = `rgba(255, 215, 0, ${ringAlpha})`
        ctx.lineWidth = 3 * (1 - activatedProgress)
        ctx.beginPath()
        ctx.arc(target.x, target.y, ringRadius, 0, Math.PI * 2)
        ctx.stroke()
      }
    }

    const displayRadius = target.radius * (target.activated ? pulseScale : 1)
    const bodyGrad = ctx.createRadialGradient(
      target.x - displayRadius * 0.3,
      target.y - displayRadius * 0.3,
      0,
      target.x,
      target.y,
      displayRadius
    )

    if (target.activated) {
      bodyGrad.addColorStop(0, '#FFF4B8')
      bodyGrad.addColorStop(0.5, '#FFD700')
      bodyGrad.addColorStop(1, '#DAA520')
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 25
    } else {
      bodyGrad.addColorStop(0, '#6A6A6A')
      bodyGrad.addColorStop(0.5, '#555555')
      bodyGrad.addColorStop(1, '#3A3A3A')
      ctx.shadowColor = 'rgba(0,0,0,0.5)'
      ctx.shadowBlur = 8
    }

    ctx.beginPath()
    ctx.arc(target.x, target.y, displayRadius, 0, Math.PI * 2)
    ctx.fillStyle = bodyGrad
    ctx.fill()
    ctx.shadowBlur = 0

    ctx.strokeStyle = target.activated ? 'rgba(255, 255, 255, 0.6)' : 'rgba(255,255,255,0.15)'
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.beginPath()
    ctx.arc(
      target.x - displayRadius * 0.3,
      target.y - displayRadius * 0.3,
      displayRadius * 0.25,
      0,
      Math.PI * 2
    )
    ctx.fillStyle = target.activated ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.25)'
    ctx.fill()
  }
}

function drawVictory(
  ctx: CanvasRenderingContext2D,
  _timestamp: number,
  isVictory: boolean
) {
  if (!isVictory) return

  const now = performance.now()
  if (!(window as any).__victoryStart || (window as any).__victoryStartReset) {
    ;(window as any).__victoryStart = now
    ;(window as any).__victoryStartReset = false
  }
  const elapsed = now - (window as any).__victoryStart
  const totalDuration = 2500

  if (elapsed > totalDuration) return

  let alpha: number
  let yOffset: number

  if (elapsed < 500) {
    const p = elapsed / 500
    const eased = 1 - Math.pow(1 - p, 4)
    alpha = eased
    yOffset = 100 * (1 - eased)
  } else if (elapsed < 2000) {
    alpha = 1
    yOffset = 0
  } else {
    const p = (elapsed - 2000) / 500
    alpha = 1 - p
    yOffset = 0
  }

  ctx.save()
  ctx.globalAlpha = alpha

  const overlayGrad = ctx.createRadialGradient(
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    0,
    CANVAS_WIDTH / 2,
    CANVAS_HEIGHT / 2,
    CANVAS_WIDTH * 0.6
  )
  overlayGrad.addColorStop(0, 'rgba(255, 215, 0, 0.08)')
  overlayGrad.addColorStop(1, 'rgba(255, 215, 0, 0)')
  ctx.fillStyle = overlayGrad
  ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)

  const textY = CANVAS_HEIGHT / 2 + yOffset

  const shadowAlpha = alpha * 0.4
  ctx.fillStyle = `rgba(0,0,0,${shadowAlpha})`
  ctx.font = 'bold 56px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('🎉 关卡通关！', CANVAS_WIDTH / 2 + 3, textY + 3)

  const textGrad = ctx.createLinearGradient(
    CANVAS_WIDTH / 2 - 200,
    textY - 30,
    CANVAS_WIDTH / 2 + 200,
    textY + 30
  )
  textGrad.addColorStop(0, '#FFD700')
  textGrad.addColorStop(0.5, '#FFF4B8')
  textGrad.addColorStop(1, '#FFD700')
  ctx.fillStyle = textGrad
  ctx.shadowColor = 'rgba(255, 215, 0, 0.8)'
  ctx.shadowBlur = 30
  ctx.fillText('🎉 关卡通关！', CANVAS_WIDTH / 2, textY)
  ctx.shadowBlur = 0

  ctx.font = '20px -apple-system, "Segoe UI", Roboto, sans-serif'
  ctx.fillStyle = `rgba(209, 212, 216, ${alpha * 0.9})`
  ctx.fillText('所有目标点已被照亮，恭喜完成挑战！', CANVAS_WIDTH / 2, textY + 55 + yOffset * 0.8)

  ctx.restore()
}

export default CanvasBoard
