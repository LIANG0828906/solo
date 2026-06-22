import React, { useEffect, useRef, useCallback } from 'react'
import { Trophy, RotateCcw, User, Info } from 'lucide-react'
import { GestureInput } from '../gestureInput'
import { SpellScoring } from '../spellScoring'
import { ElementEffects } from '../elementEffects'
import { useGameStore } from '../store/gameStore'
import { ELEMENT_COLORS } from '../../shared/types'
import type { Point } from '../../shared/types'
import { ComboDisplay } from '../components/ComboDisplay'
import { ScoreRing } from '../components/ScoreRing'
import { ElementSelector } from '../components/ElementSelector'
import { ScoreResult } from '../components/ScoreResult'
import { Leaderboard } from '../components/Leaderboard'

export default function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const effectsContainerRef = useRef<HTMLDivElement>(null)
  const gestureInputRef = useRef<GestureInput | null>(null)
  const elementEffectsRef = useRef<ElementEffects | null>(null)
  const scoringRef = useRef<SpellScoring | null>(null)
  const trailRef = useRef<{ points: Point[]; alpha: number }[]>([])
  const animationFrameRef = useRef<number | null>(null)

  const {
    currentElement,
    setCurrentElement,
    setMousePosition,
    isLeaderboardOpen,
    setIsLeaderboardOpen,
    addScore,
    setCurrentTrajectory,
    backgroundTint,
    dailyElement,
    setBackgroundTint,
    resetGame,
    nickname,
    setNickname,
  } = useGameStore()

  const initSystems = useCallback(() => {
    if (!canvasRef.current || !effectsContainerRef.current) return

    if (!scoringRef.current) {
      scoringRef.current = new SpellScoring({ timeout: 500 })
    }

    if (!elementEffectsRef.current && effectsContainerRef.current) {
      try {
        elementEffectsRef.current = new ElementEffects(effectsContainerRef.current)
      } catch (e) {
        console.error('ElementEffects init error:', e)
      }
    }

    if (!gestureInputRef.current && canvasRef.current) {
      try {
        gestureInputRef.current = new GestureInput({
          canvas: canvasRef.current,
          onDrawingUpdate: (trajectory, isComplete) => {
            setCurrentTrajectory(trajectory)
            if (!isComplete) {
              drawTrajectory(trajectory, false)
            }
          },
          onTrajectoryComplete: async (trajectory) => {
            if (!scoringRef.current) return

            const centerX = trajectory.length > 0
              ? trajectory.reduce((sum, p) => sum + p.x, 0) / trajectory.length
              : effectsContainerRef.current?.clientWidth! / 2
            const centerY = trajectory.length > 0
              ? trajectory.reduce((sum, p) => sum + p.y, 0) / trajectory.length
              : effectsContainerRef.current?.clientHeight! / 2

            const result = await scoringRef.current.requestScore(trajectory, currentElement)
            addScore(result)

            setTimeout(() => {
              if (elementEffectsRef.current) {
                const rect = canvasRef.current?.getBoundingClientRect()
                const screenX = (rect?.left ?? 0) + (centerX / (canvasRef.current?.width ?? 1)) * (rect?.width ?? 0)
                const screenY = (rect?.top ?? 0) + (centerY / (canvasRef.current?.height ?? 1)) * (rect?.height ?? 0)
                elementEffectsRef.current.triggerEffect(result.element, result.matchQuality, screenX, screenY)
              }
            }, 50)

            if (result.matchQuality === 'fail') {
              setTimeout(() => {
                fadeTrajectory()
              }, 200)
            } else {
              setTimeout(() => {
                clearCanvasLayer()
              }, 1000)
            }
          },
        })
      } catch (e) {
        console.error('GestureInput init error:', e)
      }
    }

    setBackgroundTint(ELEMENT_COLORS[currentElement].primary)
  }, [currentElement, setCurrentTrajectory, addScore, setBackgroundTint])

  const drawTrajectory = (trajectory: Point[], isFading: boolean) => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const colors = ELEMENT_COLORS[currentElement]

    if (trajectory.length < 2) {
      if (trajectory.length === 1) {
        const p = trajectory[0]
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20)
        gradient.addColorStop(0, colors.primary + 'FF')
        gradient.addColorStop(0.5, colors.primary + '60')
        gradient.addColorStop(1, colors.primary + '00')
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(p.x, p.y, 20, 0, Math.PI * 2)
        ctx.fill()
      }
      return
    }

    for (let layer = 3; layer >= 0; layer--) {
      const offset = layer * 4
      const layerAlpha = isFading ? 0.3 + (0.15 * (3 - layer)) : 0.15 + (0.2 * (3 - layer))
      ctx.beginPath()
      ctx.moveTo(trajectory[0].x, trajectory[0].y)

      for (let i = 1; i < trajectory.length - 1; i++) {
        const xc = (trajectory[i].x + trajectory[i + 1].x) / 2
        const yc = (trajectory[i].y + trajectory[i + 1].y) / 2
        ctx.quadraticCurveTo(trajectory[i].x + offset * (Math.random() - 0.5), trajectory[i].y + offset * (Math.random() - 0.5), xc, yc)
      }

      const lastIndex = trajectory.length - 1
      ctx.lineTo(trajectory[lastIndex].x, trajectory[lastIndex].y)

      const gradient = ctx.createLinearGradient(
        trajectory[0].x, trajectory[0].y,
        trajectory[lastIndex].x, trajectory[lastIndex].y,
      )
      gradient.addColorStop(0, colors.gradient[0] + Math.floor(layerAlpha * 255).toString(16).padStart(2, '0'))
      gradient.addColorStop(0.5, colors.primary + Math.floor(layerAlpha * 255).toString(16).padStart(2, '0'))
      gradient.addColorStop(1, colors.gradient[1] + Math.floor(layerAlpha * 255).toString(16).padStart(2, '0'))

      ctx.strokeStyle = gradient
      ctx.lineWidth = layer === 0 ? 5 : 8 - layer * 1.5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.shadowColor = colors.primary
      ctx.shadowBlur = 20 + (3 - layer) * 8
      ctx.stroke()
      ctx.shadowBlur = 0
    }

    const head = trajectory[trajectory.length - 1]
    const headGradient = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 25)
    headGradient.addColorStop(0, '#FFFFFF')
    headGradient.addColorStop(0.2, colors.gradient[1])
    headGradient.addColorStop(1, colors.primary + '00')
    ctx.fillStyle = headGradient
    ctx.beginPath()
    ctx.arc(head.x, head.y, 25, 0, Math.PI * 2)
    ctx.fill()

    if (!isFading) {
      trailRef.current.push({ points: [...trajectory], alpha: 1.0 })
      if (trailRef.current.length > 5) trailRef.current.shift()
    }
  }

  const fadeTrajectory = () => {
    const fadeDuration = 500
    const startTime = performance.now()
    const startTrajectory = useGameStore.getState().currentTrajectory

    const animate = (now: number) => {
      const progress = Math.min(1, (now - startTime) / fadeDuration)
      const eased = 1 - Math.pow(1 - progress, 3)

      if (canvasRef.current) {
        const ctx = canvasRef.current.getContext('2d')
        if (ctx) {
          ctx.globalAlpha = 1 - eased
          drawTrajectory(startTrajectory, true)
          ctx.globalAlpha = 1
        }
      }

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        clearCanvasLayer()
      }
    }
    animationFrameRef.current = requestAnimationFrame(animate)
  }

  const clearCanvasLayer = () => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d')
      if (ctx) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
      }
    }
    trailRef.current = []
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    setMousePosition(e.clientX - rect.left, e.clientY - rect.top)
  }

  const resizeCanvas = useCallback(() => {
    if (canvasRef.current && effectsContainerRef.current) {
      const width = effectsContainerRef.current.clientWidth
      const height = effectsContainerRef.current.clientHeight
      canvasRef.current.width = width
      canvasRef.current.height = height
    }
  }, [])

  useEffect(() => {
    resizeCanvas()
    initSystems()
    window.addEventListener('resize', resizeCanvas)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [initSystems, resizeCanvas])

  const colors = ELEMENT_COLORS[currentElement]

  return (
    <div
      className="fixed inset-0 w-full h-full overflow-hidden transition-colors duration-1000"
      style={{
        background: `radial-gradient(circle at center, #1a0a2e 0%, #0a0510 70%, #050308 100%)`,
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
        style={{
          background: `radial-gradient(ellipse at center, ${backgroundTint}12 0%, transparent 60%)`,
          mixBlendMode: 'screen',
        }}
      />

      <div
        className="w-full h-full flex flex-col md:flex-row transition-all duration-500"
        onMouseMove={handleMouseMove}
      >
        {/* 左侧面板 - 元素和连击 */}
        <aside className="flex md:flex-col md:w-48 lg:w-56 items-center justify-center md:justify-start md:pt-8 gap-4 md:gap-8 p-4 md:p-6 order-2 md:order-1">
          <ComboDisplay />
        </aside>

        {/* 主画布区域 */}
        <main className="flex-1 flex flex-col relative order-1 md:order-2 p-2 md:p-6 min-h-0">
          {/* 顶栏 */}
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-3">
              <div
                className="px-4 py-2 rounded-xl backdrop-blur-md border"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="text-[10px] text-white/40 uppercase tracking-widest">每日克制</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-sm font-bold"
                    style={{ color: ELEMENT_COLORS[dailyElement].primary }}
                  >
                    {dailyElement === 'fire' ? '火焰' : dailyElement === 'water' ? '水波' : dailyElement === 'wind' ? '旋风' : '雷电'}
                  </span>
                  <span className="text-xs text-white/30">被克制练习 1.5x</span>
                </div>
              </div>

              <div
                className="px-4 py-2 rounded-xl backdrop-blur-md border hidden sm:block"
                style={{
                  backgroundColor: 'rgba(255,255,255,0.04)',
                  borderColor: 'rgba(255,255,255,0.08)',
                }}
              >
                <div className="text-[10px] text-white/40 uppercase tracking-widest">学员昵称</div>
                <div className="flex items-center gap-2 mt-0.5">
                  <User className="w-3 h-3 text-white/50" />
                  <input
                    type="text"
                    value={nickname}
                    onChange={(e) => setNickname(e.target.value)}
                    className="bg-transparent outline-none text-sm font-bold text-white/80 w-24"
                    maxLength={12}
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={resetGame}
                className="p-2.5 rounded-xl backdrop-blur-md text-white/60 hover:text-white transition-all hover:bg-white/10 border border-white/10"
                title="重置练习"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                onClick={() => setIsLeaderboardOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl backdrop-blur-md text-white transition-all hover:scale-105 border"
                style={{
                  background: `linear-gradient(135deg, ${colors.primary}25, ${colors.primary}08)`,
                  borderColor: `${colors.primary}35`,
                  boxShadow: `0 0 20px ${colors.primary}20`,
                }}
              >
                <Trophy className="w-4 h-4" style={{ color: colors.primary }} />
                <span className="text-sm font-bold">排行榜</span>
              </button>
            </div>
          </div>

          {/* 画布容器 */}
          <div
            ref={effectsContainerRef}
            className="relative flex-1 rounded-3xl overflow-hidden border-2 min-h-[350px] md:min-h-0"
            style={{
              background: `radial-gradient(ellipse at 50% 40%, ${colors.primary}08 0%, transparent 70%), rgba(5, 2, 10, 0.85)`,
              borderColor: `${colors.primary}25`,
              boxShadow: `0 0 60px ${colors.primary}10, inset 0 0 80px rgba(0,0,0,0.5)`,
            }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 w-full h-full z-20 cursor-crosshair"
              style={{ touchAction: 'none' }}
            />

            <MouseGlow />

            <ScoreResult />

            <DrawHint />
          </div>

          {/* 底部元素选择器 */}
          <div
            className="mt-4 rounded-3xl border-2 backdrop-blur-md transition-colors duration-700"
            style={{
              backgroundColor: 'rgba(10, 5, 16, 0.6)',
              borderColor: `${colors.primary}25`,
            }}
          >
            <ElementSelector
              onElementChange={(el) => {
                setCurrentElement(el)
                clearCanvasLayer()
              }}
            />
          </div>
        </main>

        {/* 右侧面板 - 评分和排行榜入口 */}
        <aside className="flex md:flex-col md:w-48 lg:w-56 items-center justify-center md:justify-start md:pt-8 gap-4 md:gap-6 p-4 md:p-6 order-3">
          <div className="flex flex-col items-center gap-6">
            <ScoreRing />

            <div
              className="w-full p-4 rounded-2xl backdrop-blur-md border text-center"
              style={{
                backgroundColor: `${colors.primary}08`,
                borderColor: `${colors.primary}20`,
              }}
            >
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-1">
                操作说明
              </div>
              <div className="flex items-start gap-2 mt-3 text-left">
                <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" style={{ color: colors.primary }} />
                <div className="text-xs text-white/60 leading-relaxed space-y-1">
                  <p>按住鼠标左键绘制符咒</p>
                  <p>松开自动识别评分</p>
                  <p>匹配度越高得分越多</p>
                </div>
              </div>
            </div>

            <div
              className="w-full p-4 rounded-2xl backdrop-blur-md border text-center hidden md:block"
              style={{
                backgroundColor: 'rgba(255,255,255,0.02)',
                borderColor: 'rgba(255,255,255,0.06)',
              }}
            >
              <div className="text-[10px] text-white/40 uppercase tracking-widest mb-2">
                符咒模板提示
              </div>
              <div className="text-xs text-white/50 leading-relaxed">
                {currentElement === 'fire' && (
                  <>🔥 绘制三角形<br/><span className="opacity-60">菱形闭合</span></>
                )}
                {currentElement === 'water' && (
                  <>💧 绘制波浪线<br/><span className="opacity-60">横向正弦波</span></>
                )}
                {currentElement === 'wind' && (
                  <>🌪️ 绘制螺旋形<br/><span className="opacity-60">旋转向外扩散</span></>
                )}
                {currentElement === 'thunder' && (
                  <>⚡ 绘制闪电折线<br/><span className="opacity-60">锯齿状上下</span></>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>

      {scoringRef.current && (
        <Leaderboard
          isOpen={isLeaderboardOpen}
          onClose={() => setIsLeaderboardOpen(false)}
          scoring={scoringRef.current}
        />
      )}
    </div>
  )
}

const MouseGlow: React.FC = () => {
  const { mousePosition, currentElement } = useGameStore()
  const colors = ELEMENT_COLORS[currentElement]

  return (
    <div
      className="pointer-events-none absolute z-10 transition-opacity duration-300"
      style={{
        left: mousePosition.x - 150,
        top: mousePosition.y - 150,
        width: 300,
        height: 300,
        background: `radial-gradient(circle, ${colors.primary}18 0%, transparent 60%)`,
        filter: 'blur(10px)',
        mixBlendMode: 'screen',
      }}
    />
  )
}

const DrawHint: React.FC = () => {
  const { isDrawing, currentTrajectory, currentElement } = useGameStore()
  const colors = ELEMENT_COLORS[currentElement]

  if (isDrawing || currentTrajectory.length > 0) return null

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
      <div
        className="text-center p-8 rounded-3xl animate-pulse-soft"
        style={{
          backgroundColor: `${colors.primary}08`,
          border: `1px dashed ${colors.primary}30`,
        }}
      >
        <div
          className="text-6xl mb-3"
          style={{ filter: `drop-shadow(0 0 20px ${colors.primary}60)` }}
        >
          {currentElement === 'fire' ? '🔥' : currentElement === 'water' ? '💧' : currentElement === 'wind' ? '🌪️' : '⚡'}
        </div>
        <div
          className="text-lg font-bold mb-1"
          style={{
            fontFamily: '"Cinzel Decorative", serif',
            color: colors.primary,
            textShadow: `0 0 15px ${colors.primary}60`,
          }}
        >
          按住鼠标绘制符咒
        </div>
        <div className="text-xs text-white/40 tracking-wider">
          释放魔法元素的力量
        </div>
      </div>
    </div>
  )
}
