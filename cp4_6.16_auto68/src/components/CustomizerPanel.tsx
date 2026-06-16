import { useState, useRef, useEffect, useCallback } from 'react'
import { ArrowLeft, RotateCcw } from 'lucide-react'
import { useGameStore } from '../store/useGameStore'
import { usePlayerStore } from '../store/usePlayerStore'
import { drawCarOnCanvas } from '../engine/carCustomizer'
import { BASE_COLORS, STICKER_TYPES, type StickerType } from '../types'

const stickerNames: Record<StickerType, string> = {
  none: '无贴纸',
  flame: '火焰纹',
  lightning: '闪电',
  skull: '骷髅',
  star: '星形',
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 255, g: 255, b: 255 }
}

function lerpColor(from: string, to: string, t: number): string {
  const fromRgb = hexToRgb(from)
  const toRgb = hexToRgb(to)
  const r = Math.round(fromRgb.r + (toRgb.r - fromRgb.r) * t)
  const g = Math.round(fromRgb.g + (toRgb.g - fromRgb.g) * t)
  const b = Math.round(fromRgb.b + (toRgb.b - fromRgb.b) * t)
  return `rgb(${r}, ${g}, ${b})`
}

export function CustomizerPanel() {
  const { setScreen } = useGameStore()
  const { player, setCustomizationColor, setCustomizationSticker } = usePlayerStore()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [rotation, setRotation] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const lastXRef = useRef(0)
  const [targetColor, setTargetColor] = useState(player?.currentCustomization.color || '#ffffff')
  const [targetSticker, setTargetSticker] = useState<StickerType>(
    player?.currentCustomization.sticker || 'none'
  )

  const displayColorRef = useRef(player?.currentCustomization.color || '#ffffff')
  const displayStickerRef = useRef<StickerType>(player?.currentCustomization.sticker || 'none')
  const animColorRef = useRef({ from: '#ffffff', to: '#ffffff', progress: 1, duration: 80 })
  const animStickerRef = useRef({
    from: 'none' as StickerType,
    to: 'none' as StickerType,
    progress: 1,
    duration: 100,
  })
  const animationFrameRef = useRef<number>(0)

  const renderCar = useCallback(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    const gradient = ctx.createRadialGradient(
      canvas.width / 2,
      canvas.height / 2,
      0,
      canvas.width / 2,
      canvas.height / 2,
      200
    )
    gradient.addColorStop(0, 'rgba(147, 51, 234, 0.15)')
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)

    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)'
    ctx.beginPath()
    ctx.ellipse(0, 60, 80, 15, 0, 0, Math.PI * 2)
    ctx.fill()

    const stickerProgress = animStickerRef.current.progress
    if (stickerProgress < 1 && animStickerRef.current.from !== animStickerRef.current.to) {
      const scale1 = 1 - stickerProgress * 0.3
      const scale2 = 0.7 + stickerProgress * 0.3
      const alpha1 = 1 - stickerProgress
      const alpha2 = stickerProgress

      ctx.globalAlpha = alpha1
      ctx.save()
      ctx.scale(scale1, scale1)
      drawCarOnCanvas(ctx, 0, 0, rotation, displayColorRef.current, animStickerRef.current.from, 2.5)
      ctx.restore()

      ctx.globalAlpha = alpha2
      ctx.save()
      ctx.scale(scale2, scale2)
      drawCarOnCanvas(ctx, 0, 0, rotation, displayColorRef.current, animStickerRef.current.to, 2.5)
      ctx.restore()

      ctx.globalAlpha = 1
    } else {
      drawCarOnCanvas(ctx, 0, 0, rotation, displayColorRef.current, displayStickerRef.current, 2.5)
    }

    ctx.restore()
  }, [rotation])

  useEffect(() => {
    let lastTime = performance.now()

    const animate = (time: number) => {
      const dt = time - lastTime
      lastTime = time

      let needsRender = false

      if (animColorRef.current.progress < 1) {
        animColorRef.current.progress = Math.min(
          1,
          animColorRef.current.progress + dt / animColorRef.current.duration
        )
        displayColorRef.current = lerpColor(
          animColorRef.current.from,
          animColorRef.current.to,
          animColorRef.current.progress
        )
        needsRender = true
      }

      if (animStickerRef.current.progress < 1) {
        animStickerRef.current.progress = Math.min(
          1,
          animStickerRef.current.progress + dt / animStickerRef.current.duration
        )
        if (animStickerRef.current.progress >= 1) {
          displayStickerRef.current = animStickerRef.current.to
        }
        needsRender = true
      }

      if (needsRender) {
        renderCar()
      }

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [renderCar])

  useEffect(() => {
    if (player) {
      setTargetColor(player.currentCustomization.color)
      setTargetSticker(player.currentCustomization.sticker)
      displayColorRef.current = player.currentCustomization.color
      displayStickerRef.current = player.currentCustomization.sticker
    }
  }, [player])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    lastXRef.current = e.clientX
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return
    const deltaX = e.clientX - lastXRef.current
    setRotation((prev) => prev + deltaX * 0.01)
    lastXRef.current = e.clientX
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleColorSelect = async (color: string) => {
    const fromColor = displayColorRef.current
    animColorRef.current = {
      from: fromColor,
      to: color,
      progress: 0,
      duration: 80,
    }
    setTargetColor(color)
    await setCustomizationColor(color)
  }

  const handleStickerSelect = async (sticker: StickerType) => {
    if (sticker === displayStickerRef.current) return
    animStickerRef.current = {
      from: displayStickerRef.current,
      to: sticker,
      progress: 0,
      duration: 100,
    }
    setTargetSticker(sticker)
    await setCustomizationSticker(sticker)
  }

  const handleResetRotation = () => {
    setRotation(0)
  }

  return (
    <div className="relative w-full h-screen min-h-[720px] flex flex-col overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-purple-950 to-fuchsia-950" />

      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #7c3aed 0%, transparent 70%)',
            top: '-10%',
            left: '-10%',
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-3xl"
          style={{
            background: 'radial-gradient(circle, #db2777 0%, transparent 70%)',
            bottom: '-5%',
            right: '5%',
          }}
        />
      </div>

      <div className="relative z-10 flex items-center justify-between p-6">
        <button
          onClick={() => setScreen('menu')}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-black/40 backdrop-blur-md border border-purple-500/30 text-white hover:bg-purple-600/30 hover:border-purple-400/50 transition-all duration-200 hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>返回主菜单</span>
        </button>

        <h2 className="text-2xl font-bold text-white" style={{ fontFamily: "'Orbitron', sans-serif" }}>
          涂装工坊
        </h2>

        <div className="w-32" />
      </div>

      <div className="relative z-10 flex-1 flex gap-8 px-8 pb-8">
        <div className="flex-1 flex flex-col items-center justify-center">
          <div
            className="relative cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            <canvas
              ref={canvasRef}
              width={400}
              height={300}
              className="transition-all duration-100"
            />
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-purple-300/60 text-sm">
              拖拽旋转查看
            </div>
          </div>

          <button
            onClick={handleResetRotation}
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-purple-500/20 text-purple-300 text-sm hover:bg-white/10 hover:text-white transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            重置视角
          </button>
        </div>

        <div className="w-96 flex flex-col gap-6">
          <div className="p-6 rounded-2xl bg-black/30 backdrop-blur-md border border-purple-500/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-purple-500 to-pink-500 rounded-full" />
              车身颜色
            </h3>

            <div className="grid grid-cols-4 gap-3">
              {BASE_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`aspect-square rounded-xl border-2 transition-all duration-150 hover:scale-110 active:scale-95 ${
                    targetColor === color
                      ? 'border-yellow-400 shadow-lg shadow-yellow-400/30 scale-110'
                      : 'border-white/20 hover:border-white/40'
                  }`}
                  style={{ backgroundColor: color }}
                >
                  {targetColor === color && (
                    <span className="text-2xl">✓</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-black/30 backdrop-blur-md border border-purple-500/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full" />
              贴纸图案
            </h3>

            <div className="grid grid-cols-2 gap-3">
              {STICKER_TYPES.map((sticker) => (
                <button
                  key={sticker}
                  onClick={() => handleStickerSelect(sticker)}
                  className={`p-4 rounded-xl border-2 transition-all duration-150 hover:scale-105 active:scale-95 flex flex-col items-center gap-2 ${
                    targetSticker === sticker
                      ? 'border-yellow-400 bg-yellow-400/10 shadow-lg shadow-yellow-400/20'
                      : 'border-white/20 bg-white/5 hover:border-white/40 hover:bg-white/10'
                  }`}
                >
                  <StickerPreview sticker={sticker} />
                  <span className="text-sm text-white">{stickerNames[sticker]}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-black/30 backdrop-blur-md border border-purple-500/30">
            <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
              <span className="w-2 h-6 bg-gradient-to-b from-amber-500 to-orange-500 rounded-full" />
              当前涂装
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-purple-300">车身颜色</span>
                <div className="flex items-center gap-2">
                  <div
                    className="w-6 h-6 rounded-md border border-white/30"
                    style={{ backgroundColor: targetColor }}
                  />
                  <span className="text-white font-mono">{targetColor}</span>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-purple-300">贴纸图案</span>
                <span className="text-white">{stickerNames[targetSticker]}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function StickerPreview({ sticker }: { sticker: StickerType }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    if (sticker === 'none') {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 4])
      ctx.strokeRect(10, 10, 40, 40)
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
      ctx.font = '20px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText('∅', 30, 36)
      return
    }

    drawCarOnCanvas(ctx, 30, 30, 0, '#666', sticker, 1)
  }, [sticker])

  return <canvas ref={canvasRef} width={60} height={60} className="w-12 h-12" />
}
