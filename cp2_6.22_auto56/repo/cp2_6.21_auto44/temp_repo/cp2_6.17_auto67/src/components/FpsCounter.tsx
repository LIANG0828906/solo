import { useEffect, useState, useRef } from 'react'

export function FpsCounter() {
  const [fps, setFps] = useState(0)
  const frameCountRef = useRef(0)
  const lastUpdateRef = useRef(performance.now())
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const tick = () => {
      frameCountRef.current++
      const now = performance.now()
      if (now - lastUpdateRef.current >= 200) {
        const elapsed = (now - lastUpdateRef.current) / 1000
        const currentFps = Math.round(frameCountRef.current / elapsed)
        setFps(currentFps)
        frameCountRef.current = 0
        lastUpdateRef.current = now
      }
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current)
      }
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        left: 20,
        zIndex: 100,
        fontSize: '14px',
        color: 'rgba(255,255,255,0.6)',
        fontFamily: 'monospace',
        letterSpacing: '0.5px',
        userSelect: 'none',
        pointerEvents: 'none',
        textShadow: '0 1px 4px rgba(0,0,0,0.5)',
      }}
    >
      FPS: {fps}
    </div>
  )
}
