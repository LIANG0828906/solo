import { useState, useEffect, useRef, useCallback } from 'react'
import PageWrite from './PageWrite'
import { getRandomBottle, submitFeedback } from './api/bottle'
import type { Bottle } from './App'

interface PageHomeProps {
  userId: string
  onCaughtBottle: (bottle: Bottle) => void
  onUpdateFeedback: (bottleId: string, emoji: 'encourage' | 'speechlessness') => void
  onGoToPersonal: () => void
}

interface FloatingBottle {
  id: string
  x: number
  y: number
  delay: number
  size: number
}

function PageHome({ userId, onCaughtBottle, onUpdateFeedback, onGoToPersonal }: PageHomeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isWriteOpen, setIsWriteOpen] = useState(false)
  const [floatingBottles, setFloatingBottles] = useState<FloatingBottle[]>([])
  const [bubbles, setBubbles] = useState<{ id: string; x: number; delay: number }[]>([])
  const [isFishing, setIsFishing] = useState(false)
  const [caughtBottle, setCaughtBottle] = useState<Bottle | null>(null)
  const [showBottle, setShowBottle] = useState(false)
  const [showPaper, setShowPaper] = useState(false)
  const [bounceEmoji, setBounceEmoji] = useState<string | null>(null)
  const [caughtIds, setCaughtIds] = useState<string[]>([])
  const animationRef = useRef<number>()
  const timeRef = useRef(0)

  useEffect(() => {
    const bottles: FloatingBottle[] = []
    for (let i = 0; i < 8; i++) {
      bottles.push({
        id: `bottle-${i}`,
        x: 5 + Math.random() * 90,
        y: 20 + Math.random() * 40,
        delay: Math.random() * 2,
        size: 30 + Math.random() * 20
      })
    }
    setFloatingBottles(bottles)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const color1 = { r: 162, g: 210, b: 255 }
    const color2 = { r: 26, g: 58, b: 92 }

    const drawWave = (yOffset: number, amplitude: number, frequency: number, speed: number, alpha: number) => {
      ctx.beginPath()
      ctx.moveTo(0, canvas.height)
      
      for (let x = 0; x <= canvas.width; x += 5) {
        const y = yOffset + Math.sin(x * frequency + timeRef.current * speed) * amplitude
        ctx.lineTo(x, y)
      }
      
      ctx.lineTo(canvas.width, canvas.height)
      ctx.closePath()
      
      const gradient = ctx.createLinearGradient(0, yOffset - amplitude, 0, canvas.height)
      gradient.addColorStop(0, `rgba(${color1.r}, ${color1.g}, ${color1.b}, ${alpha})`)
      gradient.addColorStop(1, `rgba(${color2.r}, ${color2.g}, ${color2.b}, ${alpha})`)
      ctx.fillStyle = gradient
      ctx.fill()
    }

    const drawFoam = (yOffset: number, amplitude: number, frequency: number, speed: number) => {
      ctx.beginPath()
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.lineWidth = 3
      
      for (let x = 0; x <= canvas.width; x += 5) {
        const y = yOffset + Math.sin(x * frequency + timeRef.current * speed) * amplitude
        if (x === 0) {
          ctx.moveTo(x, y)
        } else {
          ctx.lineTo(x, y)
        }
      }
      ctx.stroke()
    }

    const animate = () => {
      timeRef.current += 0.016
      
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      const skyGradient = ctx.createLinearGradient(0, 0, 0, canvas.height * 0.3)
      skyGradient.addColorStop(0, 'rgba(255, 250, 240, 1)')
      skyGradient.addColorStop(1, 'rgba(162, 210, 255, 0.8)')
      ctx.fillStyle = skyGradient
      ctx.fillRect(0, 0, canvas.width, canvas.height * 0.3)
      
      drawWave(canvas.height * 0.35, 25, 0.008, 0.5, 0.9)
      drawFoam(canvas.height * 0.35, 25, 0.008, 0.5)
      
      drawWave(canvas.height * 0.5, 35, 0.006, 0.8, 0.85)
      drawFoam(canvas.height * 0.5, 35, 0.006, 0.8)
      
      drawWave(canvas.height * 0.7, 45, 0.004, 1.2, 0.9)
      drawFoam(canvas.height * 0.7, 45, 0.004, 1.2)
      
      const bottomGradient = ctx.createLinearGradient(0, canvas.height * 0.7, 0, canvas.height)
      bottomGradient.addColorStop(0, `rgba(${color2.r}, ${color2.g}, ${color2.b}, 0.9)`)
      bottomGradient.addColorStop(1, `rgba(${color2.r - 10}, ${color2.g - 10}, ${color2.b - 20}, 1)`)
      ctx.fillStyle = bottomGradient
      ctx.fillRect(0, canvas.height * 0.7, canvas.width, canvas.height * 0.3)
      
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animate()

    return () => {
      window.removeEventListener('resize', resize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  const handleWriteSubmit = useCallback(() => {
    const newBubbles = []
    for (let i = 0; i < 5; i++) {
      newBubbles.push({
        id: `bubble-${Date.now()}-${i}`,
        x: 40 + Math.random() * 20,
        delay: i * 0.15
      })
    }
    setBubbles(prev => [...prev, ...newBubbles])
    
    setTimeout(() => {
      setBubbles(prev => prev.filter(b => !newBubbles.find(nb => nb.id === b.id)))
    }, 3000)
  }, [])

  const handleFish = useCallback(async () => {
    if (isFishing || caughtBottle) return
    
    setIsFishing(true)
    
    setTimeout(async () => {
      try {
        const bottle = await getRandomBottle(caughtIds)
        if (bottle) {
          setCaughtBottle(bottle)
          setShowBottle(true)
          setCaughtIds(prev => [...prev, bottle.id])
          onCaughtBottle(bottle)
          
          setTimeout(() => {
            setShowPaper(true)
          }, 1500)
        }
      } catch (error) {
        console.error('Failed to get random bottle:', error)
      } finally {
        setIsFishing(false)
      }
    }, 1000)
  }, [isFishing, caughtBottle, caughtIds, onCaughtBottle])

  const handleCloseBottle = () => {
    setShowPaper(false)
    setTimeout(() => {
      setShowBottle(false)
      setCaughtBottle(null)
    }, 300)
  }

  const handleFeedback = async (emoji: 'encourage' | 'speechlessness') => {
    if (!caughtBottle) return
    
    setBounceEmoji(emoji)
    setTimeout(() => setBounceEmoji(null), 300)
    
    try {
      await submitFeedback(caughtBottle.id, { emoji })
      onUpdateFeedback(caughtBottle.id, emoji)
    } catch (error) {
      console.error('Failed to submit feedback:', error)
    }
  }

  const BottleIcon = ({ size = 40, style = {} }: { size?: number; style?: React.CSSProperties }) => (
    <div style={{ width: size, height: size * 1.3, position: 'relative', ...style }}>
      <svg viewBox="0 0 40 52" width={size} height={size * 1.3}>
        <path
          d="M15 2 L25 2 L25 10 L28 12 L32 20 L32 45 Q32 50 27 50 L13 50 Q8 50 8 45 L8 20 L12 12 L15 10 Z"
          fill="rgba(255, 255, 255, 0.4)"
          stroke="rgba(255, 255, 255, 0.7)"
          strokeWidth="1.5"
        />
        <path
          d="M15 2 L25 2 L25 8 L15 8 Z"
          fill="rgba(200, 180, 160, 0.8)"
          stroke="rgba(180, 160, 140, 0.9)"
          strokeWidth="1"
        />
        <ellipse
          cx="14"
          cy="28"
          rx="3"
          ry="4"
          fill="rgba(255, 209, 102, 0.6)"
        />
      </svg>
    </div>
  )

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%'
        }}
      />

      <h1
        style={{
          position: 'absolute',
          top: '40px',
          left: '50%',
          transform: 'translateX(-50%)',
          fontSize: '32px',
          fontWeight: 700,
          color: '#1a3a5c',
          textShadow: '2px 2px 8px rgba(255, 255, 255, 0.8)',
          zIndex: 10,
          letterSpacing: '4px'
        }}
      >
        🌊 灵感漂流瓶
      </h1>

      <button
        onClick={onGoToPersonal}
        style={{
          position: 'absolute',
          top: '40px',
          right: '24px',
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(162, 210, 255, 0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '24px',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 300ms ease-out',
          boxShadow: '0 4px 15px rgba(26, 58, 92, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(26, 58, 92, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(26, 58, 92, 0.2)'
        }}
      >
        👤
      </button>

      {floatingBottles.map((bottle) => (
        <div
          key={bottle.id}
          style={{
            position: 'absolute',
            left: `${bottle.x}%`,
            top: `${bottle.y}%`,
            animation: `float 3s ease-in-out infinite`,
            animationDelay: `${bottle.delay}s`,
            zIndex: 5,
            pointerEvents: 'none'
          }}
        >
          <BottleIcon size={bottle.size} />
        </div>
      ))}

      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          style={{
            position: 'absolute',
            left: `${bubble.x}%`,
            bottom: '10%',
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(162, 210, 255, 0.4))',
            border: '2px solid rgba(255, 255, 255, 0.6)',
            animation: 'bubbleRise 2.5s ease-out forwards',
            animationDelay: `${bubble.delay}s`,
            zIndex: 15
          }}
        />
      ))}

      <button
        onClick={handleFish}
        disabled={isFishing || !!caughtBottle}
        style={{
          position: 'absolute',
          left: '24px',
          bottom: '24px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: isFishing || caughtBottle ? 'rgba(162, 210, 255, 0.5)' : 'rgba(255, 255, 255, 0.9)',
          backdropFilter: 'blur(10px)',
          border: '3px solid #a2d2ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          cursor: isFishing || caughtBottle ? 'not-allowed' : 'pointer',
          zIndex: 10,
          transition: 'all 300ms ease-out',
          boxShadow: '0 4px 15px rgba(26, 58, 92, 0.2)',
          animation: isFishing ? 'rotate 1s ease-in-out' : 'none'
        }}
        onMouseEnter={(e) => {
          if (!isFishing && !caughtBottle) {
            e.currentTarget.style.transform = 'scale(1.1)'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(26, 58, 92, 0.3)'
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)'
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(26, 58, 92, 0.2)'
        }}
      >
        🎣
      </button>

      <button
        onClick={() => setIsWriteOpen(true)}
        style={{
          position: 'absolute',
          right: '24px',
          bottom: '24px',
          width: '64px',
          height: '64px',
          borderRadius: '50%',
          background: '#ffd166',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '32px',
          cursor: 'pointer',
          zIndex: 10,
          transition: 'all 300ms ease-out',
          boxShadow: '0 4px 15px rgba(255, 209, 102, 0.4)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1) rotate(15deg)'
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 209, 102, 0.5)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1) rotate(0deg)'
          e.currentTarget.style.boxShadow = '0 4px 15px rgba(255, 209, 102, 0.4)'
        }}
      >
        ✉️
      </button>

      {showBottle && caughtBottle && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(26, 58, 92, 0.6)',
            backdropFilter: 'blur(8px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'fadeIn 0.3s ease-out forwards'
          }}
          onClick={!showPaper ? undefined : handleCloseBottle}
        >
          {!showPaper ? (
            <div
              style={{
                animation: 'bottleRise 1.5s ease-out forwards',
                position: 'relative'
              }}
            >
              <BottleIcon size={120} />
            </div>
          ) : (
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                maxWidth: '500px',
                width: '90%',
                animation: 'paperUnfold 0.5s ease-out forwards',
                transformOrigin: 'top center'
              }}
            >
              <div
                style={{
                  background: 'linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)',
                  borderRadius: '16px',
                  padding: '32px 24px',
                  boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
                  position: 'relative'
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    top: '-10px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '60px',
                    height: '20px',
                    background: '#ffd166',
                    borderRadius: '4px'
                  }}
                />

                {caughtBottle.imageUrl && (
                  <div style={{ marginBottom: '16px' }}>
                    <img
                      src={caughtBottle.imageUrl}
                      alt="Bottle image"
                      style={{
                        width: '100%',
                        maxHeight: '250px',
                        objectFit: 'cover',
                        borderRadius: '12px',
                        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                      }}
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                      }}
                    />
                  </div>
                )}

                <p
                  style={{
                    fontSize: '18px',
                    lineHeight: 1.8,
                    color: '#1a3a5c',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                    marginBottom: '24px'
                  }}
                >
                  {caughtBottle.text}
                </p>

                <div
                  style={{
                    fontSize: '12px',
                    color: 'rgba(26, 58, 92, 0.5)',
                    textAlign: 'right',
                    marginBottom: '20px'
                  }}
                >
                  📅 {new Date(caughtBottle.createdAt).toLocaleDateString('zh-CN')}
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: '32px'
                  }}
                >
                  <button
                    onClick={() => handleFeedback('encourage')}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: '3px solid #ffd166',
                      background: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '36px',
                      cursor: 'pointer',
                      transition: 'all 300ms ease-out',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: bounceEmoji === 'encourage' ? 'bounce 0.3s ease-out' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(255, 209, 102, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <span>💪</span>
                    <span style={{ fontSize: '12px', color: '#1a3a5c', marginTop: '2px' }}>
                      {caughtBottle.feedbackEmoji.encourage}
                    </span>
                  </button>

                  <button
                    onClick={() => handleFeedback('speechlessness')}
                    style={{
                      width: '80px',
                      height: '80px',
                      borderRadius: '50%',
                      border: '3px solid #a2d2ff',
                      background: 'rgba(255, 255, 255, 0.9)',
                      fontSize: '36px',
                      cursor: 'pointer',
                      transition: 'all 300ms ease-out',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      animation: bounceEmoji === 'speechlessness' ? 'bounce 0.3s ease-out' : 'none'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.1)'
                      e.currentTarget.style.boxShadow = '0 6px 20px rgba(162, 210, 255, 0.4)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)'
                      e.currentTarget.style.boxShadow = 'none'
                    }}
                  >
                    <span>😓</span>
                    <span style={{ fontSize: '12px', color: '#1a3a5c', marginTop: '2px' }}>
                      {caughtBottle.feedbackEmoji.speechlessness}
                    </span>
                  </button>
                </div>

                <button
                  onClick={handleCloseBottle}
                  style={{
                    marginTop: '24px',
                    width: '100%',
                    padding: '14px',
                    border: 'none',
                    borderRadius: '12px',
                    background: '#a2d2ff',
                    color: '#1a3a5c',
                    fontSize: '16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 300ms ease-out'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#8bc4f8'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = '#a2d2ff'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  关闭
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <PageWrite
        isOpen={isWriteOpen}
        onClose={() => setIsWriteOpen(false)}
        onSubmit={handleWriteSubmit}
        userId={userId}
      />
    </div>
  )
}

export default PageHome
