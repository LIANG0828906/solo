import React, { useRef, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react'
import { GameSnapshot } from './store'

export interface RendererHandle {
  draw: (snapshot: GameSnapshot) => void
}

function drawStars(ctx: CanvasRenderingContext2D, stars: GameSnapshot['stars']) {
  for (const star of stars) {
    ctx.beginPath()
    ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(255,255,255,${star.opacity.toFixed(2)})`
    ctx.fill()
  }
}

function drawShip(ctx: CanvasRenderingContext2D, snapshot: GameSnapshot) {
  const { ship } = snapshot
  const size = 20
  const halfSize = size / 2

  ctx.save()
  ctx.translate(ship.x, ship.y)

  ctx.beginPath()
  ctx.moveTo(halfSize, 0)
  ctx.lineTo(-halfSize, -halfSize * 0.8)
  ctx.lineTo(-halfSize * 0.4, 0)
  ctx.lineTo(-halfSize, halfSize * 0.8)
  ctx.closePath()
  ctx.fillStyle = '#1A237E'
  ctx.fill()
  ctx.strokeStyle = '#3949AB'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.restore()

  const barWidth = 80
  const barHeight = 6
  const barX = ship.x - barWidth / 2
  const barY = ship.y + halfSize + 8
  const healthRatio = ship.health / ship.maxHealth

  ctx.fillStyle = 'rgba(0,0,0,0.4)'
  ctx.beginPath()
  ctx.roundRect(barX, barY, barWidth, barHeight, 2)
  ctx.fill()

  if (healthRatio > 0) {
    const barColor = healthRatio > 0.5 ? '#4CAF50' : healthRatio > 0.25 ? '#FF9800' : '#F44336'
    ctx.fillStyle = barColor
    ctx.beginPath()
    ctx.roundRect(barX, barY, barWidth * healthRatio, barHeight, 2)
    ctx.fill()
  }

  if (ship.manualCooldown > 0) {
    const cdRatio = ship.manualCooldown / 1.5
    ctx.fillStyle = 'rgba(255,255,255,0.3)'
    ctx.beginPath()
    ctx.roundRect(barX, barY + barHeight + 2, barWidth * cdRatio, 2, 1)
    ctx.fill()
  }
}

function drawNormalMeteorite(ctx: CanvasRenderingContext2D, m: GameSnapshot['meteorites'][0]) {
  ctx.save()
  ctx.translate(m.x, m.y)
  ctx.rotate(m.rotation)

  const r = m.width / 2
  ctx.beginPath()
  const spikes = 8
  for (let i = 0; i < spikes * 2; i++) {
    const angle = (i / (spikes * 2)) * Math.PI * 2
    const jagged = i % 2 === 0 ? r : r * 0.7
    const px = Math.cos(angle) * jagged
    const py = Math.sin(angle) * jagged
    if (i === 0) ctx.moveTo(px, py)
    else ctx.lineTo(px, py)
  }
  ctx.closePath()
  ctx.fillStyle = '#795548'
  ctx.fill()
  ctx.strokeStyle = '#5D4037'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.restore()
}

function drawBurningMeteorite(ctx: CanvasRenderingContext2D, m: GameSnapshot['meteorites'][0]) {
  ctx.save()
  ctx.translate(m.x, m.y)
  ctx.rotate(m.rotation)

  ctx.beginPath()
  ctx.ellipse(0, 0, m.width / 2, m.height / 2, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#FF9800'
  ctx.fill()
  ctx.strokeStyle = '#E65100'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.ellipse(-m.width * 0.15, -m.height * 0.1, m.width * 0.25, m.height * 0.2, 0, 0, Math.PI * 2)
  ctx.fillStyle = '#FFCC02'
  ctx.fill()

  ctx.restore()
}

function drawSplittingMeteorite(ctx: CanvasRenderingContext2D, m: GameSnapshot['meteorites'][0]) {
  ctx.save()
  ctx.translate(m.x, m.y)
  ctx.rotate(m.rotation)

  const s = m.width / 2
  ctx.beginPath()
  ctx.moveTo(0, -s)
  ctx.lineTo(s, 0)
  ctx.lineTo(0, s)
  ctx.lineTo(-s, 0)
  ctx.closePath()
  ctx.fillStyle = '#E53935'
  ctx.fill()
  ctx.strokeStyle = '#B71C1C'
  ctx.lineWidth = 1
  ctx.stroke()

  ctx.beginPath()
  ctx.moveTo(0, -s * 0.4)
  ctx.lineTo(s * 0.4, 0)
  ctx.lineTo(0, s * 0.4)
  ctx.lineTo(-s * 0.4, 0)
  ctx.closePath()
  ctx.fillStyle = '#FF8A80'
  ctx.fill()

  ctx.restore()
}

function drawMeteorites(ctx: CanvasRenderingContext2D, meteorites: GameSnapshot['meteorites']) {
  for (const m of meteorites) {
    switch (m.type) {
      case 'normal':
        drawNormalMeteorite(ctx, m)
        break
      case 'burning':
        drawBurningMeteorite(ctx, m)
        break
      case 'splitting':
        drawSplittingMeteorite(ctx, m)
        break
    }
  }
}

function drawParticles(ctx: CanvasRenderingContext2D, particles: GameSnapshot['particles']) {
  for (const p of particles) {
    const alpha = Math.max(0, p.life / p.maxLife)
    ctx.beginPath()
    ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2)
    ctx.fillStyle = p.color
    ctx.globalAlpha = alpha * 0.8
    ctx.fill()
  }
  ctx.globalAlpha = 1
}

function drawExplosions(ctx: CanvasRenderingContext2D, explosions: GameSnapshot['explosions']) {
  for (const exp of explosions) {
    const progress = 1 - exp.life / exp.maxLife
    const alpha = 1 - progress
    const length = 24 * (0.3 + progress * 0.7)

    ctx.save()
    ctx.translate(exp.x, exp.y)
    ctx.globalAlpha = alpha

    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2
      ctx.beginPath()
      ctx.moveTo(0, 0)
      ctx.lineTo(Math.cos(angle) * length, Math.sin(angle) * length)
      ctx.strokeStyle = '#FF6D00'
      ctx.lineWidth = 2
      ctx.stroke()
    }

    ctx.globalAlpha = 1
    ctx.restore()
  }
}

function drawHUD(ctx: CanvasRenderingContext2D, snapshot: GameSnapshot, canvasWidth: number) {
  const score = snapshot.score.toString().padStart(6, '0')
  ctx.font = '18px "Courier New", monospace'
  ctx.textAlign = 'right'

  ctx.fillStyle = '#FFFFFF'
  ctx.fillText(`SCORE ${score}`, canvasWidth - 20, 32)

  ctx.fillStyle = '#FFD54F'
  ctx.fillText(`BPM ${snapshot.bpm}`, canvasWidth - 20, 56)
}

const GameCanvas = forwardRef<RendererHandle, {
  onManualDodge: (direction: number) => void
}>(({ onManualDodge }, ref) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const ctxRef = useRef<CanvasRenderingContext2D | null>(null)

  const resize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const dpr = window.devicePixelRatio || 1
    canvas.width = window.innerWidth * dpr
    canvas.height = window.innerHeight * dpr
    canvas.style.width = `${window.innerWidth}px`
    canvas.style.height = `${window.innerHeight}px`
    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.scale(dpr, dpr)
      ctxRef.current = ctx
    }
  }, [])

  useEffect(() => {
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [resize])

  useImperativeHandle(ref, () => ({
    draw: (snapshot: GameSnapshot) => {
      const ctx = ctxRef.current
      const canvas = canvasRef.current
      if (!ctx || !canvas) return

      const w = window.innerWidth
      const h = window.innerHeight

      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = snapshot.backgroundColor
      ctx.fillRect(0, 0, w, h)

      drawStars(ctx, snapshot.stars)
      drawParticles(ctx, snapshot.particles)
      drawMeteorites(ctx, snapshot.meteorites)
      drawShip(ctx, snapshot)
      drawExplosions(ctx, snapshot.explosions)
      drawHUD(ctx, snapshot, w)
    }
  }), [])

  const handleClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = e.clientX - rect.left
    const direction = x < rect.width / 2 ? -1 : 1
    onManualDodge(direction)
  }, [onManualDodge])

  return (
    <canvas
      ref={canvasRef}
      onClick={handleClick}
      style={{
        display: 'block',
        width: '100vw',
        height: '100vh',
        cursor: 'crosshair'
      }}
    />
  )
})

GameCanvas.displayName = 'GameCanvas'

interface GameOverScreenProps {
  score: number
  survivalTime: number
  maxBpm: number
  onRestart: () => void
  onShare: () => void
  visible: boolean
}

function GameOverScreen({ score, survivalTime, maxBpm, onRestart, onShare, visible }: GameOverScreenProps) {
  const timeStr = `${Math.floor(survivalTime / 60)}:${Math.floor(survivalTime % 60).toString().padStart(2, '0')}`

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.6)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.95)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      pointerEvents: visible ? 'auto' : 'none',
      zIndex: 10
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '12px'
      }}>
        <div style={{
          color: '#FFFFFF',
          fontSize: '24px',
          fontFamily: '"Courier New", monospace',
          textAlign: 'center',
          lineHeight: 1.6
        }}>
          <div>最终得分: {score}</div>
          <div>存活时间: {timeStr}</div>
          <div>最高BPM: {maxBpm}</div>
        </div>
        <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
          <button
            onClick={onRestart}
            style={{
              width: '160px',
              height: '44px',
              borderRadius: '6px',
              backgroundColor: '#E53935',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '16px',
              fontFamily: '"Courier New", monospace',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, transform 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#C62828'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#E53935'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            再来一次
          </button>
          <button
            onClick={onShare}
            style={{
              width: '160px',
              height: '44px',
              borderRadius: '6px',
              backgroundColor: '#616161',
              color: '#FFFFFF',
              border: 'none',
              fontSize: '16px',
              fontFamily: '"Courier New", monospace',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, transform 0.15s ease'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.backgroundColor = '#424242'
              e.currentTarget.style.transform = 'translateY(-2px)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.backgroundColor = '#616161'
              e.currentTarget.style.transform = 'translateY(0)'
            }}
          >
            分享成绩
          </button>
        </div>
      </div>
    </div>
  )
}

interface StartScreenProps {
  onStart: () => void
  visible: boolean
}

function StartScreen({ onStart, visible }: StartScreenProps) {
  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(13,27,42,0.9)',
      opacity: visible ? 1 : 0,
      transform: visible ? 'scale(1)' : 'scale(0.95)',
      transition: 'opacity 0.2s ease, transform 0.2s ease',
      pointerEvents: visible ? 'auto' : 'none',
      zIndex: 10
    }}>
      <h1 style={{
        color: '#FFD54F',
        fontSize: '48px',
        fontFamily: '"Courier New", monospace',
        marginBottom: '16px',
        letterSpacing: '4px'
      }}>
        节奏星际
      </h1>
      <p style={{
        color: 'rgba(255,255,255,0.7)',
        fontSize: '14px',
        fontFamily: '"Courier New", monospace',
        marginBottom: '32px',
        textAlign: 'center',
        lineHeight: 1.8
      }}>
        用声音节奏驾驶飞船躲避陨石<br />
        低频重音 → 跳跃 | 高频段落 → 闪避<br />
        点击屏幕左/右侧可手动微调位置
      </p>
      <button
        onClick={onStart}
        style={{
          width: '200px',
          height: '50px',
          borderRadius: '8px',
          backgroundColor: '#1A237E',
          color: '#FFD54F',
          border: '2px solid #FFD54F',
          fontSize: '18px',
          fontFamily: '"Courier New", monospace',
          cursor: 'pointer',
          transition: 'background-color 0.15s ease, transform 0.15s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#283593'
          e.currentTarget.style.transform = 'translateY(-2px)'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#1A237E'
          e.currentTarget.style.transform = 'translateY(0)'
        }}
      >
        开始游戏
      </button>
    </div>
  )
}

export { GameCanvas, GameOverScreen, StartScreen }
