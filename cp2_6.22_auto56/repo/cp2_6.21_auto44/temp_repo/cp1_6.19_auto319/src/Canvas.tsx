import { useState, useRef, useEffect, useCallback } from 'react'
import { useWhiteboardStore } from './store'
import type { Shape, Point, RectShape, CircleShape, LineShape, ArrowShape, TextShape } from './types'
import {
  isPointInShape,
  getLinePath,
  getArrowPoints,
  normalizeRect,
} from './utils'

const DEFAULT_STROKE = '#4A90D9'
const DEFAULT_FILL = 'rgba(74, 144, 217, 0.2)'
const SELECTED_STROKE = '#FF6B35'
const TEXT_COLOR = '#ffffff'

interface DrawingState {
  isDrawing: boolean
  startPoint: Point | null
  currentPoint: Point | null
}

interface MovingState {
  isMoving: boolean
  shapeId: string | null
  lastPoint: Point | null
}

const Canvas = () => {
  const svgRef = useRef<SVGSVGElement>(null)
  const textInputRef = useRef<HTMLInputElement>(null)
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
  })
  const [movingState, setMovingState] = useState<MovingState>({
    isMoving: false,
    shapeId: null,
    lastPoint: null,
  })
  const [textInputPos, setTextInputPos] = useState<Point | null>(null)
  const [textValue, setTextValue] = useState('')
  const [showHint, setShowHint] = useState(true)

  const {
    shapes,
    selectedId,
    currentTool,
    selectShape,
    createRect,
    createCircle,
    createLine,
    createArrow,
    createText,
    moveShape,
    pushToHistory,
  } = useWhiteboardStore()

  const getSvgPoint = useCallback((e: React.MouseEvent): Point => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      const point = getSvgPoint(e)

      if (currentTool === 'text') {
        setTextInputPos(point)
        setTextValue('')
        setShowHint(false)
        return
      }

      if (currentTool === 'select') {
        const clickedShape = [...shapes].reverse().find((s) => isPointInShape(point, s))
        if (clickedShape) {
          selectShape(clickedShape.id)
          setMovingState({
            isMoving: true,
            shapeId: clickedShape.id,
            lastPoint: point,
          })
        } else {
          selectShape(null)
        }
        setShowHint(false)
        return
      }

      if (['rect', 'circle', 'line', 'arrow'].includes(currentTool)) {
        setDrawingState({
          isDrawing: true,
          startPoint: point,
          currentPoint: point,
        })
        setShowHint(false)
      }
    },
    [currentTool, shapes, selectShape, getSvgPoint]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const point = getSvgPoint(e)

      if (drawingState.isDrawing) {
        setDrawingState((prev) => ({
          ...prev,
          currentPoint: point,
        }))
      }

      if (movingState.isMoving && movingState.shapeId && movingState.lastPoint) {
        const dx = point.x - movingState.lastPoint.x
        const dy = point.y - movingState.lastPoint.y
        moveShape(movingState.shapeId, dx, dy)
        setMovingState((prev) => ({
          ...prev,
          lastPoint: point,
        }))
      }
    },
    [drawingState.isDrawing, movingState, moveShape, getSvgPoint]
  )

  const handleMouseUp = useCallback(() => {
    if (drawingState.isDrawing && drawingState.startPoint && drawingState.currentPoint) {
      const start = drawingState.startPoint
      const end = drawingState.currentPoint

      switch (currentTool) {
        case 'rect':
          createRect(start, end)
          break
        case 'circle':
          createCircle(start, end)
          break
        case 'line':
          createLine(start, end)
          break
        case 'arrow':
          createArrow(start, end)
          break
      }
    }

    if (movingState.isMoving) {
      pushToHistory()
    }

    setDrawingState({
      isDrawing: false,
      startPoint: null,
      currentPoint: null,
    })
    setMovingState({
      isMoving: false,
      shapeId: null,
      lastPoint: null,
    })
  }, [drawingState, movingState, currentTool, createRect, createCircle, createLine, createArrow, pushToHistory])

  useEffect(() => {
    if (textInputPos && textInputRef.current) {
      textInputRef.current.focus()
    }
  }, [textInputPos])

  const handleTextSubmit = useCallback(() => {
    if (textInputPos) {
      createText(textInputPos, textValue)
      setTextInputPos(null)
      setTextValue('')
    }
  }, [textInputPos, textValue, createText])

  const handleTextKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleTextSubmit()
      } else if (e.key === 'Escape') {
        setTextInputPos(null)
        setTextValue('')
      }
    },
    [handleTextSubmit]
  )

  const renderPreview = () => {
    if (!drawingState.isDrawing || !drawingState.startPoint || !drawingState.currentPoint) {
      return null
    }

    const start = drawingState.startPoint
    const end = drawingState.currentPoint

    switch (currentTool) {
      case 'rect': {
        const rect = normalizeRect(start, end)
        return (
          <rect
          x={rect.x}
          y={rect.y}
          width={rect.width}
          height={rect.height}
          stroke={DEFAULT_STROKE}
          strokeWidth={2}
          fill={DEFAULT_FILL}
          strokeDasharray="5,5"
        />
      )}
      case 'circle': {
        const cx = (start.x + end.x) / 2
        const cy = (start.y + end.y) / 2
        const r = Math.min(Math.abs(end.x - start.x), Math.abs(end.y - start.y)) / 2
        return (
          <circle
          cx={cx}
          cy={cy}
          r={r}
          stroke={DEFAULT_STROKE}
          strokeWidth={2}
          fill={DEFAULT_FILL}
          strokeDasharray="5,5"
        />
      )}
      case 'line': {
        return (
          <path
          d={getLinePath(start, end)}
          stroke={DEFAULT_STROKE}
          strokeWidth={2}
          strokeDasharray="5,5"
          fill="none"
        />
      )}
      case 'arrow': {
        return (
          <g>
            <path
            d={getLinePath(start, end)}
            stroke={DEFAULT_STROKE}
            strokeWidth={2}
            strokeDasharray="5,5"
            fill="none"
          />
          <polygon
          points={getArrowPoints(start, end)}
          fill={DEFAULT_STROKE}
          />
          </g>
        )}
      default:
        return null
    }
  }

  const renderShape = (shape: Shape) => {
    const isSelected = shape.id === selectedId
    const stroke = isSelected ? SELECTED_STROKE : DEFAULT_STROKE
    const strokeWidth = 2

    switch (shape.type) {
      case 'rect': {
        const s = shape as RectShape
        return (
          <g key={shape.id}>
            <rect
            x={s.x}
            y={s.y}
            width={s.width}
            height={s.height}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={DEFAULT_FILL}
            {...(isSelected ? { strokeDasharray: '6,3' } : {})}
            />
          </g>
        )
      }
      case 'circle': {
        const s = shape as CircleShape
        return (
          <g key={shape.id}>
            <circle
            cx={s.cx}
            cy={s.cy}
            r={s.r}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill={DEFAULT_FILL}
            {...(isSelected ? { strokeDasharray: '6,3' } : {})}
            />
          </g>
        )
      }
      case 'line': {
        const s = shape as LineShape
        return (
          <g key={shape.id}>
            <path
            d={getLinePath(s.start, s.end)}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
            {...(isSelected ? { strokeDasharray: '6,3' } : {})}
            />
            <circle cx={s.start.x} cy={s.start.y} r={4} fill={stroke} />
            <circle cx={s.end.x} cy={s.end.y} r={4} fill={stroke} />
          </g>
        )
      }
      case 'arrow': {
        const s = shape as ArrowShape
        return (
          <g key={shape.id}>
            <path
            d={getLinePath(s.start, s.end)}
            stroke={stroke}
            strokeWidth={strokeWidth}
            fill="none"
            {...(isSelected ? { strokeDasharray: '6,3' } : {})}
            />
            <polygon points={getArrowPoints(s.start, s.end)} fill={stroke} />
          </g>
        )
      }
      case 'text': {
        const s = shape as TextShape
        return (
          <g key={shape.id}>
            <text
            x={s.x}
            y={s.y}
            fill={TEXT_COLOR}
            fontSize={14}
            fontFamily="sans-serif"
            style={{ userSelect: 'none' }}
            >
              {s.text}
            </text>
            {isSelected && (
              <rect
              x={s.x - 4}
              y={s.y - 18}
              width={s.text.length * 14 * 0.6 + 8}
              height={22}
              stroke={SELECTED_STROKE}
              strokeWidth={1.5}
              strokeDasharray="4,2"
              fill="none"
              />
            )}
          </g>
        )
      }
      default:
        return null
    }
  }

  return (
    <div
      style={{
        position: 'relative',
        flex: 1,
        height: '100%',
        backgroundColor: '#2d2d2d',
        overflow: 'hidden',
      }}
    >
      <svg
      id="whiteboard-svg"
      ref={svgRef}
      width="100%"
      height="100%"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        display: 'block',
        cursor: currentTool === 'select' ? 'default' : 'crosshair',
      }}
      >
        <defs>
          <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#3a3a3a" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#grid)" />

        {shapes.map((shape) => renderShape(shape))}
        {renderPreview()}

        {showHint && shapes.length === 0 && (
          <text
          x="50%"
          y="50%"
          textAnchor="middle"
          fill="#666"
          fontSize={16}
          style={{ userSelect: 'none', pointerEvents: 'none' }}
          >
            点击工具栏选择图形，在画布上拖拽绘制
          </text>
        )}
      </svg>

      {textInputPos && (
        <input
        ref={textInputRef}
        type="text"
        value={textValue}
        onChange={(e) => setTextValue(e.target.value)}
        onBlur={handleTextSubmit}
        onKeyDown={handleTextKeyDown}
        placeholder="输入文字..."
        style={{
          position: 'absolute',
          left: textInputPos.x,
          top: textInputPos.y - 20,
          background: '#1e1e1e',
          color: '#fff',
          border: `1px solid ${SELECTED_STROKE}`,
          borderRadius: 4,
          padding: '4px 8px',
          fontSize: 14,
          outline: 'none',
          fontFamily: 'sans-serif',
        }}
        />
      )}

      <div
      style={{
        position: 'absolute',
        bottom: 12,
        right: 16,
        color: '#888',
        fontSize: 12,
        fontFamily: 'sans-serif',
        userSelect: 'none',
      }}
      >
        缩放: 100%
      </div>
    </div>
  )
}

export default Canvas
