import { useState, useCallback, useRef, useEffect } from 'react'
import SpellWheel from '@/components/SpellWheel'
import GameBoard from '@/components/GameBoard'
import { useSpellSystem } from '@/hooks/useSpellSystem'
import type { SpellCastEvent } from '@/types'

export default function App() {
  const { player } = useSpellSystem()
  const [battleEffects, setBattleEffects] = useState<SpellCastEvent[]>([])
  const starCanvasRef = useRef<HTMLCanvasElement>(null)
  const starAnimRef = useRef(0)
  const starsRef = useRef<Array<{ x: number; y: number; phase: number; speed: number }>>([])

  const handleSpellCast = useCallback((event: SpellCastEvent) => {
    setBattleEffects(prev => [...prev, event])
    setTimeout(() => {
      setBattleEffects(prev => prev.filter(e => e !== event))
    }, 100)
  }, [])

  useEffect(() => {
    const canvas = starCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      if (starsRef.current.length === 0) {
        for (let i = 0; i < 60; i++) {
          starsRef.current.push({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            phase: Math.random() * Math.PI * 2,
            speed: 0.5 + Math.random() * 1.5,
          })
        }
      }
    }
    resize()
    window.addEventListener('resize', resize)

    let lastTime = performance.now()
    const render = () => {
      const now = performance.now()
      const delta = now - lastTime
      lastTime = now

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      for (const star of starsRef.current) {
        star.phase += star.speed * delta * 0.001
        const alpha = 0.15 + 0.15 * Math.sin(star.phase)
        ctx.fillStyle = `rgba(255,255,255,${alpha})`
        ctx.beginPath()
        ctx.arc(star.x, star.y, 1.5, 0, Math.PI * 2)
        ctx.fill()
      }
      starAnimRef.current = requestAnimationFrame(render)
    }
    starAnimRef.current = requestAnimationFrame(render)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(starAnimRef.current)
    }
  }, [])

  const manaLow = player.mp < 15

  return (
    <div className="game-root">
      <canvas
        ref={starCanvasRef}
        className="fixed inset-0 pointer-events-none z-0"
      />
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none z-0" />

      <div className="relative z-10 flex flex-col lg:flex-row items-start justify-center min-h-screen p-4 gap-6 lg:gap-10">
        <div className="w-full lg:w-64 flex-shrink-0 order-2 lg:order-1">
          <GameBoard battleEffects={battleEffects} />
        </div>

        <div className="flex-1 flex flex-col items-center justify-center order-1 lg:order-2">
          <h1 className="text-2xl lg:text-3xl font-bold text-amber-400 mb-4 game-title tracking-wider">
            法术咏唱轮盘
          </h1>
          <div className={`wheel-container ${manaLow ? 'mana-warning' : ''}`}>
            <SpellWheel onSpellCast={handleSpellCast} />
          </div>
          <p className="text-gray-500 text-xs mt-3">拖拽旋转轮盘 | 点击释放法术 | 长按编辑槽位</p>
        </div>
      </div>
    </div>
  )
}
