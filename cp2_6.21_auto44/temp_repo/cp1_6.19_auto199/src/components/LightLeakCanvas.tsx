import { useEffect, useRef, useImperativeHandle, forwardRef } from 'react'

interface LightRay {
  x: number
  y: number
  angle: number
  width: number
  speed: number
  opacity: number
}

export interface LightLeakCanvasHandle {
  play: () => Promise<void>
}

interface LightLeakCanvasProps {
  width: number
  height: number
}

export const LightLeakCanvas = forwardRef<LightLeakCanvasHandle, LightLeakCanvasProps>(
  function LightLeakCanvas({ width, height }, ref) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const animationRef = useRef<number | null>(null)
    const raysRef = useRef<LightRay[]>([])
    const startTimeRef = useRef<number>(0)
    const resolveRef = useRef<(() => void) | null>(null)

    const createRays = (): LightRay[] => {
      const count = 3 + Math.floor(Math.random() * 4)
      const rays: LightRay[] = []
      const diag = Math.sqrt(width * width + height * height)

      for (let i = 0; i < count; i++) {
        rays.push({
          x: -diag + Math.random() * width * 0.5,
          y: -diag + Math.random() * height * 0.5,
          angle: (45 + Math.random() * 90) * (Math.PI / 180),
          width: 4 + Math.random() * 8,
          speed: (diag * 2) / 1.2,
          opacity: 0.3 + Math.random() * 0.4,
        })
      }
      return rays
    }

    const animate = (timestamp: number) => {
      const canvas = canvasRef.current
      const ctx = canvas?.getContext('2d')
      if (!canvas || !ctx) return

      const elapsed = (timestamp - startTimeRef.current) / 1000
      const totalDuration = 1.2

      ctx.clearRect(0, 0, width, height)

      if (elapsed >= totalDuration + 0.3) {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
          animationRef.current = null
        }
        resolveRef.current?.()
        resolveRef.current = null
        return
      }

      const fadeOutStart = totalDuration
      let globalOpacity = 1
      if (elapsed > fadeOutStart) {
        globalOpacity = 1 - (elapsed - fadeOutStart) / 0.3
      }

      const progress = Math.min(elapsed / totalDuration, 1)

      raysRef.current.forEach((ray) => {
        const currentX = ray.x + Math.cos(ray.angle) * ray.speed * progress
        const currentY = ray.y + Math.sin(ray.angle) * ray.speed * progress

        const gradient = ctx.createLinearGradient(
          currentX,
          currentY,
          currentX + Math.cos(ray.angle) * 100,
          currentY + Math.sin(ray.angle) * 100
        )
        gradient.addColorStop(0, `rgba(255, 213, 79, 0)`)
        gradient.addColorStop(0.3, `rgba(255, 213, 79, ${ray.opacity * globalOpacity})`)
        gradient.addColorStop(0.7, `rgba(255, 112, 67, ${ray.opacity * 0.8 * globalOpacity})`)
        gradient.addColorStop(1, `rgba(255, 112, 67, 0)`)

        ctx.save()
        ctx.translate(currentX, currentY)
        ctx.rotate(ray.angle)
        ctx.fillStyle = gradient
        ctx.fillRect(0, -ray.width / 2, Math.sqrt(width * width + height * height) * 2, ray.width)
        ctx.restore()
      })

      if (progress > 0.7 && progress < 1) {
        const flashOpacity = (1 - progress) / 0.3 * 0.15 * globalOpacity
        ctx.fillStyle = `rgba(255, 200, 100, ${flashOpacity})`
        ctx.fillRect(0, 0, width, height)
      }

      animationRef.current = requestAnimationFrame(animate)
    }

    const play = (): Promise<void> => {
      return new Promise((resolve) => {
        resolveRef.current = resolve
        raysRef.current = createRays()
        startTimeRef.current = performance.now()
        animationRef.current = requestAnimationFrame(animate)
      })
    }

    useImperativeHandle(ref, () => ({ play }))

    useEffect(() => {
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current)
        }
      }
    }, [])

    return (
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          borderRadius: '8px',
        }}
      />
    )
  }
)
