import { useRef, useState, useEffect, useCallback } from 'react'
import { useEditorStore } from '../store/editorStore'
import type { CanvasElement, TextElement, DrawingElement } from '../store/editorStore'
import './EditorArea.css'

interface DragState {
  isDragging: boolean
  elementId: string | null
  startX: number
  startY: number
  elementStartX: number
  elementStartY: number
}

interface DrawState {
  isDrawing: boolean
  currentPoints: { x: number; y: number }[]
  drawingId: string | null
}

const GRID_SIZE = 20
const CANVAS_WIDTH = 600
const CANVAS_HEIGHT = 800

function snapToGrid(value: number): number {
  return Math.round(value / GRID_SIZE) * GRID_SIZE
}

function EditorArea() {
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    elementId: null,
    startX: 0,
    startY: 0,
    elementStartX: 0,
    elementStartY: 0,
  })
  const [drawState, setDrawState] = useState<DrawState>({
    isDrawing: false,
    currentPoints: [],
    drawingId: null,
  })
  const [isEditingText, setIsEditingText] = useState<string | null>(null)
  const [hoveredGridLines, setHoveredGridLines] = useState<{ x: number; y: number } | null>(null)

  const elements = useEditorStore((s) => s.elements)
  const selectedId = useEditorStore((s) => s.selectedId)
  const background = useEditorStore((s) => s.background)
  const canvasSize = useEditorStore((s) => s.canvasSize)
  const activeTool = useEditorStore((s) => s.activeTool)
  const selectElement = useEditorStore((s) => s.selectElement)
  const updateElement = useEditorStore((s) => s.updateElement)
  const addElement = useEditorStore((s) => s.addElement)
  const setIsDragging = useEditorStore((s) => s.setIsDragging)
  const pushHistory = useEditorStore((s) => s.pushHistory)

  const getCanvasCoords = useCallback((clientX: number, clientY: number) => {
    if (!canvasContainerRef.current) return { x: 0, y: 0 }
    const rect = canvasContainerRef.current.getBoundingClientRect()
    const scaleX = CANVAS_WIDTH / rect.width
    const scaleY = CANVAS_HEIGHT / rect.height
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    }
  }, [])

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, element: CanvasElement) => {
      e.stopPropagation()
      if (isEditingText) return

      if (activeTool === 'draw-brush' || activeTool === 'draw-rect' || activeTool === 'draw-circle') {
        const { x, y } = getCanvasCoords(e.clientX, e.clientY)
        const newId = addElement({
          type: 'drawing',
          x: Math.max(0, x - 100),
          y: Math.max(0, y - 100),
          width: 200,
          height: 200,
          fill: 'transparent',
          stroke: '#6c5ce7',
          strokeWidth: 3,
          points: activeTool === 'draw-brush' ? [{ x, y }] : [],
        } as Partial<DrawingElement> & { type: 'drawing' })
        setDrawState({
          isDrawing: true,
          currentPoints: activeTool === 'draw-brush' ? [{ x, y }] : [{ x, y }],
          drawingId: newId,
        })
        return
      }

      selectElement(element.id)
      const { x, y } = getCanvasCoords(e.clientX, e.clientY)
      setDragState({
        isDragging: true,
        elementId: element.id,
        startX: x,
        startY: y,
        elementStartX: element.x,
        elementStartY: element.y,
      })
      setIsDragging(true)
    },
    [activeTool, addElement, getCanvasCoords, isEditingText, selectElement, setIsDragging]
  )

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      const { x, y } = getCanvasCoords(e.clientX, e.clientY)

      if (drawState.isDrawing && drawState.drawingId) {
        const newPoints = [...drawState.currentPoints, { x, y }]
        setDrawState((prev) => ({ ...prev, currentPoints: newPoints }))
        const minX = Math.min(...newPoints.map((p) => p.x))
        const minY = Math.min(...newPoints.map((p) => p.y))
        const maxX = Math.max(...newPoints.map((p) => p.x))
        const maxY = Math.max(...newPoints.map((p) => p.y))
        const localPoints = newPoints.map((p) => ({ x: p.x - minX, y: p.y - minY }))
        updateElement(drawState.drawingId, {
          x: minX,
          y: minY,
          width: Math.max(maxX - minX, 10),
          height: Math.max(maxY - minY, 10),
          points: localPoints,
        } as Partial<DrawingElement>)
        return
      }

      if (dragState.isDragging && dragState.elementId) {
        const dx = x - dragState.startX
        const dy = y - dragState.startY
        let newX = dragState.elementStartX + dx
        let newY = dragState.elementStartY + dy

        const el = elements.find((e) => e.id === dragState.elementId)
        if (el) {
          newX = Math.max(0, Math.min(canvasSize.width - el.width, newX))
          newY = Math.max(0, Math.min(canvasSize.height - el.height, newY))
        }

        const nearestGridX = snapToGrid(newX)
        const nearestGridY = snapToGrid(newY)
        setHoveredGridLines({ x: nearestGridX, y: nearestGridY })

        updateElement(dragState.elementId, { x: newX, y: newY })
      }
    },
    [dragState, drawState, elements, getCanvasCoords, updateElement, canvasSize]
  )

  const handleMouseUp = useCallback(() => {
    if (drawState.isDrawing) {
      setDrawState({ isDrawing: false, currentPoints: [], drawingId: null })
      pushHistory()
    }

    if (dragState.isDragging && dragState.elementId) {
      const el = elements.find((e) => e.id === dragState.elementId)
      if (el) {
        const snappedX = snapToGrid(el.x)
        const snappedY = snapToGrid(el.y)
        updateElement(dragState.elementId, { x: snappedX, y: snappedY })
      }
      pushHistory()
    }

    setDragState({
      isDragging: false,
      elementId: null,
      startX: 0,
      startY: 0,
      elementStartX: 0,
      elementStartY: 0,
    })
    setHoveredGridLines(null)
    setIsDragging(false)
  }, [dragState, drawState, elements, pushHistory, setIsDragging, updateElement])

  useEffect(() => {
    if (dragState.isDragging || drawState.isDrawing) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [dragState.isDragging, drawState.isDrawing, handleMouseMove, handleMouseUp])

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('canvas-card')) {
      selectElement(null)
      setIsEditingText(null)
    }
  }

  const handleTextDoubleClick = (elementId: string) => {
    setIsEditingText(elementId)
  }

  const handleTextBlur = (elementId: string, content: string) => {
    updateElement(elementId, { content } as Partial<TextElement>)
    setIsEditingText(null)
    pushHistory()
  }

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex)

  const renderGridLines = () => {
    const lines = []
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      const isActive = hoveredGridLines && Math.abs(i - hoveredGridLines.x) < GRID_SIZE
      lines.push(
        <div
          key={`v-${i}`}
          className={`grid-line grid-line-v ${isActive ? 'grid-line-active' : ''}`}
          style={{
            left: `${(i / CANVAS_WIDTH) * 100}%`,
            backgroundColor: isActive ? 'var(--brand-color)' : 'var(--grid-color)',
            width: isActive ? '2px' : '1px',
            boxShadow: isActive ? '0 0 6px rgba(108, 92, 231, 0.6)' : 'none',
            transition: 'background-color 0.3s ease, width 0.3s ease, box-shadow 0.3s ease',
          }}
        />
      )
    }
    for (let j = 0; j <= CANVAS_HEIGHT; j += GRID_SIZE) {
      const isActive = hoveredGridLines && Math.abs(j - hoveredGridLines.y) < GRID_SIZE
      lines.push(
        <div
          key={`h-${j}`}
          className={`grid-line grid-line-h ${isActive ? 'grid-line-active' : ''}`}
          style={{
            top: `${(j / CANVAS_HEIGHT) * 100}%`,
            backgroundColor: isActive ? 'var(--brand-color)' : 'var(--grid-color)',
            height: isActive ? '2px' : '1px',
            boxShadow: isActive ? '0 0 6px rgba(108, 92, 231, 0.6)' : 'none',
            transition: 'background-color 0.3s ease, height 0.3s ease, box-shadow 0.3s ease',
          }}
        />
      )
    }
    return lines
  }

  const renderElement = (element: CanvasElement) => {
    const isSelected = selectedId === element.id
    const isDraggingThis = dragState.isDragging && dragState.elementId === element.id

    const baseStyle: React.CSSProperties = {
      position: 'absolute',
      left: `${(element.x / CANVAS_WIDTH) * 100}%`,
      top: `${(element.y / CANVAS_HEIGHT) * 100}%`,
      width: `${(element.width / CANVAS_WIDTH) * 100}%`,
      height: `${(element.height / CANVAS_HEIGHT) * 100}%`,
      transform: `rotate(${element.rotation}deg)`,
      zIndex: element.zIndex,
      opacity: isDraggingThis ? 0.6 : element.opacity,
      cursor: activeTool?.startsWith('draw') ? 'crosshair' : 'move',
      transition: isDraggingThis ? 'none' : 'opacity 250ms ease-out',
      willChange: 'transform, left, top',
    }

    if (element.type === 'text') {
      const el = element as TextElement
      return (
        <div
          key={element.id}
          className={`canvas-element text-element ${isSelected ? 'selected' : ''}`}
          style={baseStyle}
          onMouseDown={(e) => handleMouseDown(e, element)}
          onDoubleClick={() => handleTextDoubleClick(element.id)}
        >
          {isEditingText === element.id ? (
            <textarea
              className="text-editor"
              defaultValue={el.content}
              autoFocus
              onBlur={(e) => handleTextBlur(element.id, e.target.value)}
              style={{
                fontFamily: el.fontFamily,
                fontSize: `${(el.fontSize / CANVAS_HEIGHT) * 100 * 8}vh`,
                lineHeight: el.lineHeight,
                textAlign: el.textAlign,
                color: el.color,
                WebkitTextStroke: el.strokeWidth > 0 ? `${el.strokeWidth}px ${el.strokeColor}` : 'none',
              }}
            />
          ) : (
            <div
              className="text-content"
              style={{
                fontFamily: el.fontFamily,
                fontSize: `${(el.fontSize / CANVAS_HEIGHT) * 100 * 8}vh`,
                lineHeight: el.lineHeight,
                textAlign: el.textAlign,
                color: el.color,
                WebkitTextStroke: el.strokeWidth > 0 ? `${el.strokeWidth}px ${el.strokeColor}` : 'none',
              }}
            >
              {el.content.split('\n').map((line, i) => (
                <div key={i}>{line || '\u00A0'}</div>
              ))}
            </div>
          )}
        </div>
      )
    }

    if (element.type === 'sticker') {
      return (
        <div
          key={element.id}
          className={`canvas-element sticker-element ${isSelected ? 'selected' : ''}`}
          style={baseStyle}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          <img
            src={(element as { src: string }).src}
            alt="sticker"
            style={{ width: '100%', height: '100%', objectFit: 'contain', pointerEvents: 'none' }}
            draggable={false}
          />
        </div>
      )
    }

    if (element.type === 'drawing') {
      const el = element as DrawingElement
      const svgWidth = element.width
      const svgHeight = element.height
      const pathD = el.points.length > 1
        ? `M ${el.points[0].x} ${el.points[0].y} ` + el.points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(' ')
        : ''

      return (
        <div
          key={element.id}
          className={`canvas-element drawing-element ${isSelected ? 'selected' : ''}`}
          style={baseStyle}
          onMouseDown={(e) => handleMouseDown(e, element)}
        >
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            preserveAspectRatio="none"
            style={{ pointerEvents: 'none' }}
          >
            <path
              d={pathD}
              stroke={el.stroke}
              strokeWidth={el.strokeWidth}
              fill={el.fill}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
      )
    }

    return null
  }

  return (
    <div className="editor-area" onClick={handleCanvasClick}>
      <div className="canvas-wrapper" ref={canvasContainerRef}>
        <div
          className="canvas-card"
          style={{ backgroundColor: background, aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
        >
          <div className="grid-overlay">{renderGridLines()}</div>
          {sortedElements.map(renderElement)}
        </div>
      </div>
    </div>
  )
}

export default EditorArea
