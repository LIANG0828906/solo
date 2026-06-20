import { useEffect, useRef, useCallback } from 'react'
import { useParticleStore } from '../store/particleStore'

interface ParticleCanvasProps {
  onFpsUpdate: (fps: number) => void
  canvasRef: React.RefObject<HTMLCanvasElement>
}

export default function ParticleCanvas({ onFpsUpdate, canvasRef }: ParticleCanvasProps) {
  const animationRef = useRef<number>(0)
  const lastTimeRef = useRef<number>(0)
  const frameCountRef = useRef<number>(0)
  const fpsTimeRef = useRef<number>(0)
  const lastStarTimeRef = useRef<number>(0)
  const particleEmitTimerRef = useRef<number>(0)

  const {
    particles,
    stars,
    gravityPointX,
    gravityPointY,
    isMouseDown,
    isRightMouseDown,
    mouseX,
    mouseY,
    lastMouseX,
    lastMouseY,
    setCanvasSize,
    setMouseDown,
    setRightMouseDown,
    setMousePosition,
    setGravityPoint,
    addParticle,
    updateParticles,
    addStars,
    updateStars,
  } = useParticleStore()

  const getMousePos = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement> | MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return { x: 0, y: 0 }
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      }
    },
    [canvasRef]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e)
      if (e.button === 0) {
        setMouseDown(true, pos.x, pos.y)
        particleEmitTimerRef.current = 0
      } else if (e.button === 2) {
        setRightMouseDown(true, pos.x, pos.y)
      }
    },
    [getMousePos, setMouseDown, setRightMouseDown]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e)
      setMousePosition(pos.x, pos.y)
      if (isRightMouseDown) {
        setGravityPoint(pos.x, pos.y)
      }
    },
    [getMousePos, isRightMouseDown, setMousePosition, setGravityPoint]
  )

  const handleMouseUp = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const pos = getMousePos(e)
      if (e.button === 0) {
        setMouseDown(false, pos.x, pos.y)
      } else if (e.button === 2) {
        setRightMouseDown(false, pos.x, pos.y)
      }
    },
    [getMousePos, setMouseDown, setRightMouseDown]
  )

  const handleContextMenu = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault()
  }, [])

  const handleResize = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const container = canvas.parentElement
    if (!container) return
    const width = container.clientWidth
    const height = container.clientHeight
    canvas.width = width
    canvas.height = height
    setCanvasSize(width, height)
  }, [canvasRef, setCanvasSize])

  const drawBackground = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number) => {
      const gradient = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) / 1.5
      )
      gradient.addColorStop(0, '#0B0D1E')
      gradient.addColorStop(1, '#1A0A2E')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, width, height)
    },
    []
  )

  const drawStars = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      stars.forEach((star) => {
        const twinkle = Math.sin(star.twinklePhase) * 0.3 + 0.7
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(255, 255, 255, ${star.opacity * twinkle})`
        ctx.fill()
      })
    },
    [stars]
  )

  const drawParticles = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      particles.forEach((particle) => {
        if (particle.trail.length > 1) {
          for (let i = 1; i < particle.trail.length; i++) {
            const prev = particle.trail[i - 1]
            const curr = particle.trail[i]
            const alpha = i / particle.trail.length
            const thickness = (i / particle.trail.length) * 2 + 1

            ctx.beginPath()
            ctx.moveTo(prev.x, prev.y)
            ctx.lineTo(curr.x, curr.y)
            ctx.strokeStyle = `hsla(${particle.hue}, 100%, 70%, ${alpha})`
            ctx.lineWidth = thickness
            ctx.lineCap = 'round'
            ctx.stroke()
          }
        }

        const glowGradient = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          12
        )
        glowGradient.addColorStop(0, `hsla(${particle.hue}, 100%, 75%, 0.6)`)
        glowGradient.addColorStop(0.5, `hsla(${particle.hue}, 100%, 65%, 0.2)`)
        glowGradient.addColorStop(1, 'hsla(0, 0%, 0%, 0)')

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 12, 0, Math.PI * 2)
        ctx.fillStyle = glowGradient
        ctx.fill()

        ctx.beginPath()
        ctx.arc(particle.x, particle.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = `hsl(${particle.hue}, 100%, 80%)`
        ctx.fill()
      })
    },
    [particles]
  )

  const drawGravityPoint = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      if (gravityPointX === null || gravityPointY === null) return

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.lineWidth = 2
      ctx.lineCap = 'round'

      ctx.beginPath()
      ctx.moveTo(gravityPointX - 15, gravityPointY)
      ctx.lineTo(gravityPointX + 15, gravityPointY)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(gravityPointX, gravityPointY - 15)
      ctx.lineTo(gravityPointX, gravityPointY + 15)
      ctx.stroke()

      ctx.beginPath()
      ctx.arc(gravityPointX, gravityPointY, 8, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)'
      ctx.lineWidth = 1
      ctx.stroke()
    },
    [gravityPointX, gravityPointY]
  )

  const animate = useCallback(
    (timestamp: number) => {
      const canvas = canvasRef.current
      if (!canvas) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }

      const deltaTime = timestamp - lastTimeRef.current
      lastTimeRef.current = timestamp

      frameCountRef.current++
      if (timestamp - fpsTimeRef.current >= 1000) {
        onFpsUpdate(frameCountRef.current)
        frameCountRef.current = 0
        fpsTimeRef.current = timestamp
      }

      if (timestamp - lastStarTimeRef.current >= 2000) {
        addStars(3 + Math.floor(Math.random() * 3))
        lastStarTimeRef.current = timestamp
      }

      updateStars()

      if (isMouseDown) {
        particleEmitTimerRef.current += deltaTime
        if (particleEmitTimerRef.current >= 16) {
          particleEmitTimerRef.current = 0
          const dx = mouseX - lastMouseX
          const dy = mouseY - lastMouseY
          const speed = Math.sqrt(dx * dx + dy * dy)
          const emitCount = Math.min(5, Math.max(1, Math.floor(speed / 3) + 1))

          for (let i = 0; i < emitCount; i++) {
            const vx = dx * 0.3 + (Math.random() - 0.5) * 2
            const vy = dy * 0.3 + (Math.random() - 0.5) * 2
            const offsetX = (Math.random() - 0.5) * 10
            const offsetY = (Math.random() - 0.5) * 10
            addParticle(mouseX + offsetX, mouseY + offsetY, vx, vy)
          }
        }
      }

      updateParticles()

      drawBackground(ctx, canvas.width, canvas.height)
      drawStars(ctx)
      drawParticles(ctx)
      drawGravityPoint(ctx)

      animationRef.current = requestAnimationFrame(animate)
    },
    [
      canvasRef,
      isMouseDown,
      mouseX,
      mouseY,
      lastMouseX,
      lastMouseY,
      addParticle,
      updateParticles,
      updateStars,
      addStars,
      drawBackground,
      drawStars,
      drawParticles,
      drawGravityPoint,
      onFpsUpdate,
    ]
  )

  useEffect(() => {
    handleResize()
    window.addEventListener('resize', handleResize)

    addStars(30)

    lastTimeRef.current = performance.now()
    fpsTimeRef.current = performance.now()
    lastStarTimeRef.current = performance.now()
    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', handleResize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [handleResize, animate, addStars])

  return (
    <canvas
      ref={canvasRef}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
        cursor: 'crosshair',
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={(e) => {
        const pos = getMousePos(e)
        setMouseDown(false, pos.x, pos.y)
        setRightMouseDown(false, pos.x, pos.y)
      }}
      onContextMenu={handleContextMenu}
    />
  )
}
