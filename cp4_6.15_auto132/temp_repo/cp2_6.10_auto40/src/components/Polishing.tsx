import { useEffect, useRef, useState, useCallback } from 'react'
import { useCastingStore } from '@/store'
import { CastingPhase } from '@/types'
import './Polishing.css'

export default function Polishing() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [stonePos, setStonePos] = useState({ x: 100, y: 150 })
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null)
  const lastStrokeTime = useRef<number>(0)

  const phase = useCastingStore(state => state.phase)
  const sword = useCastingStore(state => state.sword)
  const polishCount = useCastingStore(state => state.polishCount)
  const scratchLines = useCastingStore(state => state.scratchLines)
  const addPolishStroke = useCastingStore(state => state.addPolishStroke)
  const finishPolishing = useCastingStore(state => state.finishPolishing)

  const isActive = phase === CastingPhase.Polishing || (sword.ingotRough && !sword.polished)
  const canFinish = polishCount >= 20

  const drawSword = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const centerX = width / 2
    const swordWidth = 40
    const swordHeight = height - 60

    const bladeGradient = ctx.createLinearGradient(centerX - swordWidth / 2, 0, centerX + swordWidth / 2, 0)
    bladeGradient.addColorStop(0, '#2a1a0a')
    bladeGradient.addColorStop(0.3, '#3a2a1a')
    bladeGradient.addColorStop(0.5, '#4a3a2a')
    bladeGradient.addColorStop(0.7, '#3a2a1a')
    bladeGradient.addColorStop(1, '#2a1a0a')

    ctx.beginPath()
    ctx.moveTo(centerX, 30)
    ctx.lineTo(centerX + swordWidth / 2, 50)
    ctx.lineTo(centerX + swordWidth / 2 - 5, swordHeight - 30)
    ctx.lineTo(centerX + 10, swordHeight)
    ctx.lineTo(centerX - 10, swordHeight)
    ctx.lineTo(centerX - swordWidth / 2 + 5, swordHeight - 30)
    ctx.lineTo(centerX - swordWidth / 2, 50)
    ctx.closePath()
    ctx.fillStyle = bladeGradient
    ctx.fill()
    ctx.strokeStyle = '#1a0a00'
    ctx.lineWidth = 2
    ctx.stroke()

    const exposedRatio = Math.min(0.7, polishCount * 0.035)
    if (exposedRatio > 0) {
      const edgeWidth = swordWidth * exposedRatio * 0.5

      ctx.save()
      ctx.clip()

      const edgeGradient = ctx.createLinearGradient(centerX - swordWidth / 2, 0, centerX, 0)
      edgeGradient.addColorStop(0, '#b88a44')
      edgeGradient.addColorStop(0.5, '#d4a060')
      edgeGradient.addColorStop(1, '#b88a44')

      ctx.beginPath()
      ctx.moveTo(centerX, 30)
      ctx.lineTo(centerX + swordWidth / 2, 50)
      ctx.lineTo(centerX + swordWidth / 2 - 5, swordHeight - 30)
      ctx.lineTo(centerX + 10, swordHeight)
      ctx.lineTo(centerX + 10 - edgeWidth, swordHeight - 20)
      ctx.lineTo(centerX + swordWidth / 2 - 5 - edgeWidth, swordHeight - 40)
      ctx.lineTo(centerX + swordWidth / 2 - edgeWidth, 55)
      ctx.lineTo(centerX - edgeWidth * 0.5, 35)
      ctx.closePath()
      ctx.fillStyle = edgeGradient
      ctx.fill()

      ctx.beginPath()
      ctx.moveTo(centerX, 30)
      ctx.lineTo(centerX - swordWidth / 2, 50)
      ctx.lineTo(centerX - swordWidth / 2 + 5, swordHeight - 30)
      ctx.lineTo(centerX - 10, swordHeight)
      ctx.lineTo(centerX - 10 + edgeWidth, swordHeight - 20)
      ctx.lineTo(centerX - swordWidth / 2 + 5 + edgeWidth, swordHeight - 40)
      ctx.lineTo(centerX - swordWidth / 2 + edgeWidth, 55)
      ctx.lineTo(centerX + edgeWidth * 0.5, 35)
      ctx.closePath()
      ctx.fillStyle = edgeGradient
      ctx.fill()

      ctx.restore()
    }

    scratchLines.forEach(line => {
      ctx.beginPath()
      ctx.moveTo(line.x1, line.y1)
      ctx.lineTo(line.x2, line.y2)
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)'
      ctx.lineWidth = 1
      ctx.stroke()
    })
  }, [polishCount, scratchLines])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      drawSword(ctx, canvas.width, canvas.height)

      if (isDragging) {
        ctx.fillStyle = '#7a8a7a'
        ctx.fillRect(stonePos.x - 25, stonePos.y - 10, 50, 20)
        ctx.strokeStyle = '#5a6a5a'
        ctx.lineWidth = 2
        ctx.strokeRect(stonePos.x - 25, stonePos.y - 10, 50, 20)
      }
    }

    render()
    const animationId = requestAnimationFrame(function loop() {
      render()
      requestAnimationFrame(loop)
    })

    return () => cancelAnimationFrame(animationId)
  }, [drawSword, isDragging, stonePos])

  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null

    const rect = canvas.getBoundingClientRect()
    let clientX: number, clientY: number

    if ('touches' in e) {
      clientX = e.touches[0].clientX
      clientY = e.touches[0].clientY
    } else {
      clientX = e.clientX
      clientY = e.clientY
    }

    return {
      x: (clientX - rect.left) * (canvas.width / rect.width),
      y: (clientY - rect.top) * (canvas.height / rect.height)
    }
  }

  const handleStart = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isActive || sword.polished) return
    const coords = getCanvasCoords(e)
    if (!coords) return

    setIsDragging(true)
    setStonePos(coords)
    setLastPos(coords)
  }

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDragging || !isActive || sword.polished) return
    const coords = getCanvasCoords(e)
    if (!coords) return

    setStonePos(coords)

    const now = Date.now()
    if (lastPos && now - lastStrokeTime.current > 50) {
      const strokeLength = Math.sqrt(
        Math.pow(coords.x - lastPos.x, 2) + Math.pow(coords.y - lastPos.y, 2)
      )

      if (strokeLength > 10) {
        addPolishStroke({
          x1: lastPos.x,
          y1: lastPos.y,
          x2: coords.x,
          y2: coords.y
        })
        lastStrokeTime.current = now
        setLastPos(coords)
      }
    }
  }

  const handleEnd = () => {
    setIsDragging(false)
    setLastPos(null)
  }

  if (!sword.ingotRough && phase !== CastingPhase.Polishing) {
    return (
      <div className="polishing-placeholder">
        <p className="seal-text">完成浇铸冷却后可进行打磨</p>
      </div>
    )
  }

  return (
    <div className="polishing-container">
      <div className="polishing-scene">
        <canvas
          ref={canvasRef}
          width={300}
          height={400}
          className="polishing-canvas"
          onMouseDown={handleStart}
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchStart={handleStart}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
          style={{ cursor: isActive && !sword.polished ? 'none' : 'default' }}
        />

        {!isDragging && isActive && !sword.polished && (
          <div
            className="whetstone-preview"
            style={{ left: stonePos.x, top: stonePos.y }}
          >
            <span className="whetstone-label">磨石</span>
          </div>
        )}
      </div>

      <div className="polishing-controls">
        <div className="progress-section">
          <div className="progress-label">
            <span className="seal-text">打磨次数</span>
            <span className="progress-count">{polishCount} / 20</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar"
              style={{ width: `${Math.min(100, polishCount * 5)}%` }}
            />
          </div>
        </div>

        <div className="sharpness-section">
          <div className="progress-label">
            <span className="seal-text">锋利度</span>
            <span className="progress-count">{sword.sharpness.toFixed(0)}%</span>
          </div>
          <div className="progress-bar-container">
            <div
              className="progress-bar sharpness"
              style={{ width: `${sword.sharpness}%` }}
            />
          </div>
        </div>

        <button
          className={`finish-button ${canFinish ? 'enabled' : 'disabled'}`}
          onClick={finishPolishing}
          disabled={!canFinish || sword.polished}
        >
          <span className="seal-text">
            {sword.polished ? '打磨已完成' : '完成开刃'}
          </span>
        </button>

        <div className="tip-text">
          <span className="seal-text">按住鼠标沿剑刃往复拖动打磨</span>
        </div>
      </div>
    </div>
  )
}
