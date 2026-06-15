import { useEffect, useRef } from 'react'
import { eventBus, type LightData } from './eventBus'

const LIGHT_COUNT = 12
const RING_RADIUS_RATIO = 0.3
const LIGHT_BASE_RADIUS = 25

export default function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lightsRef = useRef<LightData[]>([])
  const rotationRef = useRef({ x: -20, y: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
  const lastTimeRef = useRef(0)
  const animationFrameRef = useRef<number | null>(null)

  useEffect(() => {
    const handleLightUpdate = (lights: LightData[]) => {
      lightsRef.current = lights
    }
    eventBus.on('lightUpdate', handleLightUpdate)
    return () => eventBus.off('lightUpdate', handleLightUpdate)
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const resize = () => {
      const rect = container.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = `${rect.width}px`
      canvas.style.height = `${rect.height}px`
    }
    resize()
    window.addEventListener('resize', resize)

    const handleMouseDown = (e: MouseEvent) => {
      isDraggingRef.current = true
      lastPosRef.current = { x: e.clientX, y: e.clientY }
      lastTimeRef.current = performance.now()
      velocityRef.current = { x: 0, y: 0 }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const now = performance.now()
      const dt = Math.max(1, now - lastTimeRef.current)
      const dx = e.clientX - lastPosRef.current.x
      const dy = e.clientY - lastPosRef.current.y
      rotationRef.current.y += dx * 0.5
      rotationRef.current.x += dy * 0.5
      rotationRef.current.x = Math.max(-80, Math.min(80, rotationRef.current.x))
      velocityRef.current = { x: (dy * 0.5) / dt * 16, y: (dx * 0.5) / dt * 16 }
      lastPosRef.current = { x: e.clientX, y: e.clientY }
      lastTimeRef.current = now
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true
        lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        lastTimeRef.current = performance.now()
        velocityRef.current = { x: 0, y: 0 }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return
      const now = performance.now()
      const dt = Math.max(1, now - lastTimeRef.current)
      const dx = e.touches[0].clientX - lastPosRef.current.x
      const dy = e.touches[0].clientY - lastPosRef.current.y
      rotationRef.current.y += dx * 0.5
      rotationRef.current.x += dy * 0.5
      rotationRef.current.x = Math.max(-80, Math.min(80, rotationRef.current.x))
      velocityRef.current = { x: (dy * 0.5) / dt * 16, y: (dx * 0.5) / dt * 16 }
      lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      lastTimeRef.current = now
      e.preventDefault()
    }

    const handleTouchEnd = () => {
      isDraggingRef.current = false
    }

    container.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('touchstart', handleTouchStart, { passive: false })
    container.addEventListener('touchmove', handleTouchMove, { passive: false })
    container.addEventListener('touchend', handleTouchEnd)

    let lastFrameTime = performance.now()
    let frameCount = 0
    let fpsUpdateTime = lastFrameTime

    const render = () => {
      const now = performance.now()
      const frameTime = now - lastFrameTime
      lastFrameTime = now

      if (import.meta.env.DEV) {
        frameCount++
        if (now - fpsUpdateTime >= 1000) {
          const fps = Math.round(frameCount * 1000 / (now - fpsUpdateTime))
          console.debug(`[Stage] FPS: ${fps}, Frame time: ${frameTime.toFixed(2)}ms`)
          frameCount = 0
          fpsUpdateTime = now
        }
      }

      if (!isDraggingRef.current) {
        rotationRef.current.y += velocityRef.current.y
        rotationRef.current.x += velocityRef.current.x
        rotationRef.current.x = Math.max(-80, Math.min(80, rotationRef.current.x))
        velocityRef.current.x *= 0.95
        velocityRef.current.y *= 0.95
      }

      performance.mark('draw-start')
      draw()
      performance.mark('draw-end')
      performance.measure('stageDraw', 'draw-start', 'draw-end')

      animationFrameRef.current = requestAnimationFrame(render)
    }
    animationFrameRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', resize)
      container.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchmove', handleTouchMove)
      container.removeEventListener('touchend', handleTouchEnd)
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [])

  const draw = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const w = canvas.width
    const h = canvas.height
    const dpr = window.devicePixelRatio

    const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) / 2)
    gradient.addColorStop(0, '#2a2a4a')
    gradient.addColorStop(1, '#1a1a2e')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, w, h)

    const centerX = w / 2
    const centerY = h / 2
    const ringRadius = Math.min(w, h) * RING_RADIUS_RATIO
    const lightRadius = LIGHT_BASE_RADIUS * dpr

    const rotX = (rotationRef.current.x * Math.PI) / 180
    const rotY = (rotationRef.current.y * Math.PI) / 180

    const positions: { x: number; y: number; z: number; screenX: number; screenY: number; scale: number }[] = []

    const calculateRingPosition = (index: number, total: number, radius: number) => {
      const angle = (index / total) * Math.PI * 2 - Math.PI / 2
      return {
        x: Math.cos(angle) * radius,
        y: 0,
        z: Math.sin(angle) * radius,
      }
    }

    const lightCount = Math.max(LIGHT_COUNT, lightsRef.current.length)
    for (let i = 0; i < lightCount; i++) {
      const pos3d = calculateRingPosition(i, lightCount, ringRadius)

      const cosY = Math.cos(rotY)
      const sinY = Math.sin(rotY)
      const x1 = pos3d.x * cosY - pos3d.z * sinY
      const z1 = pos3d.x * sinY + pos3d.z * cosY

      const cosX = Math.cos(rotX)
      const sinX = Math.sin(rotX)
      const y1 = pos3d.y * cosX - z1 * sinX
      const z2 = pos3d.y * sinX + z1 * cosX

      const perspective = 800 * dpr
      const scale = perspective / (perspective + z2)
      const screenX = centerX + x1 * scale
      const screenY = centerY + y1 * scale

      positions.push({ x: x1, y: y1, z: z2, screenX, screenY, scale })
    }

    const sortedIndices = positions
      .map((pos, i) => ({ i, z: pos.z }))
      .sort((a, b) => a.z - b.z)
      .map(item => item.i)

    for (const idx of sortedIndices) {
      const light = lightsRef.current[idx]
      const pos = positions[idx]
      if (!light) continue

      const brightness = light.brightness / 100
      const glowSize = lightRadius * 4 * pos.scale * (0.3 + brightness * 0.7)

      const glowGradient = ctx.createRadialGradient(
        pos.screenX, pos.screenY, 0,
        pos.screenX, pos.screenY, glowSize
      )
      
      const colorMatch = light.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (colorMatch) {
        const r = parseInt(colorMatch[1])
        const g = parseInt(colorMatch[2])
        const b = parseInt(colorMatch[3])
        
        glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.8 * brightness})`)
        glowGradient.addColorStop(0.2, `rgba(${r}, ${g}, ${b}, ${0.5 * brightness})`)
        glowGradient.addColorStop(0.5, `rgba(${r}, ${g}, ${b}, ${0.2 * brightness})`)
        glowGradient.addColorStop(0.8, `rgba(${r}, ${g}, ${b}, ${0.05 * brightness})`)
        glowGradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 0)`)
      }

      ctx.fillStyle = glowGradient
      ctx.beginPath()
      ctx.arc(pos.screenX, pos.screenY, glowSize, 0, Math.PI * 2)
      ctx.fill()

      const coreGradient = ctx.createRadialGradient(
        pos.screenX - lightRadius * 0.3 * pos.scale,
        pos.screenY - lightRadius * 0.3 * pos.scale,
        0,
        pos.screenX,
        pos.screenY,
        lightRadius * pos.scale
      )
      
      if (colorMatch) {
        const r = parseInt(colorMatch[1])
        const g = parseInt(colorMatch[2])
        const b = parseInt(colorMatch[3])
        const brightR = Math.min(255, r + 80 * brightness)
        const brightG = Math.min(255, g + 80 * brightness)
        const brightB = Math.min(255, b + 80 * brightness)
        const dimR = Math.max(0, r * 0.4)
        const dimG = Math.max(0, g * 0.4)
        const dimB = Math.max(0, b * 0.4)
        
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.95 * brightness})`)
        coreGradient.addColorStop(0.25, `rgba(${brightR}, ${brightG}, ${brightB}, ${brightness})`)
        coreGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${brightness})`)
        coreGradient.addColorStop(1, `rgba(${dimR}, ${dimG}, ${dimB}, ${brightness * 0.7})`)
      }

      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(pos.screenX, pos.screenY, lightRadius * pos.scale, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 * brightness})`
      ctx.lineWidth = 2 * dpr * pos.scale
      ctx.beginPath()
      ctx.arc(pos.screenX, pos.screenY, lightRadius * pos.scale * 0.9, 0, Math.PI * 2)
      ctx.stroke()
    }
  }

  return (
    <div ref={containerRef} className="stage-container">
      <canvas ref={canvasRef} className="stage-canvas" />
      <div className="stage-hint">拖拽旋转视角</div>
    </div>
  )
}
