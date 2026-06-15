import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import { usePoemStore } from '../store/poemStore'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  amplitude: number
  frequency: number
  phase: number
  opacity: number
}

const ExhibitionCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const animationRef = useRef<number>(0)
  const startTimeRef = useRef<number>(0)
  const bgImageRef = useRef<HTMLImageElement | null>(null)
  const particleColorRef = useRef<[number, number, number]>([200, 180, 170])
  const lastFrameTimeRef = useRef<number>(0)
  const fpsRef = useRef<number>(0)

  const [isVisible, setIsVisible] = useState(false)
  const [visibleLines, setVisibleLines] = useState<boolean[]>([])
  const [typedTexts, setTypedTexts] = useState<string[]>([])
  const poemLinesRef = useRef<{ text: string; fontFamily: string; fontSize: number; color: string; id: string }[]>([])
  const typewriterFrameRef = useRef<number>(0)

  const { isExhibition, exhibitionPoemId, poems, endExhibition } = usePoemStore()

  const poem = useMemo(() => 
    poems.find(p => p.id === exhibitionPoemId),
    [poems, exhibitionPoemId]
  )

  const hexToRgb = useCallback((hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result
      ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
      : [200, 180, 170]
  }, [])

  const extractImageDominantColor = useCallback((img: HTMLImageElement): [number, number, number] => {
    const tempCanvas = document.createElement('canvas')
    const ctx = tempCanvas.getContext('2d')
    if (!ctx) return [200, 180, 170]

    const size = 50
    tempCanvas.width = size
    tempCanvas.height = size
    ctx.drawImage(img, 0, 0, size, size)

    try {
      const imageData = ctx.getImageData(0, 0, size, size)
      let r = 0, g = 0, b = 0, count = 0
      const data = imageData.data
      for (let i = 0; i < data.length; i += 4) {
        r += data[i]
        g += data[i + 1]
        b += data[i + 2]
        count++
      }
      return [Math.round(r / count), Math.round(g / count), Math.round(b / count)]
    } catch {
      return [200, 180, 170]
    }
  }, [])

  const initParticles = useCallback((width: number, height: number) => {
    const particles: Particle[] = []
    const count = 200

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.2,
        size: Math.random() * 2.5 + 0.5,
        amplitude: Math.random() * 25 + 8,
        frequency: Math.random() * 0.015 + 0.003,
        phase: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.35 + 0.08
      })
    }

    particlesRef.current = particles
  }, [])

  const drawBackground = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    if (!poem) return

    if (poem.backgroundType === 'image' && bgImageRef.current) {
      const img = bgImageRef.current
      const scale = Math.max(width / img.width, height / img.height)
      const w = img.width * scale
      const h = img.height * scale
      const x = (width - w) / 2
      const y = (height - h) / 2
      ctx.drawImage(img, x, y, w, h)
    } else {
      const gradient = ctx.createLinearGradient(0, 0, width, height)
      gradient.addColorStop(0, poem.gradientColors[0])
      gradient.addColorStop(1, poem.gradientColors[1])
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    }
  }, [poem])

  const animate = useCallback((timestamp: number) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    if (!lastFrameTimeRef.current) {
      lastFrameTimeRef.current = timestamp
    }
    const delta = timestamp - lastFrameTimeRef.current
    lastFrameTimeRef.current = timestamp
    fpsRef.current = 1000 / delta

    const dpr = window.devicePixelRatio || 1
    const cssWidth = window.innerWidth
    const cssHeight = window.innerHeight
    const time = (timestamp - startTimeRef.current) * 0.001

    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(dpr, dpr)

    drawBackground(ctx, cssWidth, cssHeight)

    const [r, g, b] = particleColorRef.current
    const particles = particlesRef.current

    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 1)`
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i]

      p.x += p.vx
      p.y += p.vy

      const sineX = Math.sin(time * p.frequency + p.phase) * p.amplitude
      const sineY = Math.cos(time * p.frequency * 0.6 + p.phase) * p.amplitude * 0.4
      const drawX = p.x + sineX
      const drawY = p.y + sineY

      if (p.x < -60) p.x = cssWidth + 60
      if (p.x > cssWidth + 60) p.x = -60
      if (p.y < -60) p.y = cssHeight + 60
      if (p.y > cssHeight + 60) p.y = -60

      ctx.globalAlpha = p.opacity
      ctx.beginPath()
      ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2)
      ctx.fill()
    }
    ctx.globalAlpha = 1

    animationRef.current = requestAnimationFrame(animate)
  }, [drawBackground])

  useEffect(() => {
    if (!isExhibition || !poem) {
      setIsVisible(false)
      return
    }

    const canvas = canvasRef.current
    if (!canvas) return

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
      canvas.style.width = `${window.innerWidth}px`
      canvas.style.height = `${window.innerHeight}px`
      initParticles(window.innerWidth, window.innerHeight)
    }

    if (poem.backgroundType === 'gradient') {
      particleColorRef.current = hexToRgb(poem.gradientColors[0])
    }

    if (poem.backgroundType === 'image' && poem.backgroundImage) {
      const img = new Image()
      img.onload = () => {
        bgImageRef.current = img
        particleColorRef.current = extractImageDominantColor(img)
        resizeCanvas()
        startTimeRef.current = performance.now()
        animationRef.current = requestAnimationFrame(animate)
      }
      img.src = poem.backgroundImage
    } else {
      bgImageRef.current = null
      resizeCanvas()
      startTimeRef.current = performance.now()
      animationRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('resize', resizeCanvas)

    const visibleTimer = setTimeout(() => {
      setIsVisible(true)
    }, 100)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      clearTimeout(visibleTimer)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      lastFrameTimeRef.current = 0
    }
  }, [isExhibition, poem?.id, animate, initParticles, hexToRgb, extractImageDominantColor, poem])

  useEffect(() => {
    if (poem) {
      poemLinesRef.current = poem.lines.map(l => ({ ...l }))
    }
  }, [poem])

  useEffect(() => {
    if (!isVisible || !poem || poem.lines.length === 0) return

    const lines = poem.lines

    setVisibleLines(new Array(lines.length).fill(false))
    setTypedTexts(new Array(lines.length).fill(''))

    const lineDelay = 1000
    const charDelay = 70
    const startTimestamp = performance.now()
    let rafId = 0

    const animate = (timestamp: number) => {
      const elapsed = timestamp - startTimestamp
      let allDone = true

      const newVisibleLines: boolean[] = []
      const newTypedTexts: string[] = []

      lines.forEach((line, lineIndex) => {
        const lineStart = lineIndex * lineDelay
        if (elapsed < lineStart) {
          newVisibleLines.push(false)
          newTypedTexts.push('')
          allDone = false
          return
        }

        newVisibleLines.push(true)
        const charElapsed = elapsed - lineStart
        const charsToShow = Math.min(
          Math.floor(charElapsed / charDelay),
          line.text.length
        )
        const typed = line.text.slice(0, charsToShow)
        newTypedTexts.push(typed)

        if (charsToShow < line.text.length) {
          allDone = false
        }
      })

      setVisibleLines(prev => {
        if (prev.length !== newVisibleLines.length || 
            prev.some((v, i) => v !== newVisibleLines[i])) {
          return newVisibleLines
        }
        return prev
      })

      setTypedTexts(prev => {
        if (prev.length !== newTypedTexts.length ||
            prev.some((t, i) => t !== newTypedTexts[i])) {
          return newTypedTexts
        }
        return prev
      })

      if (!allDone) {
        rafId = requestAnimationFrame(animate)
      }
    }

    rafId = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(rafId)
    }
  }, [isVisible, poem?.id, poem?.lines?.length])

  const handleClose = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => {
      endExhibition()
    }, 500)
  }, [endExhibition])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isExhibition) {
        handleClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isExhibition, handleClose])

  if (!isExhibition || !poem) return null

  return (
    <div
      ref={containerRef}
      className={`exhibition-overlay ${isVisible ? 'visible' : ''}`}
    >
      <canvas ref={canvasRef} className="exhibition-canvas" />

      <div className="exhibition-poem">
        {poem.lines.map((line, index) => (
          <div
            key={line.id}
            className={`exhibition-line ${visibleLines[index] ? 'visible' : ''}`}
            style={{
              fontFamily: line.fontFamily,
              fontSize: `${line.fontSize}px`,
              color: line.color
            }}
          >
            {typedTexts[index]}
            {visibleLines[index] && typedTexts[index] !== line.text && (
              <span className="typing-cursor">|</span>
            )}
          </div>
        ))}
      </div>

      <button className="exhibition-close" onClick={handleClose} title="关闭 (Esc)">
        ×
      </button>

      <div className="exhibition-hint">按 ESC 退出展出</div>
    </div>
  )
}

export default ExhibitionCanvas
