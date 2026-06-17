import { useRef, useEffect, useState, useCallback } from 'react'
import { useStore } from '../store/useStore'

export default function InteractionLayer() {
  const updateForceField = useStore((state) => state.updateForceField)
  const forceFieldStrength = useStore((state) => state.forceFieldStrength)

  const isDragging = useRef(false)
  const lastPos = useRef({ x: 0, y: 0 })
  const lastTime = useRef(0)
  const decayTimer = useRef<number | null>(null)
  const glowRef = useRef<HTMLDivElement>(null)

  const [glowStyle, setGlowStyle] = useState({
    left: 0,
    top: 0,
    size: 40,
    color: '#FF6B6B',
    opacity: 0,
    transition: 'all 0.15s ease-out'
  })

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t

  const getGlowColor = useCallback((speed: number): string => {
    const t = Math.min(speed / 800, 1)
    const r1 = 255, g1 = 107, b1 = 107
    const r2 = 255, g2 = 230, b2 = 109
    const r = Math.round(lerp(r1, r2, t))
    const g = Math.round(lerp(g1, g2, t))
    const b = Math.round(lerp(b1, b2, t))
    return `rgb(${r}, ${g}, ${b})`
  }, [])

  const getGlowSize = useCallback((speed: number): number => {
    const t = Math.min(speed / 800, 1)
    return 40 + t * 40
  }, [])

  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button !== 0) return
    isDragging.current = true
    lastPos.current = { x: e.clientX, y: e.clientY }
    lastTime.current = performance.now()

    if (decayTimer.current) {
      clearTimeout(decayTimer.current)
      decayTimer.current = null
    }

    updateForceField({
      isActive: true,
      x: e.clientX,
      y: e.clientY,
      forceX: 0,
      forceY: 0,
      strength: 1,
      speed: 0,
      decay: 1
    })

    setGlowStyle((prev) => ({
      ...prev,
      left: e.clientX,
      top: e.clientY,
      size: 40,
      color: '#FF6B6B',
      opacity: 0.6,
      transition: 'opacity 0.15s ease-out'
    }))
  }, [updateForceField])

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging.current) return

    const now = performance.now()
    const dt = now - lastTime.current

    if (dt < 16) return

    const dx = e.clientX - lastPos.current.x
    const dy = e.clientY - lastPos.current.y
    const distance = Math.sqrt(dx * dx + dy * dy)
    const speed = (distance / dt) * 1000

    const forceX = dx / (dt / 1000)
    const forceY = dy / (dt / 1000)

    lastPos.current = { x: e.clientX, y: e.clientY }
    lastTime.current = now

    updateForceField({
      x: e.clientX,
      y: e.clientY,
      forceX,
      forceY,
      strength: 1,
      speed
    })

    const glowColor = getGlowColor(speed)
    const glowSize = getGlowSize(speed)

    setGlowStyle((prev) => ({
      ...prev,
      left: e.clientX,
      top: e.clientY,
      size: glowSize,
      color: glowColor,
      opacity: 0.6,
      transition: 'all 0.15s ease-out'
    }))
  }, [updateForceField, getGlowColor, getGlowSize])

  const handleMouseUp = useCallback(() => {
    if (!isDragging.current) return
    isDragging.current = false

    updateForceField({
      isActive: false,
      decay: 1
    })

    const startTime = performance.now()
    const decayDuration = 500

    const animateDecay = () => {
      const elapsed = performance.now() - startTime
      const progress = Math.min(elapsed / decayDuration, 1)
      const decay = 1 - progress

      updateForceField({
        strength: decay,
        decay
      })

      setGlowStyle((prev) => ({
        ...prev,
        opacity: decay * 0.4,
        size: prev.size * (1 + progress * 0.3),
        transition: 'opacity 0.05s linear'
      }))

      if (progress < 1) {
        decayTimer.current = requestAnimationFrame(animateDecay)
      } else {
        updateForceField({
          strength: 0,
          decay: 0
        })
        setGlowStyle((prev) => ({
          ...prev,
          opacity: 0,
          transition: 'opacity 0.15s ease-out'
        }))
        decayTimer.current = null
      }
    }

    decayTimer.current = requestAnimationFrame(animateDecay)
  }, [updateForceField])

  useEffect(() => {
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('mouseleave', handleMouseUp)

    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('mouseleave', handleMouseUp)

      if (decayTimer.current) {
        cancelAnimationFrame(decayTimer.current)
      }
    }
  }, [handleMouseDown, handleMouseMove, handleMouseUp])

  return (
    <div
      ref={glowRef}
      style={{
        position: 'fixed',
        left: glowStyle.left,
        top: glowStyle.top,
        width: glowStyle.size,
        height: glowStyle.size,
        borderRadius: '50%',
        background: `radial-gradient(circle, ${glowStyle.color}44 0%, ${glowStyle.color}11 50%, transparent 70%)`,
        pointerEvents: 'none',
        transform: 'translate(-50%, -50%)',
        opacity: glowStyle.opacity,
        transition: glowStyle.transition,
        zIndex: 999,
        mixBlendMode: 'screen'
      }}
    />
  )
}
