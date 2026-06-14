import React, { useRef, useEffect, useCallback } from 'react'
import { useCanvasStore, type Stroke, type Point } from './store'
import { aiCompleter } from './AICompleter'

const BG_COLOR = '#f5f5f0'
const MAJOR_GRID_COLOR = '#d4d4d4'
const MINOR_GRID_COLOR = '#ebebeb'
const MAJOR_GRID_SIZE = 50
const MINOR_GRID_SIZE = 10
const EDGE_BLEND_WIDTH = 8

const Canvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number>(0)
  const lastPosRef = useRef<{ x: number; y: number } | null>(null)
  const isPanningRef = useRef(false)
  const panStartRef = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(null)

  const {
    tool,
    color,
    brushSize,
    layers,
    activeLayerId,
    strokes,
    selection,
    viewOffset,
    zoom,
    aiCompleting,
    isDrawing,
    currentStroke,
    setMousePos,
    startDrawing,
    continueDrawing,
    endDrawing,
    startSelection,
    updateSelection,
    setViewOffset,
    setZoom,
    startAICompletion,
    updateAICompletion,
    finishAICompletion,
    clearSelection
  } = useCanvasStore()

  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    return {
      x: (screenX - viewOffset.x) / zoom,
      y: (screenY - viewOffset.y) / zoom
    }
  }, [viewOffset, zoom])

  const drawGrid = useCallback((ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.fillStyle = BG_COLOR
    ctx.fillRect(0, 0, width, height)

    const startWorldX = -viewOffset.x / zoom
    const startWorldY = -viewOffset.y / zoom
    const endWorldX = (width - viewOffset.x) / zoom
    const endWorldY = (height - viewOffset.y) / zoom

    ctx.lineWidth = 1

    const minorStartX = Math.floor(startWorldX / MINOR_GRID_SIZE) * MINOR_GRID_SIZE
    const minorStartY = Math.floor(startWorldY / MINOR_GRID_SIZE) * MINOR_GRID_SIZE

    ctx.strokeStyle = MINOR_GRID_COLOR
    ctx.beginPath()
    for (let x = minorStartX; x <= endWorldX; x += MINOR_GRID_SIZE) {
      if (x % MAJOR_GRID_SIZE !== 0) {
        const screenX = x * zoom + viewOffset.x
        ctx.moveTo(screenX, 0)
        ctx.lineTo(screenX, height)
      }
    }
    for (let y = minorStartY; y <= endWorldY; y += MINOR_GRID_SIZE) {
      if (y % MAJOR_GRID_SIZE !== 0) {
        const screenY = y * zoom + viewOffset.y
        ctx.moveTo(0, screenY)
        ctx.lineTo(width, screenY)
      }
    }
    ctx.stroke()

    const majorStartX = Math.floor(startWorldX / MAJOR_GRID_SIZE) * MAJOR_GRID_SIZE
    const majorStartY = Math.floor(startWorldY / MAJOR_GRID_SIZE) * MAJOR_GRID_SIZE

    ctx.strokeStyle = MAJOR_GRID_COLOR
    ctx.beginPath()
    for (let x = majorStartX; x <= endWorldX; x += MAJOR_GRID_SIZE) {
      const screenX = x * zoom + viewOffset.x
      ctx.moveTo(screenX, 0)
      ctx.lineTo(screenX, height)
    }
    for (let y = majorStartY; y <= endWorldY; y += MAJOR_GRID_SIZE) {
      const screenY = y * zoom + viewOffset.y
      ctx.moveTo(0, screenY)
      ctx.lineTo(width, screenY)
    }
    ctx.stroke()
  }, [viewOffset, zoom])

  const drawStrokeSegment = useCallback((
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    from: Point,
    to: Point,
    blendAlpha: number = 1
  ) => {
    if (stroke.tool === 'airbrush') return

    const dx = to.x - from.x
    const dy = to.y - from.y
    const dist = Math.sqrt(dx * dx + dy * dy)
    const dt = to.timestamp - from.timestamp
    const speed = dt > 0 ? dist / dt : 0
    const sizeFactor = Math.max(0.6, Math.min(1, 1 - speed * 0.003))

    const actualSize = stroke.baseSize * sizeFactor

    let alpha = 1
    if (stroke.tool === 'marker') {
      alpha = 0.5
    } else {
      alpha = 0.7 + Math.random() * 0.3
    }
    alpha *= blendAlpha

    ctx.save()
    ctx.strokeStyle = stroke.color
    ctx.fillStyle = stroke.color
    ctx.globalAlpha = alpha
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = actualSize

    if (stroke.tool === 'pencil') {
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    } else if (stroke.tool === 'marker') {
      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)
      ctx.stroke()
    }
    ctx.restore()
  }, [])

  const drawStroke = useCallback((
    ctx: CanvasRenderingContext2D,
    stroke: Stroke,
    animProgress: number = 1,
    selectionRect?: { x: number; y: number; width: number; height: number }
  ) => {
    const totalPoints = stroke.points.length
    if (totalPoints < 1) return

    const pointsToDraw = Math.floor(totalPoints * animProgress)
    if (pointsToDraw < 1) return

    ctx.save()
    ctx.translate(viewOffset.x, viewOffset.y)
    ctx.scale(zoom, zoom)

    if (selectionRect) {
      ctx.save()
      ctx.beginPath()
      ctx.rect(
        selectionRect.x - EDGE_BLEND_WIDTH,
        selectionRect.y - EDGE_BLEND_WIDTH,
        selectionRect.width + EDGE_BLEND_WIDTH * 2,
        selectionRect.height + EDGE_BLEND_WIDTH * 2
      )
      ctx.clip()
    }

    if (stroke.tool === 'airbrush' && stroke.particles) {
      const now = Date.now()
      stroke.particles.forEach(p => {
        const age = now - p.createdAt
        if (age < 500) {
          const fadeAlpha = p.opacity * (1 - age / 500)
          ctx.save()
          ctx.globalAlpha = fadeAlpha
          ctx.fillStyle = stroke.color
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
          ctx.fill()
          ctx.restore()
        }
      })
    } else {
      for (let i = 1; i < pointsToDraw; i++) {
        let blendAlpha = 1

        if (selectionRect) {
          const point = stroke.points[i]
          const nearLeft = point.x - selectionRect.x < EDGE_BLEND_WIDTH
          const nearRight = (selectionRect.x + selectionRect.width) - point.x < EDGE_BLEND_WIDTH
          const nearTop = point.y - selectionRect.y < EDGE_BLEND_WIDTH
          const nearBottom = (selectionRect.y + selectionRect.height) - point.y < EDGE_BLEND_WIDTH

          if (nearLeft || nearRight || nearTop || nearBottom) {
            let minDist = EDGE_BLEND_WIDTH
            if (nearLeft) minDist = Math.min(minDist, point.x - selectionRect.x)
            if (nearRight) minDist = Math.min(minDist, (selectionRect.x + selectionRect.width) - point.x)
            if (nearTop) minDist = Math.min(minDist, point.y - selectionRect.y)
            if (nearBottom) minDist = Math.min(minDist, (selectionRect.y + selectionRect.height) - point.y)
            blendAlpha = Math.max(0, minDist / EDGE_BLEND_WIDTH)
          }
        }

        if (animProgress < 1) {
          const strokeProgress = i / totalPoints
          const fadeIn = Math.min(1, (animProgress - strokeProgress + 0.3) / 0.3)
          blendAlpha *= Math.max(0, fadeIn)
        }

        drawStrokeSegment(ctx, stroke, stroke.points[i - 1], stroke.points[i], blendAlpha)
      }
    }

    if (selectionRect) {
      ctx.restore()
    }
    ctx.restore()
  }, [viewOffset, zoom, drawStrokeSegment])

  const render = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1

    if (canvas.width !== rect.width * dpr || canvas.height !== rect.height * dpr) {
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
    }

    ctx.save()
    ctx.scale(dpr, dpr)

    drawGrid(ctx, rect.width, rect.height)

    const visibleLayers = layers.filter(l => l.visible)
    visibleLayers.forEach(layer => {
      layer.strokeIds.forEach(strokeId => {
        const stroke = strokes[strokeId]
        if (stroke) {
          drawStroke(ctx, stroke, 1)
        }
      })
    })

    if (currentStroke) {
      drawStroke(ctx, currentStroke, 1)
    }

    if (aiCompleting.active) {
      const selRect = {
        x: Math.min(selection.startX, selection.endX),
        y: Math.min(selection.startY, selection.endY),
        width: Math.abs(selection.endX - selection.startX),
        height: Math.abs(selection.endY - selection.startY)
      }

      for (let i = 0; i < aiCompleting.currentIndex; i++) {
        if (aiCompleting.strokes[i]) {
          drawStroke(ctx, aiCompleting.strokes[i], 1, selRect)
        }
      }

      if (aiCompleting.strokes[aiCompleting.currentIndex]) {
        const elapsed = (Date.now() - aiCompleting.startTime) / 1000
        const progress = Math.min(1, elapsed * 0.5)
        drawStroke(ctx, aiCompleting.strokes[aiCompleting.currentIndex], progress, selRect)
      }
    }

    if (selection.active) {
      ctx.save()
      const x1 = selection.startX * zoom + viewOffset.x
      const y1 = selection.startY * zoom + viewOffset.y
      const x2 = selection.endX * zoom + viewOffset.x
      const y2 = selection.endY * zoom + viewOffset.y

      const sx = Math.min(x1, x2)
      const sy = Math.min(y1, y2)
      const sw = Math.abs(x2 - x1)
      const sh = Math.abs(y2 - y1)

      ctx.strokeStyle = '#3b82f688'
      ctx.lineWidth = 2
      ctx.setLineDash([6, 4])
      ctx.strokeRect(sx, sy, sw, sh)
      ctx.setLineDash([])
      ctx.fillStyle = 'rgba(59, 130, 246, 0.05)'
      ctx.fillRect(sx, sy, sw, sh)
      ctx.restore()
    }

    ctx.restore()
  }, [drawGrid, drawStroke, layers, strokes, currentStroke, aiCompleting, selection, viewOffset, zoom])

  useEffect(() => {
    let running = true

    const loop = () => {
      if (!running) return
      render()
      animationFrameRef.current = requestAnimationFrame(loop)
    }

    animationFrameRef.current = requestAnimationFrame(loop)

    return () => {
      running = false
      cancelAnimationFrame(animationFrameRef.current)
    }
  }, [render])

  useEffect(() => {
    if (!aiCompleting.active) return

    const interval = setInterval(() => {
      const { aiCompleting: ac, updateAICompletion, finishAICompletion } = useCanvasStore.getState()
      if (!ac.active) return

      const elapsed = Date.now() - ac.startTime
      if (elapsed >= 2000) {
        if (ac.currentIndex < ac.strokes.length - 1) {
          updateAICompletion(ac.currentIndex + 1)
          useCanvasStore.setState({
            aiCompleting: { ...ac, currentIndex: ac.currentIndex + 1, startTime: Date.now() }
          })
        } else {
          finishAICompletion()
          clearSelection()
        }
      }
    }, 50)

    return () => clearInterval(interval)
  }, [aiCompleting.active, updateAICompletion, finishAICompletion, clearSelection])

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.setPointerCapture(e.pointerId)
    const rect = canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const world = screenToWorld(screenX, screenY)

    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanningRef.current = true
      panStartRef.current = {
        x: screenX,
        y: screenY,
        offsetX: viewOffset.x,
        offsetY: viewOffset.y
      }
      return
    }

    lastPosRef.current = { x: world.x, y: world.y }

    if (tool === 'select') {
      startSelection(world.x, world.y)
    } else {
      startDrawing(world.x, world.y)
    }
  }, [tool, viewOffset, screenToWorld, startSelection, startDrawing])

  const handlePointerMove = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const world = screenToWorld(screenX, screenY)

    setMousePos(Math.round(world.x), Math.round(world.y))

    if (isPanningRef.current && panStartRef.current) {
      const dx = screenX - panStartRef.current.x
      const dy = screenY - panStartRef.current.y
      setViewOffset(panStartRef.current.offsetX + dx, panStartRef.current.offsetY + dy)
      return
    }

    if (!e.buttons) return

    if (tool === 'select') {
      updateSelection(world.x, world.y)
    } else if (isDrawing) {
      continueDrawing(world.x, world.y)
    }

    lastPosRef.current = { x: world.x, y: world.y }
  }, [tool, isDrawing, screenToWorld, setMousePos, updateSelection, continueDrawing, setViewOffset])

  const handlePointerUp = useCallback((e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (canvas && canvas.hasPointerCapture(e