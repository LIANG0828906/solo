import { useEffect, useRef } from 'react'
import AstroScene from './scene'
import ControlPanel from './ControlPanel'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<AstroScene | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const scene = new AstroScene()
    scene.init(containerRef.current)
    sceneRef.current = scene

    const handleMouseMove = (e: MouseEvent) => {
      scene.handleMouseMove(e.clientX, e.clientY)
    }

    const handleMouseLeave = () => {
      scene.handleMouseLeave()
    }

    const handleClick = (e: MouseEvent) => {
      scene.handleClick(e.clientX, e.clientY)
    }

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        scene.handleMouseMove(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    const handleTouchEnd = () => {
      scene.handleMouseLeave()
    }

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        scene.handleClick(e.touches[0].clientX, e.touches[0].clientY)
      }
    }

    containerRef.current.addEventListener('mousemove', handleMouseMove)
    containerRef.current.addEventListener('mouseleave', handleMouseLeave)
    containerRef.current.addEventListener('click', handleClick)
    containerRef.current.addEventListener('touchmove', handleTouchMove)
    containerRef.current.addEventListener('touchend', handleTouchEnd)
    containerRef.current.addEventListener('touchstart', handleTouchStart)

    return () => {
      containerRef.current?.removeEventListener('mousemove', handleMouseMove)
      containerRef.current?.removeEventListener('mouseleave', handleMouseLeave)
      containerRef.current?.removeEventListener('click', handleClick)
      containerRef.current?.removeEventListener('touchmove', handleTouchMove)
      containerRef.current?.removeEventListener('touchend', handleTouchEnd)
      containerRef.current?.removeEventListener('touchstart', handleTouchStart)
      scene.destroy()
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          background: 'radial-gradient(ellipse at center, #1A1B41 0%, #0A0E27 100%)',
        }}
      />
      <ControlPanel />
    </div>
  )
}

export default App
