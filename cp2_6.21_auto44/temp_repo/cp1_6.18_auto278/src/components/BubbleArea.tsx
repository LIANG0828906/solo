import { useEffect, useRef, useState, useCallback } from 'react'
import { useStore, BubbleData } from '../App'
import { createParticleSystem, ParticleSystem } from '../utils/particleEngine'

interface ActiveQuote {
  id: string
  text: string
  x: number
  y: number
  timestamp: number
}

interface BubbleAnimState {
  baseX: number
  baseY: number
  dx: number
  dy: number
  phase: number
  speed: number
  size: number
}

function getBubbleGradient(scheme: 'warm' | 'cool'): string {
  if (scheme === 'warm') {
    return 'radial-gradient(circle at 30% 30%, #FFD93D, #FF6B6B)'
  }
  return 'radial-gradient(circle at 30% 30%, #4D96FF, #6BCB77)'
}

function getBubbleMainColor(scheme: 'warm' | 'cool'): string {
  return scheme === 'warm' ? '#FF6B6B' : '#4D96FF'
}

export default function BubbleArea() {
  const bubbles = useStore((s) => s.bubbles)
  const speed = useStore((s) => s.speed)
  const popBubble = useStore((s) => s.popBubble)
  const resetBubbles = useStore((s) => s.resetBubbles)
  const clickedCount = useStore((s) => s.clickedCount)

  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const bubbleEls = useRef<Map<string, HTMLDivElement>>(new Map())
  const animData = useRef<Map<string, BubbleAnimState>>(new Map())
  const particleSystem = useRef<ParticleSystem>(createParticleSystem())
  const animFrameRef = useRef<number>(0)
  const [activeQuotes, setActiveQuotes] = useState<ActiveQuote[]>([])
  const [expandingBubble, setExpandingBubble] = useState<string | null>(null)
  const quotesTimeouts = useRef<Map<string, number>>(new Map())

  const isMobile = useRef(typeof window !== 'undefined' && window.innerWidth < 768)

  useEffect(() => {
    const onResize = () => {
      isMobile.current = window.innerWidth < 768
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    const newAnimData = new Map<string, BubbleAnimState>()
    for (const b of bubbles) {
      if (b.popped) continue
      const existing = animData.current.get(b.id)
      if (existing) {
        newAnimData.set(b.id, existing)
      } else {
        const scaleFactor = isMobile.current ? 0.7 : 1
        newAnimData.set(b.id, {
          baseX: b.x * scaleFactor,
          baseY: b.y * scaleFactor,
          dx: (Math.random() - 0.5) * 2,
          dy: 0,
          phase: b.phase,
          speed: b.speed * speed,
          size: b.size * scaleFactor,
        })
      }
    }
    animData.current = newAnimData
  }, [bubbles, speed])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    let w = window.innerWidth
    let h = window.innerHeight
    canvas.width = w
    canvas.height = h

    const onResize = () => {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w
      canvas.height = h
    }
    window.addEventListener('resize', onResize)

    const startTime = performance.now()

    const animate = () => {
      const now = performance.now()
      const elapsed = (now - startTime) / 1000

      ctx.clearRect(0, 0, w, h)

      for (const [id, data] of animData.current) {
        const el = bubbleEls.current.get(id)
        if (!el) continue

        const currentSpeed = data.speed * speed
        const moveX = Math.sin(elapsed * currentSpeed * 0.5 + data.phase) * 30 * currentSpeed
        const moveY = Math.cos(elapsed * currentSpeed * 0.3 + data.phase * 1.3) * 15 * currentSpeed

        const nx = data.baseX + moveX
        const ny = data.baseY + moveY

        data.baseX += data.dx * currentSpeed * 0.3

        if (data.baseX < -data.size) {
          data.baseX = w + data.size
        } else if (data.baseX > w + data.size) {
          data.baseX = -data.size
        }

        el.style.transform = `translate3d(${nx}px, ${ny}px, 0)`
      }

      if (particleSystem.current.isAlive()) {
        particleSystem.current.update()
        particleSystem.current.draw(ctx)
      }

      animFrameRef.current = requestAnimationFrame(animate)
    }

    animFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animFrameRef.current)
      window.removeEventListener('resize', onResize)
    }
  }, [speed])

  const handleBubbleClick = useCallback(
    (bubble: BubbleData, e: React.MouseEvent) => {
      if (expandingBubble === bubble.id) return

      setExpandingBubble(bubble.id)

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2

      setTimeout(() => {
        popBubble(bubble.id)
        setExpandingBubble(null)

        const ps = particleSystem.current
        ps.addExplosion(cx, cy, getBubbleMainColor(bubble.colorScheme))
        ps.addRipple(cx, cy)

        const quoteId = `quote-${Date.now()}`
        setActiveQuotes((prev) => [
          ...prev,
          {
            id: quoteId,
            text: bubble.quote,
            x: cx,
            y: cy,
            timestamp: Date.now(),
          },
        ])

        const tid = window.setTimeout(() => {
          setActiveQuotes((prev) => prev.filter((q) => q.id !== quoteId))
        }, 3000)
        quotesTimeouts.current.set(quoteId, tid)
      }, 150)
    },
    [expandingBubble, popBubble]
  )

  useEffect(() => {
    return () => {
      for (const tid of quotesTimeouts.current.values()) {
        clearTimeout(tid)
      }
    }
  }, [])

  const activeBubbles = bubbles.filter((b) => !b.popped)

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        background:
          'radial-gradient(ellipse at center, #302B63 0%, #0F0C29 50%, #24243E 100%)',
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 10,
        }}
      />

      {activeBubbles.map((b) => {
        const isExpanding = expandingBubble === b.id
        return (
          <div
            key={b.id}
            ref={(el) => {
              if (el) bubbleEls.current.set(b.id, el)
              else bubbleEls.current.delete(b.id)
            }}
            onClick={(e) => handleBubbleClick(b, e)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: b.size,
              height: b.size,
              borderRadius: '50%',
              background: getBubbleGradient(b.colorScheme),
              opacity: 0.6,
              border: '1px solid rgba(255,255,255,0.3)',
              boxShadow: `0 0 ${b.size / 3}px ${getBubbleMainColor(b.colorScheme)}40, inset 0 -${b.size / 6}px ${b.size / 4}px rgba(0,0,0,0.15), inset 0 ${b.size / 8}px ${b.size / 4}px rgba(255,255,255,0.2)`,
              cursor: 'pointer',
              transform: 'translate3d(0,0,0)',
              transition: isExpanding
                ? 'transform 0.15s ease-out, opacity 0.15s ease-out'
                : 'none',
              transformOrigin: 'center center',
              scale: isExpanding ? '1.2' : '1',
              zIndex: 5,
              willChange: 'transform',
              pointerEvents: isExpanding ? 'none' : 'auto',
            }}
          />
        )
      })}

      {activeQuotes.map((q) => {
        const progress = Math.min((Date.now() - q.timestamp) / 1000, 1)
        return (
          <div
            key={q.id}
            style={{
              position: 'absolute',
              left: q.x,
              top: q.y - 20 * progress,
              transform: 'translate(-50%, -50%)',
              zIndex: 20,
              pointerEvents: 'none',
              animation: 'quoteFadeIn 0.3s ease-out, quoteFloat 1s ease-out',
            }}
          >
            <div
              style={{
                background:
                  'linear-gradient(135deg, rgba(102,126,234,0.3), rgba(118,75,162,0.3), rgba(240,147,251,0.3))',
                borderRadius: 16,
                padding: '16px 24px',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 0 30px rgba(102,126,234,0.3), 0 0 60px rgba(118,75,162,0.2)',
                maxWidth: '80vw',
                textAlign: 'center' as const,
              }}
            >
              <span
                style={{
                  fontFamily: 'KaiTi, STKaiti, serif',
                  fontSize: 24,
                  color: '#FFFFFF',
                  textShadow: '0 0 10px rgba(255,255,255,0.5)',
                  lineHeight: 1.6,
                  letterSpacing: 2,
                }}
              >
                {q.text}
              </span>
            </div>
          </div>
        )
      })}

      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: isMobile.current ? 80 : 80,
          background: 'rgba(255,255,255,0.15)',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 24,
          zIndex: 100,
          borderTop: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        <button
          onClick={resetBubbles}
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: '#FF6B6B',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'transform 0.5s ease',
            boxShadow: '0 0 12px rgba(255,107,107,0.5)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'rotate(360deg)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'rotate(0deg)'
          }}
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M1 4v6h6" />
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
          </svg>
        </button>

        <div
          style={{
            color: '#E0E0E0',
            fontSize: 18,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <span>已点亮</span>
          <span
            style={{
              fontFamily: 'monospace',
              color: '#FFD93D',
              fontWeight: 'bold',
              textShadow: '0 0 8px rgba(255,217,61,0.5)',
            }}
          >
            {clickedCount}
          </span>
          <span>个灵感</span>
        </div>
      </div>

      <style>{`
        @keyframes quoteFadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes quoteFloat {
          from { transform: translate(-50%, -50%); }
          to { transform: translate(-50%, calc(-50% - 20px)); }
        }
      `}</style>
    </div>
  )
}
