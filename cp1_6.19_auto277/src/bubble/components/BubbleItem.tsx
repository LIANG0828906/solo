import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, useMotionValue } from 'framer-motion'
import { useBubbleStore } from '@/bubble/store/bubbleStore'
import { useCanvasStore } from '@/canvas/store/canvasStore'
import { useConnectionStore } from '@/connection/store/connectionStore'
import { adjustBrightness } from '@/utils/colorUtils'
import type { Point } from '@/types'

interface BubbleItemProps {
  bubbleId: string
}

const DRAG_EDGE_THRESHOLD = 8

export const BubbleItem: React.FC<BubbleItemProps> = React.memo(({ bubbleId }) => {
  const bubble = useBubbleStore(s => s.bubbles.find(b => b.id === bubbleId))
  const updateBubble = useBubbleStore(s => s.updateBubble)
  const removeBubble = useBubbleStore(s => s.removeBubble)
  const removeConnectionsByBubble = useConnectionStore(s => s.removeConnectionsByBubble)
  const addConnection = useConnectionStore(s => s.addConnection)

  const focusedId = useCanvasStore(s => s.focusedBubbleId)
  const setFocusedBubble = useCanvasStore(s => s.setFocusedBubble)
  const scale = useCanvasStore(s => s.scale)

  const [isEditing, setIsEditing] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [tempLine, setTempLine] = useState<{ endX: number; endY: number } | null>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const connectingFromRef = useRef<string | null>(null)

  const x = useMotionValue<number>(bubble?.x ?? 0)
  const y = useMotionValue<number>(bubble?.y ?? 0)

  useEffect(() => {
    if (bubble) {
      x.set(bubble.x)
      y.set(bubble.y)
    }
  }, [bubble?.id])

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isEditing])

  const isFocused = focusedId === bubbleId

  const handleDelete = useCallback(() => {
    if (isFocused) {
      removeConnectionsByBubble(bubbleId)
      removeBubble(bubbleId)
      setFocusedBubble(null)
    }
  }, [isFocused, bubbleId, removeBubble, removeConnectionsByBubble, setFocusedBubble])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (isEditing) return
        const target = e.target as HTMLElement
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
        handleDelete()
      }
      if (e.key === 'Escape') {
        setIsEditing(false)
        setIsConnecting(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [handleDelete, isEditing])

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setFocusedBubble(bubbleId)
  }

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    setIsEditing(true)
  }

  const handleBlur = () => {
    setIsEditing(false)
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateBubble(bubbleId, { text: e.target.value })
  }

  const handleDragStart = (_: MouseEvent | TouchEvent | PointerEvent, info: { point: Point }) => {
    if (isEditing) return
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect || !bubble) return

    const scaledSize = bubble.size * scale
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dist = Math.sqrt(
      Math.pow(info.point.x - centerX, 2) + Math.pow(info.point.y - centerY, 2)
    )
    const edgeDist = scaledSize / 2 - dist

    if (edgeDist < DRAG_EDGE_THRESHOLD && edgeDist > -20) {
      setIsConnecting(true)
      connectingFromRef.current = bubbleId
      return false
    }
    return
  }

  const handleDrag = (_: MouseEvent | TouchEvent | PointerEvent, info: { point: Point; delta: Point }) => {
    if (isConnecting && bubble) {
      const rect = svgRef.current?.closest('.canvas-container')?.getBoundingClientRect()
      if (!rect) return
      const containerOffsetX = useCanvasStore.getState().offsetX
      const containerOffsetY = useCanvasStore.getState().offsetY
      const currentScale = useCanvasStore.getState().scale
      setTempLine({
        endX: (info.point.x - rect.left - containerOffsetX) / currentScale,
        endY: (info.point.y - rect.top - containerOffsetY) / currentScale
      })
      return false
    }
    if (bubble) {
      const newX = x.get() + info.delta.x / scale
      const newY = y.get() + info.delta.y / scale
      x.set(newX)
      y.set(newY)
      updateBubble(bubbleId, { x: newX, y: newY })
    }
  }

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: { point: Point }) => {
    if (isConnecting && connectingFromRef.current && bubble) {
      const elements = document.elementsFromPoint(info.point.x, info.point.y)
      let targetBubbleId: string | null = null
      for (const el of elements) {
        const bubbleEl = el.closest('[data-bubble-id]') as HTMLElement
        if (bubbleEl && bubbleEl.dataset.bubbleId && bubbleEl.dataset.bubbleId !== connectingFromRef.current) {
          targetBubbleId = bubbleEl.dataset.bubbleId
          break
        }
      }
      if (targetBubbleId) {
        addConnection(connectingFromRef.current, targetBubbleId)
      }
      setIsConnecting(false)
      setTempLine(null)
      connectingFromRef.current = null
      return
    }
  }

  if (!bubble) return null

  const halfSize = bubble.size / 2
  const strokeColor = isFocused ? adjustBrightness(bubble.color, -25) : adjustBrightness(bubble.color, -15)
  const strokeWidth = Math.max(1, 2 / scale)

  return (
    <div
      data-bubble
      data-bubble-id={bubbleId}
      className="bubble-wrapper"
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        width: bubble.size,
        height: bubble.size,
        transform: `translate3d(${x.get() - halfSize}px, ${y.get() - halfSize}px, 0)`,
        willChange: 'transform',
        zIndex: isFocused ? 10 : isConnecting ? 5 : 1
      }}
    >
      {isConnecting && tempLine && (
        <svg
          className="bubble-temp-line"
          style={{
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            zIndex: 100,
            overflow: 'visible'
          }}
        >
          <line
            x1={bubble.x}
            y1={bubble.y}
            x2={tempLine.endX}
            y2={tempLine.endY}
            stroke={bubble.color}
            strokeWidth="2"
            strokeDasharray="6 4"
            opacity="0.7"
          />
        </svg>
      )}

      <motion.svg
        ref={svgRef}
        width={bubble.size}
        height={bubble.size}
        style={{ overflow: 'visible', cursor: isEditing ? 'text' : 'grab' }}
        drag={!isEditing}
        dragMomentum={false}
        dragElastic={0}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        whileHover={{ scale: 1 + 0.02 / scale }}
        whileTap={{ cursor: 'grabbing' }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <defs>
          <radialGradient id={`bubble-grad-${bubbleId}`} cx="35%" cy="35%" r="65%">
            <stop offset="0%" stopColor={adjustBrightness(bubble.color, 25)} />
            <stop offset="100%" stopColor={bubble.color} />
          </radialGradient>
          <filter id={`shadow-${bubbleId}`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy={2 / scale} stdDeviation={3 / scale} floodOpacity="0.3" />
          </filter>
        </defs>
        <circle
          cx={halfSize}
          cy={halfSize}
          r={halfSize - strokeWidth}
          fill={`url(#bubble-grad-${bubbleId})`}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          filter={`url(#shadow-${bubbleId})`}
        />
        {isFocused && (
          <circle
            cx={halfSize}
            cy={halfSize}
            r={halfSize + 3 / scale}
            fill="none"
            stroke="#ffffff"
            strokeWidth={Math.max(1, 2 / scale)}
            strokeDasharray={`${4 / scale} ${4 / scale}`}
            opacity="0.6"
          />
        )}
      </motion.svg>

      <div
        className="bubble-text-container"
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: `${8 / scale}px`,
          pointerEvents: 'none',
          boxSizing: 'border-box'
        }}
      >
        {isEditing ? (
          <textarea
            ref={inputRef}
            value={bubble.text}
            onChange={handleTextChange}
            onBlur={handleBlur}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              height: '70%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              textAlign: 'center',
              fontSize: `${14 / scale}px`,
              lineHeight: 1.3,
              color: '#1a1a2e',
              fontWeight: 500,
              pointerEvents: 'auto',
              fontFamily: 'inherit'
            }}
          />
        ) : (
          <div
            className="bubble-text"
            style={{
              fontSize: `${14 / scale}px`,
              lineHeight: 1.3,
              color: '#1a1a2e',
              fontWeight: 500,
              textAlign: 'center',
              wordBreak: 'break-word',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 4,
              WebkitBoxOrient: 'vertical',
              userSelect: 'none'
            }}
          >
            {bubble.text || <span style={{ opacity: 0.5 }}>双击编辑</span>}
          </div>
        )}
      </div>
    </div>
  )
})

BubbleItem.displayName = 'BubbleItem'
