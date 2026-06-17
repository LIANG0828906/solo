import { useEffect, useRef } from 'react'
import { PlayerController } from './PlayerController'
import { GameEngine } from './GameEngine'
import { LevelRenderer } from './LevelRenderer'
import { useGameStore } from './store/gameStore'

const CANVAS_W = 800
const CANVAS_H = 400

export default function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<GameEngine | null>(null)
  const controllerRef = useRef<PlayerController | null>(null)
  const rendererRef = useRef<LevelRenderer | null>(null)
  const status = useGameStore((s) => s.status)

  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const controller = new PlayerController()
    controllerRef.current = controller
    controller.attach(canvas)

    const renderer = new LevelRenderer(canvas)
    rendererRef.current = renderer
    renderer.resize(1)

    const engine = new GameEngine(controller, (snapshot, alpha) => {
      renderer.render(snapshot, alpha)
    })
    engineRef.current = engine

    const startRaf = () => {
      let lastT = performance.now()
      const tick = () => {
        const now = performance.now()
        const dt = (now - lastT) / 1000
        lastT = now
        if (engineRef.current && engineRef.current.state.status !== 'PLAYING') {
          const snap = { ...engineRef.current.state, time: engineRef.current.state.time + dt }
          if (snap.status === 'START') snap.time += dt
          renderer.render(snap, 1)
        }
        rafId = requestAnimationFrame(tick)
      }
      let rafId = requestAnimationFrame(tick)
      return () => cancelAnimationFrame(rafId)
    }
    const cancelIdle = startRaf()

    const onKey = (e: KeyboardEvent) => {
      if (!engineRef.current) return
      const curStatus = useGameStore.getState().status
      if (e.code === 'Space') {
        if (curStatus === 'START') {
          engineRef.current.start()
          e.preventDefault()
        } else if (curStatus === 'GAMEOVER') {
          engineRef.current.reset()
          e.preventDefault()
        }
      }
      if (e.code === 'KeyR' && curStatus === 'GAMEOVER') {
        engineRef.current.reset()
      }
    }
    window.addEventListener('keydown', onKey)

    const applyScale = () => {
      const maxW = Math.min(window.innerWidth - 32, CANVAS_W)
      const scale = Math.max(0.5, maxW / CANVAS_W)
      canvas.style.width = `${CANVAS_W * scale}px`
      canvas.style.height = `${CANVAS_H * scale}px`
      const dpr = Math.min(2, window.devicePixelRatio || 1)
      canvas.width = Math.floor(CANVAS_W * scale * dpr) / (scale * dpr) === CANVAS_W
        ? CANVAS_W
        : CANVAS_W
      renderer.resize(scale * dpr)
      canvas.style.width = `${CANVAS_W * scale}px`
      canvas.style.height = `${CANVAS_H * scale}px`
      canvas.width = Math.floor(CANVAS_W * dpr)
      canvas.height = Math.floor(CANVAS_H * dpr)
      const ctx = canvas.getContext('2d')
      if (ctx) ctx.imageSmoothingEnabled = false
      renderer.resize(dpr)
    }
    applyScale()
    window.addEventListener('resize', applyScale)

    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('resize', applyScale)
      cancelIdle()
      engine.stop()
      controller.detach()
    }
  }, [])

  useEffect(() => {
    if (!engineRef.current) return
    if (engineRef.current.state.status !== status) {
      engineRef.current.setStatusExternal(status)
    }
  }, [status])

  const handleStartTouch = () => {
    if (!engineRef.current) return
    const curStatus = useGameStore.getState().status
    if (curStatus === 'START') {
      engineRef.current.start()
    } else if (curStatus === 'GAMEOVER') {
      engineRef.current.reset()
    }
  }

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '100vh',
        background: '#1A1A1A',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          background: '#2D2D2D',
          padding: '12px',
          borderRadius: '8px',
          boxShadow: '0 0 0 2px #000, 0 8px 24px rgba(0,0,0,0.5)',
        }}
        onTouchStart={handleStartTouch}
      >
        <canvas
          ref={canvasRef}
          style={{
            display: 'block',
            background: '#2D2D2D',
            imageRendering: 'pixelated',
            touchAction: 'none',
            userSelect: 'none',
          }}
        />
      </div>
    </div>
  )
}
