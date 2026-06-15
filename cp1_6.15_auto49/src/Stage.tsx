import { useEffect, useRef } from 'react'
import { eventBus, type LightData } from './eventBus'

export default function Stage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const lightsRef = useRef<LightData[]>([])
  const rotationRef = useRef({ x: -20, y: 0 })
  const velocityRef = useRef({ x: 0, y: 0 })
  const isDraggingRef = useRef(false)
  const lastPosRef = useRef({ x: 0, y: 0 })
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
      velocityRef.current = { x: 0, y: 0 }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return
      const dx = e.clientX - lastPosRef.current.x
      const dy = e.clientY - lastPosRef.current.y
      rotationRef.current.y += dx * 0.5
      rotationRef.current.x += dy * 0.5
      rotationRef.current.x = Math.max(-80, Math.min(80, rotationRef.current.x))
      velocityRef.current = { x: dy * 0.5, y: dx * 0.5 }
      lastPosRef.current = { x: e.clientX, y: e.clientY }
    }

    const handleMouseUp = () => {
      isDraggingRef.current = false
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true
        lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
        velocityRef.current = { x: 0, y: 0 }
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDraggingRef.current || e.touches.length !== 1) return
      const dx = e.touches[0].clientX - lastPosRef.current.x
      const dy = e.touches[0].clientY - lastPosRef.current.y
      rotationRef.current.y += dx * 0.5
      rotationRef.current.x += dy * 0.5
      rotationRef.current.x = Math.max(-80, Math.min(80, rotationRef.current.x))
      velocityRef.current = { x: dy * 0.5, y: dx * 0.5 }
      lastPosRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
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

    const render = () => {
      if (!isDraggingRef.current) {
        rotationRef.current.y += velocityRef.current.y
        rotationRef.current.x += velocityRef.current.x
        rotationRef.current.x = Math.max(-80, Math.min(80, rotationRef.current.x))
        velocityRef.current.x *= 0.95
        velocityRef.current.y *= 0.95
      }
      draw()
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
    const radius = Math.min(w, h) * 0.3
    const lightRadius = 25 * dpr

    const rotX = (rotationRef.current.x * Math.PI) / 180
    const rotY = (rotationRef.current.y * Math.PI) / 180

    const positions: { x: number; y: number; z: number; screenX: number; screenY: number; scale: number }[] = []

    for (let i = 0; i < 12; i++) {
      const angle = (i / 12) * Math.PI * 2 - Math.PI / 2
      const x = Math.cos(angle) * radius
      const y = 0
      const z = Math.sin(angle) * radius

      const cosY = Math.cos(rotY)
      const sinY = Math.sin(rotY)
      const x1 = x * cosY - z * sinY
      const z1 = x * sinY + z * cosY

      const cosX = Math.cos(rotX)
      const sinX = Math.sin(rotX)
      const y1 = y * cosX - z1 * sinX
      const z2 = y * sinX + z1 * cosX

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
      const glowSize = lightRadius * 3 * pos.scale * (0.5 + brightness * 0.5)

      const glowGradient = ctx.createRadialGradient(
        pos.screenX, pos.screenY, 0,
        pos.screenX, pos.screenY, glowSize
      )
      
      const colorMatch = light.color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/)
      if (colorMatch) {
        const r = parseInt(colorMatch[1])
        const g = parseInt(colorMatch[2])
        const b = parseInt(colorMatch[3])
        
        glowGradient.addColorStop(0, `rgba(${r}, ${g}, ${b}, ${0.6 * brightness})`)
        glowGradient.addColorStop(0.3, `rgba(${r}, ${g}, ${b}, ${0.3 * brightness})`)
        glowGradient.addColorStop(0.6, `rgba(${r}, ${g}, ${b}, ${0.1 * brightness})`)
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
        const brightR = Math.min(255, r + 100 * brightness)
        const brightG = Math.min(255, g + 100 * brightness)
        const brightB = Math.min(255, b + 100 * brightness)
        
        coreGradient.addColorStop(0, `rgba(255, 255, 255, ${0.9 * brightness})`)
        coreGradient.addColorStop(0.3, `rgba(${brightR}, ${brightG}, ${brightB}, ${brightness})`)
        coreGradient.addColorStop(0.7, light.color)
        coreGradient.addColorStop(1, `rgba(${r * 0.5}, ${g * 0.5}, ${b * 0.5}, ${brightness})`)
      }

      ctx.fillStyle = coreGradient
      ctx.beginPath()
      ctx.arc(pos.screenX, pos.screenY, lightRadius * pos.scale, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  return (
    <div ref={containerRef} className="stage-container">
      <canvas ref={canvasRef} className="stage-canvas" />
      <div className="stage-hint">拖拽旋转视角</div>
    </div>
  )
}
