import React, { useRef, useEffect, useCallback } from 'react'
import { useCanvasStore } from '@/canvas/store/canvasStore'
import { useBubbleStore } from '@/bubble/store/bubbleStore'
import { useConnectionStore } from '@/connection/store/connectionStore'
import { BubbleItem } from '@/bubble/components/BubbleItem'
import { ConnectionLine } from '@/connection/components/ConnectionLine'
import type { Point } from '@/types'

interface CanvasRendererProps {
  children?: React.ReactNode
}

export const CanvasRenderer: React.FC<CanvasRendererProps> = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const isPanningRef = useRef(false)
  const lastPosRef = useRef<Point>({ x: 0, y: 0 })
  const scaleRafRef = useRef<number | null>(null)
  const pendingScaleRef = useRef<{ scale: number; center: Point } | null>(null)

  const scale = useCanvasStore(s => s.scale)
  const offsetX = useCanvasStore(s => s.offsetX)
  const offsetY = useCanvasStore(s => s.offsetY)
  const setScale = useCanvasStore(s => s.setScale)
  const adjustOffset = useCanvasStore(s => s.adjustOffset)
  const setFocusedBubble = useCanvasStore(s => s.setFocusedBubble)
  const screenToCanvas = useCanvasStore(s => s.screenToCanvas)

  const bubbles = useBubbleStore(s => s.bubbles)
  const addBubble = useBubbleStore(s => s.addBubble)

  const flushScale = useCallback(() => {
    if (pendingScaleRef.current) {
      const { scale: s, center } = pendingScaleRef.current
      setScale(s, center)
      pendingScaleRef.current = null
    }
    scaleRafRef.current = null
  }, [setScale])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const center: Point = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    }
    const delta = -e.deltaY * 0.0015
    const currentScale = pendingScaleRef.current?.scale ?? scale
    const newScale = currentScale * (1 + delta)

    pendingScaleRef.current = { scale: newScale, center }
    if (scaleRafRef.current === null) {
      scaleRafRef.current = requestAnimationFrame(flushScale)
    }
  }, [scale, flushScale])

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const target = e.target as HTMLElement
    if (target.dataset.bubble || target.closest('[data-bubble]')) return
    if (target.dataset.connection || target.closest('[data-connection]')) return

    isPanningRef.current = true
    lastPosRef.current = { x: e.clientX, y: e.clientY }
    setFocusedBubble(null)
  }, [setFocusedBubble])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isPanningRef.current) return
    const dx = e.clientX - lastPosRef.current.x
    const dy = e.clientY - lastPosRef.current.y
    lastPosRef.current = { x: e.clientX, y: e.clientY }
    adjustOffset(dx, dy)
  }, [adjustOffset])

  const handleMouseUp = useCallback(() => {
    isPanningRef.current = false
  }, [])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement
    if (target.dataset.bubble || target.closest('[data-bubble]')) return
    if (target.dataset.connection || target.closest('[data-connection]')) return

    const rect = containerRef.current?.getBoundingClientRect()
    if (!rect) return
    const screenX = e.clientX - rect.left
    const screenY = e.clientY - rect.top
    const point = screenToCanvas(screenX, screenY)
    addBubble(point.x, point.y)
  }, [addBubble, screenToCanvas])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    container.addEventListener('wheel', handleWheel, { passive: false })
    return () => {
      container.removeEventListener('wheel', handleWheel)
      if (scaleRafRef.current !== null) {
        cancelAnimationFrame(scaleRafRef.current)
      }
    }
  }, [handleWheel])

  const gridSize = 50
  const scaledGridSize = gridSize * scale
  const gridOffsetX = ((offsetX % scaledGridSize) + scaledGridSize) % scaledGridSize
  const gridOffsetY = ((offsetY % scaledGridSize) + scaledGridSize) % scaledGridSize

  return (
    <div
      ref={containerRef}
      className="canvas-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
    >
      <svg
        className="canvas-grid"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(224, 224, 224, 0.15) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(224, 224, 224, 0.15) 1px, transparent 1px)
          `,
          backgroundSize: `${scaledGridSize}px ${scaledGridSize}px`,
          backgroundPosition: `${gridOffsetX}px ${gridOffsetY}px`
        }}
      >
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="currentColor" />
          </marker>
        </defs>
        <g
          className="connections-layer"
          style={{
            transform: `translate(${offsetX}px, ${offsetY}px) scale(${scale})`,
            transformOrigin: '0 0'
          }}
        >
          {useConnectionStore.getState().connections.map(conn => (
            <ConnectionLine key={conn.id} connectionId={conn.id} />
          ))}
        </g>
      </svg>

      <div
        className="bubbles-layer"
        style={{
          transform: `translate3d(${offsetX}px, ${offsetY}px, 0) scale(${scale})`,
          transformOrigin: '0 0',
          willChange: 'transform'
        }}
      >
        {bubbles.map(bubble => (
          <BubbleItem key={bubble.id} bubbleId={bubble.id} />
        ))}
      </div>
    </div>
  )
}
