import React, { useEffect, useRef, useCallback } from 'react'
import { useGameStore } from './Engine'

const UI: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const animationRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const stateRef = useRef(useGameStore.getState())

  const {
    phase,
    countdown,
    countdownTimer,
    safeZone,
    score,
    lives,
    blurAmount,
    setInput,
    setCanvasSize,
    reset,
    update,
  } = useGameStore()

  useEffect(() => {
    stateRef.current = useGameStore.getState()
    const unsubscribe = useGameStore.subscribe((s) => {
      stateRef.current = s
    })
    return unsubscribe
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setInput({ up: true })
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          setInput({ down: true })
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setInput({ left: true })
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          setInput({ right: true })
          break
      }
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          setInput({ up: false })
          break
        case 'ArrowDown':
        case 's':
        case 'S':
          setInput({ down: false })
          break
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setInput({ left: false })
          break
        case 'ArrowRight':
        case 'd':
        case 'D':
          setInput({ right: false })
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [setInput])

  useEffect(() => {
    const handleResize = () => {
      setCanvasSize(window.innerWidth, window.innerHeight)
      const canvas = canvasRef.current
      if (canvas) {
        const dpr = window.devicePixelRatio || 1
        canvas.width = window.innerWidth * dpr
        canvas.height = window.innerHeight * dpr
        canvas.style.width = `${window.innerWidth}px`
        canvas.style.height = `${window.innerHeight}px`
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [setCanvasSize])

  const drawFrame = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const s = stateRef.current
    const { canvasWidth: w, canvasHeight: h } = s

    const bg = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2)
    bg.addColorStop(0, '#1A1A3A')
    bg.addColorStop(1, '#0A0A1A')
    ctx.fillStyle = bg
    ctx.fillRect(0, 0, w, h)

    for (const t of s.trails) {
      const alpha = (t.life / t.maxLife) * 0.05
      ctx.beginPath()
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2)
      ctx.fillStyle = hexWithAlpha(t.color, alpha)
      ctx.fill()
    }

    {
      const { centerX: cx, centerY: cy, radius, initialRadius } = s.safeZone
      ctx.save()
      ctx.beginPath()
      ctx.arc(cx, cy, radius, 0, Math.PI * 2)
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius)
      grad.addColorStop(0, 'rgba(0, 229, 255, 0.1)')
      grad.addColorStop(1, 'rgba(0, 229, 255, 0)')
      ctx.fillStyle = grad
      ctx.fill()
      ctx.strokeStyle = 'rgba(0, 229, 255, 0.5)'
      ctx.lineWidth = 2
      ctx.shadowColor = '#00E5FF'
      ctx.shadowBlur = 12
      ctx.stroke()
      ctx.restore()
      void initialRadius
    }

    for (const n of s.notes) {
      const flash = 0.6 + 0.4 * (0.5 + 0.5 * Math.sin(n.flashPhase))
      ctx.save()
      ctx.translate(n.x, n.y)
      ctx.rotate(n.rotation)
      ctx.beginPath()
      ctx.arc(0, 0, 5, 0, Math.PI * 2)
      ctx.fillStyle = `rgba(255, 215, 0, ${flash})`
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 10
      ctx.fill()
      ctx.beginPath()
      ctx.arc(0, 0, 2, 0, Math.PI * 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.fill()
      ctx.restore()
    }

    for (const p of s.pulses) {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2)
      ctx.fillStyle = p.color
      ctx.shadowColor = p.color
      ctx.shadowBlur = 8
      ctx.fill()
      ctx.shadowBlur = 0
    }

    for (const p of s.particles) {
      const alpha = p.life / p.maxLife
      ctx.beginPath()
      ctx.arc(p.x, p.y, 3 * alpha, 0, Math.PI * 2)
      ctx.fillStyle = hexWithAlpha(p.color, alpha)
      ctx.fill()
    }

    {
      const b = s.ball
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2)
      ctx.fillStyle = '#FFD700'
      ctx.shadowColor = '#FFD700'
      ctx.shadowBlur = 4
      ctx.fill()
      ctx.shadowBlur = 0
    }

    if (s.flashAlpha > 0) {
      ctx.fillStyle = `rgba(255, 0, 0, ${s.flashAlpha * 0.5})`
      ctx.fillRect(0, 0, w, h)
    }
  }, [])

  useEffect(() => {
    const loop = (ts: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = ts
      const delta = (ts - lastTimeRef.current) / 1000
      lastTimeRef.current = ts
      update(delta)
      drawFrame()
      animationRef.current = requestAnimationFrame(loop)
    }
    animationRef.current = requestAnimationFrame(loop)
    return () => {
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [update, drawFrame])

  const handleRestart = () => {
    reset()
  }

  const countdownProgress = Math.min(1, countdownTimer / 1)
  const showCountdown = phase === 'countdown'

  const showGameOver = phase === 'gameover' && blurAmount >= 1

  const safeProgress = Math.max(0, Math.min(1, safeZone.radius / safeZone.initialRadius))

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <canvas ref={canvasRef} style={{ display: 'block' }} />

      <div style={{
        position: 'absolute',
        top: 16,
        left: 16,
        display: 'flex',
        gap: 6,
        pointerEvents: 'none',
      }}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            style={{
              width: 12,
              height: 12,
              backgroundColor: i < lives ? '#FF4444' : '#333333',
              boxShadow: i < lives ? '0 0 6px #FF4444' : 'none',
              transition: 'background-color 0.2s',
            }}
          />
        ))}
      </div>

      <div style={{
        position: 'absolute',
        top: 16,
        right: 16,
        fontFamily: 'monospace',
        fontSize: 20,
        color: '#FFFFFF',
        textShadow: '0 0 8px rgba(255,255,255,0.6)',
        pointerEvents: 'none',
      }}>
        {score.toString().padStart(6, '0')}
      </div>

      <div style={{
        position: 'absolute',
        top: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        width: 200,
        height: 6,
        backgroundColor: '#333333',
        borderRadius: 3,
        overflow: 'hidden',
        pointerEvents: 'none',
      }}>
        <div style={{
          width: `${safeProgress * 100}%`,
          height: '100%',
          backgroundColor: '#00E5FF',
          boxShadow: '0 0 6px #00E5FF',
          transition: 'width 0.05s linear',
        }} />
      </div>

      {showCountdown && countdown > 0 && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
        }}>
          <div style={{
            fontSize: 180,
            fontFamily: 'monospace',
            fontWeight: 'bold',
            color: '#00E5FF',
            textShadow: '0 0 30px #00E5FF, 0 0 60px rgba(0,229,255,0.5)',
            opacity: countdownProgress,
            transition: 'opacity 0.3s ease-out',
          }}>
            {countdown}
          </div>
        </div>
      )}

      {phase === 'gameover' && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `rgba(255, 255, 255, ${blurAmount})`,
          backdropFilter: `blur(${blurAmount * 20}px)`,
          WebkitBackdropFilter: `blur(${blurAmount * 20}px)`,
          pointerEvents: showGameOver ? 'auto' : 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: blurAmount,
          transition: 'opacity 0.3s',
        }}>
          {showGameOver && (
            <div style={{
              textAlign: 'center',
              padding: 48,
              borderRadius: 16,
              background: 'rgba(10, 10, 26, 0.95)',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              boxShadow: '0 0 40px rgba(0, 229, 255, 0.2)',
            }}>
              <div style={{
                fontSize: 48,
                fontFamily: 'monospace',
                fontWeight: 'bold',
                color: '#FF6B6B',
                marginBottom: 16,
                textShadow: '0 0 20px rgba(255,107,107,0.6)',
              }}>
                GAME OVER
              </div>
              <div style={{
                fontSize: 24,
                fontFamily: 'monospace',
                color: '#FFFFFF',
                marginBottom: 32,
              }}>
                Final Score: <span style={{ color: '#FFD700', textShadow: '0 0 10px #FFD700' }}>{score}</span>
              </div>
              <button
                onClick={handleRestart}
                style={{
                  padding: '14px 40px',
                  fontSize: 20,
                  fontFamily: 'monospace',
                  fontWeight: 'bold',
                  color: '#0A0A1A',
                  backgroundColor: '#00E5FF',
                  border: 'none',
                  borderRadius: 8,
                  cursor: 'pointer',
                  boxShadow: '0 0 20px rgba(0, 229, 255, 0.5)',
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.05)'
                  e.currentTarget.style.boxShadow = '0 0 30px rgba(0, 229, 255, 0.8)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)'
                  e.currentTarget.style.boxShadow = '0 0 20px rgba(0, 229, 255, 0.5)'
                }}
              >
                RESTART
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function hexWithAlpha(hex: string, alpha: number): string {
  const h = hex.replace('#', '')
  const r = parseInt(h.substring(0, 2), 16)
  const g = parseInt(h.substring(2, 4), 16)
  const b = parseInt(h.substring(4, 6), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export default UI
