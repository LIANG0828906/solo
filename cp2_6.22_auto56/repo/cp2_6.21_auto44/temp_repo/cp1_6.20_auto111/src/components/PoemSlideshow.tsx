import React, { useEffect, useRef, useState, useCallback } from 'react'
import { getThemeStyles, applyTheme } from '@/core/themeEngine'
import { animateLines, animateBackgroundTransition } from '@/core/animationEngine'
import type { Poem, PoemParagraph, ParticleConfig } from '@/types'

interface PoemSlideshowProps {
  poem: Poem
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
}

const PoemSlideshow: React.FC<PoemSlideshowProps> = ({ poem }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const slideshowRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentParagraphIndex, setCurrentParagraphIndex] = useState(0)
  const [isAnimating, setIsAnimating] = useState(false)
  const animationRef = useRef<number | null>(null)
  const particlesRef = useRef<Particle[]>([])
  const particleConfigRef = useRef<ParticleConfig | null>(null)
  const lastTimeRef = useRef<number>(0)
  const lineAnimCleanupRef = useRef<(() => void) | null>(null)
  const bgAnimCleanupRef = useRef<(() => void) | null>(null)

  const themeConfig = getThemeStyles(poem.theme)

  useEffect(() => {
    applyTheme(poem.theme)
  }, [poem.theme])

  const initParticles = useCallback(() => {
    if (!canvasRef.current) return

    const config = themeConfig.particles
    particleConfigRef.current = config

    if (!config.enabled) {
      particlesRef.current = []
      return
    }

    const canvas = canvasRef.current
    const particles: Particle[] = []

    for (let i = 0; i < config.count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * config.speed,
        vy: (Math.random() - 0.5) * config.speed,
        size: config.size * (0.5 + Math.random() * 0.5),
        opacity: 0.3 + Math.random() * 0.7,
      })
    }

    particlesRef.current = particles
  }, [themeConfig.particles])

  const updateParticles = useCallback(() => {
    if (!canvasRef.current || !particleConfigRef.current?.enabled) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const config = particleConfigRef.current

    particlesRef.current.forEach((p) => {
      p.x += p.vx
      p.y += p.vy

      if (p.x < 0) p.x = canvas.width
      if (p.x > canvas.width) p.x = 0
      if (p.y < 0) p.y = canvas.height
      if (p.y > canvas.height) p.y = 0
    })

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    particlesRef.current.forEach((p) => {
      ctx.beginPath()
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
      ctx.fillStyle = config.color.replace('rgba', 'rgba').replace(/[\d.]+\)$/, `${p.opacity})`)
      ctx.fill()
    })
  }, [])

  const animate = useCallback((timestamp: number) => {
    if (!lastTimeRef.current) lastTimeRef.current = timestamp
    const delta = timestamp - lastTimeRef.current

    if (delta >= 16) {
      updateParticles()
      lastTimeRef.current = timestamp
    }

    animationRef.current = requestAnimationFrame(animate)
  }, [updateParticles])

  const resizeCanvas = useCallback(() => {
    if (!containerRef.current || !canvasRef.current) return
    canvasRef.current.width = containerRef.current.clientWidth
    canvasRef.current.height = containerRef.current.clientHeight
    initParticles()
  }, [initParticles])

  useEffect(() => {
    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (lineAnimCleanupRef.current) {
        lineAnimCleanupRef.current()
      }
      if (bgAnimCleanupRef.current) {
        bgAnimCleanupRef.current()
      }
    }
  }, [resizeCanvas, animate])

  useEffect(() => {
    if (slideshowRef.current && !isAnimating) {
      setIsAnimating(true)

      if (lineAnimCleanupRef.current) {
        lineAnimCleanupRef.current()
      }
      slideshowRef.current.dataset.animationId = Math.random().toString(36)
      lineAnimCleanupRef.current = animateLines(slideshowRef.current, {
        delay: 200,
        duration: 800,
        stagger: 50,
      })

      setTimeout(() => setIsAnimating(false), 2000)
    }
  }, [currentParagraphIndex])

  const handleScroll = useCallback((e: React.WheelEvent) => {
    if (isAnimating) return

    if (e.deltaY > 50 && currentParagraphIndex < poem.paragraphs.length - 1) {
      const nextIndex = currentParagraphIndex + 1
      transitionToParagraph(nextIndex)
    } else if (e.deltaY < -50 && currentParagraphIndex > 0) {
      const prevIndex = currentParagraphIndex - 1
      transitionToParagraph(prevIndex)
    }
  }, [currentParagraphIndex, poem.paragraphs.length, isAnimating])

  const transitionToParagraph = (nextIndex: number) => {
    if (containerRef.current && themeConfig.particles.enabled) {
      const fromColor = themeConfig.cssVariables['--bg-primary']
      const toColor = themeConfig.cssVariables['--bg-secondary']
      
      if (bgAnimCleanupRef.current) {
        bgAnimCleanupRef.current()
      }
      bgAnimCleanupRef.current = animateBackgroundTransition(
        containerRef.current,
        fromColor,
        toColor,
        500
      )

      particlesRef.current.forEach((p) => {
        p.x += (Math.random() - 0.5) * 100
        p.y += (Math.random() - 0.5) * 100
      })
    }

    setCurrentParagraphIndex(nextIndex)
  }

  const currentParagraph = poem.paragraphs[currentParagraphIndex]

  const renderLine = (line: Poem['paragraphs'][0]['lines'][0]) => (
    <div
      key={line.id}
      className="poem-line"
      style={{
        fontFamily: line.style.fontFamily,
        fontSize: `${line.style.fontSize}px`,
        color: line.style.color,
        lineHeight: line.style.lineHeight,
        textAlign: line.style.textAlign,
        padding: '8px 16px',
        margin: '8px 0',
        borderRadius: 8,
        background: line.style.background || 'transparent',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
        opacity: 0,
        transform: 'translateY(10px)',
      }}
    >
      {line.text}
    </div>
  )

  return (
    <div
      ref={containerRef}
      onWheel={handleScroll}
      style={{
        ...containerStyle,
        background: themeConfig.backgroundGradient,
      }}
    >
      <canvas
        ref={canvasRef}
        style={canvasStyle}
      />

      <div style={headerStyle}>
        <h1 style={{
          ...titleStyle,
          color: themeConfig.cssVariables['--text-primary'],
          fontFamily: themeConfig.fontFamily,
        }}>
          {poem.title}
        </h1>
        <p style={{
          ...authorStyle,
          color: themeConfig.cssVariables['--text-secondary'],
        }}>
          {poem.author}
        </p>
      </div>

      <div ref={slideshowRef} style={contentStyle}>
        {currentParagraph && (
          <div style={paragraphStyle}>
            {currentParagraph.lines.map(renderLine)}
          </div>
        )}
      </div>

      <div style={indicatorStyle}>
        {poem.paragraphs.map((_: PoemParagraph, index: number) => (
          <div
            key={index}
            onClick={() => transitionToParagraph(index)}
            style={{
              ...dotStyle,
              backgroundColor: index === currentParagraphIndex
                ? themeConfig.cssVariables['--text-primary']
                : themeConfig.cssVariables['--text-secondary'],
              opacity: index === currentParagraphIndex ? 1 : 0.4,
              transform: index === currentParagraphIndex ? 'scale(1.3)' : 'scale(1)',
            }}
          />
        ))}
      </div>

      <p style={hintStyle}>
        滚动切换段落
      </p>
    </div>
  )
}

const containerStyle: React.CSSProperties = {
  position: 'relative',
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  overflow: 'hidden',
  transition: 'background 0.5s ease-in-out',
}

const canvasStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  pointerEvents: 'none',
}

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: 60,
  zIndex: 1,
}

const titleStyle: React.CSSProperties = {
  fontSize: 48,
  fontWeight: 600,
  marginBottom: 16,
  letterSpacing: '0.05em',
}

