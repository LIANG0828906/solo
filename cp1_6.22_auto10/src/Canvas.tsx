import { useRef, useState, useCallback, useEffect } from 'react'
import type { Shape, User, Tool } from './types'

interface CanvasProps {
  shapes: Shape[]
  selectedId: string | null
  tool: Tool
  onSelect: (id: string | null) => void
  onAddShape: (shape: Shape) => void
  onUpdateShape: (id: string, updates: Partial<Shape>, fromRemote?: boolean, recordHistory?: boolean) => void
  onCursorMove: (x: number, y: number) => void
  users: User[]
  isClearing: boolean
  createNewShape: (type: Tool, x: number, y: number) => Shape | null
}

type InteractionMode = null | 'drag' | 'resize-tl' | 'resize-tr' | 'resize-bl' | 'resize-br' | 'rotate' | 'draw'

interface InteractionState {
  mode: InteractionMode
  startX: number
  startY: number
  originalShape?: Shape
  drawingShape?: Shape | null
}

const getShapeBounds = (shape: Shape) => {
  switch (shape.type) {
    case 'circle':
      const r = shape.radius || 50
      return { x: shape.x - r, y: shape.y - r, width: r * 2, height: r * 2 }
    case 'rect':
    case 'triangle':
      return { x: shape.x, y: shape.y, width: shape.width || 100, height: shape.height || 80 }
    case 'line':
      return { x: shape.x, y: shape.y, width: shape.width || 100, height: 4 }
    case 'path':
      const pts = (shape.points || '').split(' ').map(p => p.split(',').map(Number))
      if (pts.length === 0) return { x: shape.x, y: shape.y, width: 0, height: 0 }
      const xs = pts.map(p => p[0])
      const ys = pts.map(p => p[1])
      return {
        x: Math.min(...xs),
        y: Math.min(...ys),
        width: Math.max(...xs) - Math.min(...xs),
        height: Math.max(...ys) - Math.min(...ys)
      }
    default:
      return { x: shape.x, y: shape.y, width: 100, height: 80 }
  }
}

const renderShape = (shape: Shape) => {
  const commonProps = {
    fill: shape.fill,
    stroke: shape.stroke,
    strokeWidth: shape.strokeWidth,
    style: { transition: 'opacity 300ms ease-out' } as React.CSSProperties,
  }
  const transform = shape.rotation ? `rotate(${shape.rotation} ${shape.x} ${shape.y})` : undefined

  switch (shape.type) {
    case 'circle':
      return <circle cx={shape.x} cy={shape.y} r={shape.radius || 50} transform={transform} {...commonProps} />
    case 'rect':
      return <rect x={shape.x} y={shape.y} width={shape.width || 100} height={shape.height || 80} transform={transform} {...commonProps} />
    case 'triangle': {
      const w = shape.width || 100
      const h = shape.height || 80
      const pts = `${shape.x + w / 2},${shape.y} ${shape.x},${shape.y + h} ${shape.x + w},${shape.y + h}`
      return <polygon points={pts} transform={transform} {...commonProps} />
    }
    case 'line': {
      const w = shape.width || 100
      return <line x1={shape.x} y1={shape.y} x2={shape.x + w} y2={shape.y} transform={transform} {...commonProps} />
    }
    case 'path': {
      const pts = shape.points || ''
      const coords = pts.split(' ').filter(Boolean).map(p => p.split(',').map(Number))
      if (coords.length < 2) return null
      const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c[0]} ${c[1]}`).join(' ')
      return <path d={d} transform={transform} fill="none" stroke={shape.stroke} strokeWidth={shape.strokeWidth} strokeLinecap="round" strokeLinejoin="round" style={{ transition: 'opacity 300ms ease-out' }} />
    }
    default:
      return null
  }
}

export default function Canvas({
  shapes,
  selectedId,
  tool,
  onSelect,
  onAddShape,
  onUpdateShape,
  onCursorMove,
  users,
  isClearing,
  createNewShape,
}: CanvasProps) {
  const svgRef = useRef<SVGSVGElement>(null)
  const [interaction, setInteraction] = useState<InteractionState>({ mode: null, startX: 0, startY: 0 })
  const lastCursorSend = useRef<number>(0)
  const [drawingPreview, setDrawingPreview] = useState<Shape | null>(null)

  const getSvgCoords = useCallback((e: React.MouseEvent | MouseEvent) => {
    const svg = svgRef.current
    if (!svg) return { x: 0, y: 0 }
    const rect = svg.getBoundingClientRect()
    return {
      x: ((e.clientX - rect.left) / rect.width) * svg.clientWidth,
      y: ((e.clientY - rect.top) / rect.height) * svg.clientHeight,
    }
  }, [])

  const selectedShape = shapes.find(s => s.id === selectedId)
  const bounds = selectedShape ? getShapeBounds(selectedShape) : null

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    const { x, y } = getSvgCoords(e)

    const target = e.target as SVGElement
    const handle = target.getAttribute('data-handle')

    if (handle && selectedId) {
      const shape = shapes.find(s => s.id === selectedId)
      if (!shape) return
      setInteraction({
        mode: handle as InteractionMode,
        startX: x,
        startY: y,
        originalShape: { ...shape },
      })
      return
    }

    if (tool === 'select') {
      const shapeEl = target.closest('[data-shape-id]')
      if (shapeEl) {
        const id = shapeEl.getAttribute('data-shape-id')
        onSelect(id)
        if (id) {
          const shape = shapes.find(s => s.id === id)
          if (shape) {
            setInteraction({
              mode: 'drag',
              startX: x,
              startY: y,
              originalShape: { ...shape },
            })
          }
        }
      } else {
        onSelect(null)
      }
    } else {
      const newShape = createNewShape(tool, x, y)
      if (newShape) {
        if (tool === 'path') {
          setDrawingPreview(newShape)
          setInteraction({
            mode: 'draw',
            startX: x,
            startY: y,
            drawingShape: newShape,
          })
        } else {
          setDrawingPreview(newShape)
          setInteraction({
            mode: 'draw',
            startX: x,
            startY: y,
            drawingShape: newShape,
          })
        }
      }
    }
  }, [tool, selectedId, shapes, onSelect, getSvgCoords, createNewShape])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const { x, y } = getSvgCoords(e)

    const now = Date.now()
    if (now - lastCursorSend.current > 50) {
      onCursorMove(x, y)
      lastCursorSend.current = now
    }

    if (!interaction.mode) return

    if (interaction.mode === 'drag' && interaction.originalShape && selectedId) {
      const dx = x - interaction.startX
      const dy = y - interaction.startY
      const orig = interaction.originalShape

      if (orig.type === 'path' && orig.points) {
        const coords = orig.points.split(' ').map(p => p.split(',').map(Number))
        const newPoints = coords.map(([px, py]) => `${px + dx},${py + dy}`).join(' ')
        onUpdateShape(selectedId, { x: orig.x + dx, y: orig.y + dy, points: newPoints }, false, false)
      } else {
        onUpdateShape(selectedId, { x: orig.x + dx, y: orig.y + dy }, false, false)
      }
      return
    }

    if (interaction.mode === 'rotate' && interaction.originalShape && selectedId) {
      const orig = interaction.originalShape
      const cx = orig.x + (orig.type === 'circle' ? 0 : (orig.width || 100) / 2)
      const cy = orig.y + (orig.type === 'circle' ? 0 : (orig.height || 80) / 2)
      const angle = Math.atan2(y - cy, x - cx) * 180 / Math.PI
      let finalAngle = angle + 90
      if (e.shiftKey) {
        finalAngle = Math.round(finalAngle / 15) * 15
      }
      onUpdateShape(selectedId, { rotation: finalAngle }, false, false)
      return
    }

    if (interaction.mode.startsWith('resize') && interaction.originalShape && selectedId) {
      const orig = interaction.originalShape
      const dx = x - interaction.startX
      const dy = y - interaction.startY
      const updates: Partial<Shape> = {}

      if (orig.type === 'circle') {
        const dist = Math.sqrt(dx * dx + dy * dy)
        const sign = interaction.mode === 'resize-br' || interaction.mode === 'resize-tr' ? 1 : -1
        updates.radius = Math.max(10, (orig.radius || 50) + sign * dist * 0.5)
      } else if (orig.type === 'path') {
        const scaleX = 1 + dx / 100
        const scaleY = 1 + dy / 100
        if (orig.points) {
          const coords = orig.points.split(' ').map(p => p.split(',').map(Number))
          const cx = orig.x
          const cy = orig.y
          const newPoints = coords.map(([px, py]) => `${cx + (px - cx) * scaleX},${cy + (py - cy) * scaleY}`).join(' ')
          updates.points = newPoints
        }
      } else {
        let newWidth = orig.width || 100
        let newHeight = orig.height || 80
        let newX = orig.x
        let newY = orig.y

        if (interaction.mode.includes('r')) newWidth = Math.max(20, newWidth + dx)
        if (interaction.mode.includes('l')) { newWidth = Math.max(20, newWidth - dx); newX = orig.x + dx }
        if (interaction.mode.includes('b')) newHeight = Math.max(20, newHeight + dy)
        if (interaction.mode.includes('t')) { newHeight = Math.max(20, newHeight - dy); newY = orig.y + dy }

        updates.x = newX
        updates.y = newY
        updates.width = newWidth
        updates.height = newHeight
      }
      onUpdateShape(selectedId, updates, false, false)
      return
    }

    if (interaction.mode === 'draw' && interaction.drawingShape) {
      const orig = interaction.drawingShape
      const dx = x - interaction.startX
      const dy = y - interaction.startY

      if (orig.type === 'path') {
        const newPoints = orig.points + ` ${x},${y}`
        const updated = { ...orig, points: newPoints }
        setDrawingPreview(updated)
        setInteraction({ ...interaction, drawingShape: updated })
      } else if (orig.type === 'circle') {
        const r = Math.max(10, Math.sqrt(dx * dx + dy * dy))
        setDrawingPreview({ ...orig, radius: r })
      } else if (orig.type === 'line') {
        const angle = Math.atan2(dy, dx)
        const len = Math.sqrt(dx * dx + dy * dy)
        const cx = orig.x
        const cy = orig.y
        const rotation = e.shiftKey ? Math.round(angle * 180 / Math.PI / 15) * 15 : angle * 180 / Math.PI
        setDrawingPreview({ ...orig, x: cx, y: cy, width: len, rotation })
      } else {
        const absDx = Math.abs(dx)
        const absDy = Math.abs(dy)
        const nx = dx >= 0 ? orig.x : interaction.startX - absDx
        const ny = dy >= 0 ? orig.y : interaction.startY - absDy
        setDrawingPreview({ ...orig, x: nx, y: ny, width: Math.max(20, absDx), height: Math.max(20, absDy) })
      }
    }
  }, [interaction, selectedId, onUpdateShape, getSvgCoords, onCursorMove])

  const handleMouseUp = useCallback(() => {
    if (interaction.mode === 'draw' && (drawingPreview || interaction.drawingShape)) {
      const shape = drawingPreview || interaction.drawingShape
      if (shape) {
        let finalShape = { ...shape }
        if (shape.type === 'path' && shape.points) {
          const coords = shape.points.split(' ').filter(Boolean).map(p => p.split(',').map(Number))
          if (coords.length >= 2) {
            const xs = coords.map(c => c[0])
            const ys = coords.map(c => c[1])
            finalShape = { ...shape, x: Math.min(...xs), y: Math.min(...ys) }
          }
        }
        onAddShape(finalShape)
      }
      setDrawingPreview(null)
    }
    setInteraction({ mode: null, startX: 0, startY: 0 })
  }, [interaction, drawingPreview, onAddShape])

  useEffect(() => {
    const handleGlobalUp = () => {
      if (interaction.mode === 'draw' && (drawingPreview || interaction.drawingShape)) {
        const shape = drawingPreview || interaction.drawingShape
        if (shape) {
          onAddShape(shape)
        }
        setDrawingPreview(null)
      }
      if (interaction.mode) {
        setInteraction({ mode: null, startX: 0, startY: 0 })
      }
    }
    window.addEventListener('mouseup', handleGlobalUp)
    return () => window.removeEventListener('mouseup', handleGlobalUp)
  }, [interaction, drawingPreview, onAddShape])

  return (
    <div className="canvas-container">
      <svg
        ref={svgRef}
        className={`canvas-svg ${tool === 'select' ? 'select-mode' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
      >
        <g>
          {shapes.map(shape => (
            <g
              key={shape.id}
              data-shape-id={shape.id}
              style={{ cursor: tool === 'select' ? 'move' : 'crosshair' }}
              className={isClearing ? 'fade-out-shape' : ''}
            >
              {renderShape(shape)}
            </g>
          ))}
        </g>

        {drawingPreview && (
          <g style={{ opacity: 0.6, pointerEvents: 'none' }}>
            {renderShape(drawingPreview)}
          </g>
        )}

        {selectedShape && bounds && tool === 'select' && (
          <g style={{ pointerEvents: 'none' }}>
            <rect
              x={bounds.x - 4}
              y={bounds.y - 4}
              width={bounds.width + 8}
              height={bounds.height + 8}
              fill="none"
              stroke="#3b82f6"
              strokeWidth={2}
              strokeDasharray="6 4"
              style={{ pointerEvents: 'none' }}
            />

            <g style={{ pointerEvents: 'auto' }}>
              {[
                { pos: 'tl', cx: bounds.x - 4, cy: bounds.y - 4, shape: 'circle' },
                { pos: 'tr', cx: bounds.x + bounds.width + 4, cy: bounds.y - 4, shape: 'circle' },
                { pos: 'bl', cx: bounds.x - 4, cy: bounds.y + bounds.height + 4, shape: 'circle' },
                { pos: 'br', cx: bounds.x + bounds.width + 4, cy: bounds.y + bounds.height + 4, shape: 'circle' },
              ].map(h => (
                h.shape === 'circle' ? (
                  <circle
                    key={h.pos}
                    cx={h.cx}
                    cy={h.cy}
                    r={6}
                    fill="white"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    data-handle={`resize-${h.pos}`}
                    style={{ cursor: `${h.pos}-resize` }}
                  />
                ) : (
                  <rect
                    key={h.pos}
                    x={h.cx - 5}
                    y={h.cy - 5}
                    width={10}
                    height={10}
                    fill="white"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    data-handle={`resize-${h.pos}`}
                    style={{ cursor: `${h.pos}-resize` }}
                  />
                )
              ))}

              <circle
                cx={bounds.x + bounds.width / 2}
                cy={bounds.y - 30}
                r={8}
                fill="white"
                stroke="#3b82f6"
                strokeWidth={2}
                data-handle="rotate"
                style={{ cursor: 'grab' }}
              />
              <line
                x1={bounds.x + bounds.width / 2}
                y1={bounds.y - 4}
                x2={bounds.x + bounds.width / 2}
                y2={bounds.y - 22}
                stroke="#3b82f6"
                strokeWidth={1.5}
                strokeDasharray="3 2"
              />
            </g>
          </g>
        )}
      </svg>

      {users.map(u => u.cursor && (
        <div
          key={u.id}
          className="cursor-label"
          style={{
            left: u.cursor.x,
            top: u.cursor.y,
          }}
        >
          <div className="cursor-dot" style={{ background: u.color }} />
          <div className="cursor-name" style={{ background: u.color }}>
            {u.username}
          </div>
        </div>
      ))}
    </div>
  )
}
