import React, { useRef, useEffect, useCallback } from 'react'
import { useSimStore, Cell, getCellColor, CellType } from '../store'
import { cellBehavior } from '../CellBehavior'
import { environmentModule } from '../EnvironmentModule'

const DISH_RADIUS = 350
const DISH_CENTER = 350
const CANVAS_SIZE = 700

type ToolMode = 'food' | 'toxin' | null

interface CultureDishProps {
  toolMode: ToolMode
}

const complementColor: Record<CellType, string> = {
  green: '#FF0077',
  purple: '#66FF66',
  orange: '#0073FF'
}

const CultureDish: React.FC<CultureDishProps> = ({ toolMode }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animFrameRef = useRef<number>(0)
  const lastPopRecordRef = useRef<number>(0)
  const toolModeRef = useRef<ToolMode>(toolMode)

  useEffect(() => {
    toolModeRef.current = toolMode
  }, [toolMode])

  const drawDishBackground = useCallback((ctx: CanvasRenderingContext2D) => {
    ctx.save()
    const gradient = ctx.createRadialGradient(
      DISH_CENTER,
      DISH_CENTER,
      0,
      DISH_CENTER,
      DISH_CENTER,
      DISH_RADIUS
    )
    gradient.addColorStop(0, '#1A1A2E')
    gradient.addColorStop(1, '#16213E')
    ctx.beginPath()
    ctx.arc(DISH_CENTER, DISH_CENTER, DISH_RADIUS, 0, Math.PI * 2)
    ctx.fillStyle = gradient
    ctx.fill()

    ctx.beginPath()
    ctx.arc(DISH_CENTER, DISH_CENTER, DISH_RADIUS, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0, 255, 136, 0.2)'
    ctx.lineWidth = 2
    ctx.shadowColor = '#00FF88'
    ctx.shadowBlur = 15
    ctx.stroke()
    ctx.restore()
  }, [])

  const drawCell = useCallback((ctx: CanvasRenderingContext2D, cell: Cell) => {
    ctx.save()
    const isDead = cell.health <= 0
    let baseColor: string
    if (isDead) {
      baseColor = '#808080'
    } else {
      baseColor = getCellColor(cell.type)
    }

    let displayRadius = cell.radius
    if (cell.expandTimer > 0) {
      displayRadius += 2 * (cell.expandTimer / 30)
    }

    if (cell.flashTimer > 0) {
      ctx.shadowColor = '#FFFFFF'
      ctx.shadowBlur = 25
    } else {
      ctx.shadowColor = baseColor
      ctx.shadowBlur = 10
    }

    ctx.beginPath()
    ctx.arc(cell.x, cell.y, displayRadius, 0, Math.PI * 2)
    ctx.fillStyle = baseColor
    if (cell.flashTimer > 0 && !isDead) {
      ctx.globalAlpha = 0.6 + 0.4 * Math.sin((cell.flashTimer / 12) * Math.PI * 4)
    }
    ctx.fill()
    ctx.globalAlpha = 1
    ctx.shadowBlur = 0

    ctx.beginPath()
    ctx.arc(cell.x, cell.y, 2, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
    ctx.fill()

    const compColor = isDead ? '#AAAAAA' : complementColor[cell.type]
    ctx.strokeStyle = compColor
    ctx.globalAlpha = 0.3
    ctx.lineWidth = 1
    for (let i = 0; i < 2; i++) {
      const angle = cell.rotation + i * Math.PI
      ctx.beginPath()
      ctx.moveTo(
        cell.x + Math.cos(angle) * (displayRadius - 1),
        cell.y + Math.sin(angle) * (displayRadius - 1)
      )
      ctx.lineTo(
        cell.x - Math.cos(angle) * (displayRadius - 1),
        cell.y - Math.sin(angle) * (displayRadius - 1)
      )
      ctx.stroke()
    }
    ctx.globalAlpha = 1

    ctx.restore()
  }, [])

  const drawFood = useCallback(
    (ctx: CanvasRenderingContext2D, f: { x: number; y: number; radius: number; lifetime: number; maxLifetime: number }) => {
      ctx.save()
      const alpha = Math.min(1, f.lifetime / (f.maxLifetime * 0.3))
      ctx.globalAlpha = alpha

      ctx.beginPath()
      ctx.arc(f.x, f.y, 60, 0, Math.PI * 2)
      ctx.strokeStyle = 'rgba(0, 255, 136, 0.15)'
      ctx.lineWidth = 1
      ctx.stroke()

      const gradient = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, f.radius)
      gradient.addColorStop(0, '#00FF88')
      gradient.addColorStop(1, '#00CC66')
      ctx.beginPath()
      ctx.arc(f.x, f.y, f.radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.shadowColor = '#00FF88'
      ctx.shadowBlur = 20
      ctx.fill()
      ctx.restore()
    },
    []
  )

  const drawToxin = useCallback(
    (ctx: CanvasRenderingContext2D, t: { x: number; y: number; radius: number; lifetime: number; maxLifetime: number }) => {
      ctx.save()
      const alpha = Math.min(1, t.lifetime / (t.maxLifetime * 0.3))
      ctx.globalAlpha = alpha

      const gradient = ctx.createRadialGradient(t.x, t.y, 0, t.x, t.y, t.radius)
      gradient.addColorStop(0, '#9B59B6')
      gradient.addColorStop(1, '#8E44AD')
      ctx.beginPath()
      ctx.arc(t.x, t.y, t.radius, 0, Math.PI * 2)
      ctx.fillStyle = gradient
      ctx.shadowColor = '#9B59B6'
      ctx.shadowBlur = 20
      ctx.fill()
      ctx.restore()
    },
    []
  )

  const drawExplosion = useCallback(
    (ctx: CanvasRenderingContext2D, e: { x: number; y: number; lifetime: number; maxLifetime: number; color: string }) => {
      ctx.save()
      const alpha = e.lifetime / e.maxLifetime
      ctx.globalAlpha = alpha
      ctx.fillStyle = e.color
      ctx.shadowColor = e.color
      ctx.shadowBlur = 8
      ctx.beginPath()
      ctx.arc(e.x, e.y, 2, 0, Math.PI * 2)
      ctx.fill()
      ctx.restore()
    },
    []
  )

  const simulationLoop = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const state = useSimStore.getState()
    const { cells, foodParticles, toxinParticles, explosionParticles, temperature } = state

    const deltaTime = 1 / 60
    const result = cellBehavior.step(cells, temperature, foodParticles, toxinParticles, deltaTime)

    let newCells = [...result.cells, ...result.newCells]
    const newFood = environmentModule.updateFoodParticles(foodParticles)
    const newToxins = environmentModule.updateToxinParticles(toxinParticles)
    const newExplosions = environmentModule.updateExplosionParticles(explosionParticles)

    if (result.predationOccurred) {
      useSimStore.getState().recordPredation()
      for (const id of result.removedIds) {
        const removed = cells.find((c) => c.id === id)
        if (removed) {
          useSimStore.getState().addExplosion(removed.x, removed.y, '#00FF88')
        }
      }
    }

    useSimStore.setState({
      cells: newCells,
      foodParticles: newFood,
      toxinParticles: newToxins,
      explosionParticles: newExplosions
    })

    const now = Date.now()
    if (now - lastPopRecordRef.current > 500) {
      lastPopRecordRef.current = now
      useSimStore.getState().recordPopulation()
    }

    ctx.fillStyle = '#0F0F1A'
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE)

    drawDishBackground(ctx)

    for (const f of newFood) {
      drawFood(ctx, f)
    }
    for (const t of newToxins) {
      drawToxin(ctx, t)
    }
    for (const c of newCells) {
      drawCell(ctx, c)
    }
    for (const e of newExplosions) {
      drawExplosion(ctx, e)
    }

    animFrameRef.current = requestAnimationFrame(simulationLoop)
  }, [drawDishBackground, drawCell, drawFood, drawToxin, drawExplosion])

  useEffect(() => {
    useSimStore.getState().initializeCells()
    animFrameRef.current = requestAnimationFrame(simulationLoop)
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
    }
  }, [simulationLoop])

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current
      if (!canvas) return
      const rect = canvas.getBoundingClientRect()
      const scaleX = canvas.width / rect.width
      const scaleY = canvas.height / rect.height
      const x = (e.clientX - rect.left) * scaleX
      const y = (e.clientY - rect.top) * scaleY

      if (!environmentModule.isPointInDish(x, y)) return

      const mode = toolModeRef.current
      if (mode === 'food') {
        const clamped = environmentModule.clampToDish(x, y)
        useSimStore.getState().addFood(clamped.x, clamped.y)
      } else if (mode === 'toxin') {
        const clamped = environmentModule.clampToDish(x, y)
        useSimStore.getState().addToxin(clamped.x, clamped.y)
      }
    },
    []
  )

  const cursorStyle = toolMode ? 'crosshair' : 'default'

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
      <canvas
        ref={canvasRef}
        width={CANVAS_SIZE}
        height={CANVAS_SIZE}
        onClick={handleCanvasClick}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          cursor: cursorStyle,
          borderRadius: '8px'
        }}
      />
    </div>
  )
}

export default CultureDish
