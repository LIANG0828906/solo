import { useEffect, useRef, useState, useCallback } from 'react'

interface PixelGridProps {
  pixels: string[][]
  cellSize: number
  zoom: number
  brushSize: number
  currentColor: string
  isErasing: boolean
  onDraw: (positions: { row: number; col: number }[], color: string, isErasing: boolean) => void
  onSaveSnapshot: () => void
  onZoomChange: (zoom: number) => void
  onCellSizeChange: (size: number) => void
  onHover?: (pos: { row: number; col: number } | null) => void
}

export default function PixelGrid({
  pixels,
  cellSize,
  zoom,
  brushSize,
  currentColor,
  isErasing,
  onDraw,
  onSaveSnapshot,
  onZoomChange,
  onCellSizeChange,
  onHover,
}: PixelGridProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const isDrawingRef = useRef(false)
  const lastPositionRef = useRef<{ row: number; col: number } | null>(null)
  const [hoverPos, setHoverPos] = useState<{ row: number; col: number } | null>(null)
  const gridSize = pixels.length

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const scaledCellSize = cellSize * zoom
    const totalSize = gridSize * scaledCellSize
    canvas.width = totalSize
    canvas.height = totalSize

    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const x = col * scaledCellSize
        const y = row * scaledCellSize
        ctx.fillStyle = pixels[row][col]
        ctx.fillRect(x, y, scaledCellSize, scaledCellSize)
      }
    }

    ctx.strokeStyle = '#444444'
    ctx.lineWidth = 1
    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath()
      ctx.moveTo(i * scaledCellSize, 0)
      ctx.lineTo(i * scaledCellSize, totalSize)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * scaledCellSize)
      ctx.lineTo(totalSize, i * scaledCellSize)
      ctx.stroke()
    }
  }, [pixels, cellSize, zoom, gridSize])

  useEffect(() => {
    drawCanvas()
  }, [drawCanvas])

  const getGridPosition = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      const canvas = canvasRef.current
      if (!canvas) return null
      const rect = canvas.getBoundingClientRect()
      const scaledCellSize = cellSize * zoom
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      const col = Math.floor(x / scaledCellSize)
      const row = Math.floor(y / scaledCellSize)
      if (row < 0 || row >= gridSize || col < 0 || col >= gridSize) return null
      return { row, col }
    },
    [cellSize, zoom, gridSize]
  )

  const getBrushPositions = useCallback(
    (centerRow: number, centerCol: number) => {
      const positions: { row: number; col: number }[] = []
      const half = Math.floor(brushSize / 2)
      for (let dr = -half; dr <= half; dr++) {
        for (let dc = -half; dc <= half; dc++) {
          positions.push({ row: centerRow + dr, col: centerCol + dc })
        }
      }
      return positions
    },
    [brushSize]
  )

  const handleDraw = useCallback(
    (pos: { row: number; col: number }, snapshotOnFirst: boolean = false) => {
      const positions = getBrushPositions(pos.row, pos.col)
      const color = isErasing ? '#ffffff' : currentColor
      onDraw(positions, color, isErasing)
      if (snapshotOnFirst) {
        onSaveSnapshot()
      }
    },
    [getBrushPositions, isErasing, currentColor, onDraw, onSaveSnapshot]
  )

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      e.preventDefault()
      const pos = getGridPosition(e)
      if (!pos) return
      isDrawingRef.current = true
      lastPositionRef.current = pos
      handleDraw(pos, true)
    },
    [getGridPosition, handleDraw]
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      const pos = getGridPosition(e)
      setHoverPos(pos)
      if (onHover) onHover(pos)
      if (!isDrawingRef.current || !pos) return
      const last = lastPositionRef.current
      if (!last) {
        handleDraw(pos)
        lastPositionRef.current = pos
        return
      }
      if (last.row === pos.row && last.col === pos.col) return
      const dx = pos.col - last.col
      const dy = pos.row - last.row
      const steps = Math.max(Math.abs(dx), Math.abs(dy))
      if (steps > 1) {
        for (let i = 1; i < steps; i++) {
          const t = i / steps
          const interpRow = Math.round(last.row + dy * t)
          const interpCol = Math.round(last.col + dx * t)
          handleDraw({ row: interpRow, col: interpCol })
        }
      }
      handleDraw(pos)
      lastPositionRef.current = pos
    },
    [getGridPosition, handleDraw]
  )

  const handleMouseUp = useCallback(() => {
    isDrawingRef.current = false
    lastPositionRef.current = null
  }, [])

  const handleMouseLeave = useCallback(() => {
    setHoverPos(null)
    if (onHover) onHover(null)
    isDrawingRef.current = false
    lastPositionRef.current = null
  }, [onHover])

  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      onZoomChange(zoom + delta)
    },
    [zoom, onZoomChange]
  )

  const scaledCellSize = cellSize * zoom
  const totalSize = gridSize * scaledCellSize

  const cursorSize = brushSize * scaledCellSize
  const cursorStyle = hoverPos
    ? {
        left: hoverPos.col * scaledCellSize + scaledCellSize / 2 - cursorSize / 2,
        top: hoverPos.row * scaledCellSize + scaledCellSize / 2 - cursorSize / 2,
        width: cursorSize,
        height: cursorSize,
        display: 'block' as const,
      }
    : { display: 'none' as const }

  return (
    <div
      className="canvas-wrapper"
      ref={wrapperRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseLeave}
      onWheel={handleWheel}
      style={{ width: totalSize, height: totalSize }}
    >
      <canvas ref={canvasRef} width={totalSize} height={totalSize} />
      <div
        className="pixel-cursor"
        style={{
          position: 'absolute',
          borderRadius: '50%',
          backgroundColor: isErasing ? 'rgba(255, 255, 255, 0.5)' : currentColor + '80',
          pointerEvents: 'none',
          transition: 'left 0.05s ease, top 0.05s ease',
          ...cursorStyle,
        }}
      />
    </div>
  )
}
