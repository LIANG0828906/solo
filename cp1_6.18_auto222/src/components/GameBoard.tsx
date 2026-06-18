import { useRef, useEffect, useCallback, useState } from 'react'
import { useGameStore } from '@/store/gameStore'
import { ParticlePool, hexToRgb } from '@/utils/particlePool'
import type { SpellCastEvent, ComboEffectType } from '@/types'

interface GameBoardProps {
  battleEffects: SpellCastEvent[]
}

const CANVAS_W = 400
const CANVAS_H = 300

export default function GameBoard({ battleEffects }: GameBoardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particleRef = useRef(new ParticlePool())
  const animRef = useRef(0)
  const lastFrameRef = useRef(performance.now())
  const dprRef = useRef(1)

  const player = useGameStore(s => s.player)
  const castLog = useGameStore(s => s.castLog)
  const addCastLog = useGameStore(s => s.addCastLog)
  const addComboEffect = useGameStore(s => s.addComboEffect)

  const hpPercent = player.hp / player.maxHp
  const mpPercent = player.mp / player.maxMp

  const [hpFlash, setHpFlash] = useState(false)
  const [mpFlash, setMpFlash] = useState(false)
  const prevHpRef = useRef(player.hp)
  const prevMpRef = useRef(player.mp)

  useEffect(() => {
    if (player.hp !== prevHpRef.current) {
      setHpFlash(true)
      const t = setTimeout(() => setHpFlash(false), 150)
      prevHpRef.current = player.hp
      return () => clearTimeout(t)
    }
  }, [player.hp])

  useEffect(() => {
    if (player.mp !== prevMpRef.current) {
      setMpFlash(true)
      const t = setTimeout(() => setMpFlash(false), 200)
      prevMpRef.current = player.mp
      return () => clearTimeout(t)
    }
  }, [player.mp])

  const spawnExplosion = useCallback((x: number, y: number, element: string) => {
    const pool = particleRef.current
    const colorMap: Record<string, [string, string]> = {
      fire: ['#FF4500', '#FFD700'],
      ice: ['#00BFFF', '#E0F7FA'],
      lightning: ['#FFD700', '#FFA500'],
      dark: ['#8B008B', '#9400D3'],
    }
    const colors = colorMap[element] || colorMap.fire
    const [r1, g1, b1] = hexToRgb(colors[0])
    const [r2, g2, b2] = hexToRgb(colors[1])
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 50 + Math.random() * 50
      const [r, g, b] = Math.random() > 0.5 ? [r1, g1, b1] : [r2, g2, b2]
      pool.spawn(
        x, y,
        speed * Math.cos(angle),
        speed * Math.sin(angle),
        2 + Math.random() * 4,
        r, g, b,
        1000 + Math.random() * 500,
      )
    }
  }, [])

  const spawnComboEffect = useCallback((x: number, y: number, type: ComboEffectType) => {
    const pool = particleRef.current
    const colorSets: Record<string, [string, string]> = {
      meteor: ['#FF4500', '#FFD700'],
      chain_lightning: ['#FFD700', '#00BFFF'],
      blizzard: ['#00BFFF', '#E0F7FA'],
      void_explosion: ['#8B008B', '#FFD700'],
    }
    const colors = colorSets[type] || colorSets.meteor
    const [r1, g1, b1] = hexToRgb(colors[0])
    const [r2, g2, b2] = hexToRgb(colors[1])
    const count = type === 'meteor' ? 40 : type === 'chain_lightning' ? 30 : 35
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = 80 + Math.random() * 120
      const [r, g, b] = Math.random() > 0.5 ? [r1, g1, b1] : [r2, g2, b2]
      pool.spawn(
        x, y,
        speed * Math.cos(angle),
        speed * Math.sin(angle),
        3 + Math.random() * 5,
        r, g, b,
        1500 + Math.random() * 500,
      )
    }
  }, [])

  useEffect(() => {
    for (const effect of battleEffects) {
      const x = CANVAS_W / 2 + (Math.random() - 0.5) * 100
      const y = CANVAS_H / 2 + (Math.random() - 0.5) * 80
      spawnExplosion(x, y, effect.element)
      addCastLog(`${effect.element.toUpperCase()} 法术命中目标! 造成 ${effect.damage} 伤害`)
    }
  }, [battleEffects, spawnExplosion, addCastLog])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const dpr = window.devicePixelRatio || 1
    dprRef.current = dpr
    canvas.width = CANVAS_W * dpr
    canvas.height = CANVAS_H * dpr
    ctx.scale(dpr, dpr)

    const render = () => {
      const now = performance.now()
      const delta = Math.min(now - lastFrameRef.current, 50)
      lastFrameRef.current = now

      particleRef.current.update(delta)

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H)

      ctx.fillStyle = 'rgba(14,22,36,0.4)'
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H)

      ctx.fillStyle = 'rgba(255,255,255,0.6)'
      ctx.font = '14px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('⚔ 战斗区域', CANVAS_W / 2, 24)

      particleRef.current.draw(ctx)

      animRef.current = requestAnimationFrame(render)
    }

    animRef.current = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animRef.current)
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="status-panel">
        <h2 className="text-amber-400 font-bold text-lg mb-3">🛡 冒险者状态</h2>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">生命值</span>
            <span className={`text-xs font-bold text-red-400 ${hpFlash ? 'hp-flash' : ''}`}>
              {Math.round(player.hp)} / {player.maxHp}
            </span>
          </div>
          <div className="bar-container">
            <div
              className="bar-fill hp-bar"
              style={{ width: `${hpPercent * 100}%` }}
            />
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-gray-400">法力值</span>
            <span className={`text-xs font-bold text-blue-400 ${mpFlash ? 'mp-flash' : ''}`}>
              {Math.round(player.mp)} / {player.maxMp}
            </span>
          </div>
          <div className="bar-container">
            <div
              className="bar-fill mp-bar"
              style={{ width: `${mpPercent * 100}%` }}
            />
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-1">
          法力恢复: 3点/秒
        </div>
      </div>

      <div className="status-panel">
        <h3 className="text-amber-400 font-bold text-sm mb-2">⚔ 战斗面板</h3>
        <canvas
          ref={canvasRef}
          width={CANVAS_W * dprRef.current}
          height={CANVAS_H * dprRef.current}
          style={{ width: CANVAS_W, height: CANVAS_H, maxWidth: '100%' }}
          className="rounded-lg border border-gray-700/50"
        />
      </div>

      <div className="status-panel max-h-40 overflow-y-auto">
        <h3 className="text-amber-400 font-bold text-sm mb-2">📜 战斗日志</h3>
        <div className="flex flex-col gap-1">
          {castLog.slice(-8).map((log, i) => (
            <p key={i} className="text-xs text-gray-400 leading-tight">{log}</p>
          ))}
          {castLog.length === 0 && (
            <p className="text-xs text-gray-600 italic">等待施法...</p>
          )}
        </div>
      </div>
    </div>
  )
}
