import React, { useRef, useEffect, useState, useCallback } from 'react'

export interface HoverCell {
  x: number
  y: number
  color: string
  mouseX: number
  mouseY: number
}

interface CanvasProps {
  gridData: string[][]
  selectedColor: string
  onGridClick: (x: number, y: number, previousColor: string) => void
  onHover: (hover: HoverCell | null) => void
  animatingCell?: { x: number; y: number } | null
}

const GRID_SIZE = 16

const Canvas: React.FC<CanvasProps> = ({ gridData, selectedColor, onGridClick, onHover, animatingCell }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState(600)

  useEffect(() => {
    const updateSize = () => {
      if (window.innerWidth < 768) {
        setCanvasSize(320)
      } else {
        setCanvasSize(600)
      }
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  const cellSize = canvasSize / GRID_SIZE

  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvasSize, canvasSize)

    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvasSize, canvasSize)

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const color = gridData[y]?.[x]
        if (color && color !== '#FFFFFF') {
          ctx.fillStyle = color
          ctx.fillRect(x * cellSize, y * cellSize, cellSize, cellSize)
        }
      }
    }

    ctx.strokeStyle = '#ccc'
    ctx.lineWidth = 1
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cellSize, 0)
      ctx.lineTo(i * cellSize, canvasSize)
      ctx.stroke()

      ctx.beginPath()
      ctx.moveTo(0, i * cellSize)
      ctx.lineTo(canvasSize, i * cellSize)
      ctx.stroke()
    }
  }, [gridData, canvasSize, cellSize])

  useEffect(() => {
    let animationId: number
    const render = () => {
      draw()
      animationId = requestAnimationFrame(render)
    }
    animationId = requestAnimationFrame(render)
    return () => cancelAnimationFrame(animationId)
  }, [draw])

  const getCellFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return null
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.floor(((e.clientX - rect.left) * scaleX) / cellSize)
    const y = Math.floor(((e.clientY - rect.top) * scaleY) / cellSize)
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return null
    return { x, y }
  }

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(e)
    if (!cell) return
    const previousColor = gridData[cell.y]?.[cell.x] || '#FFFFFF'
    onGridClick(cell.x, cell.y, previousColor)
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const cell = getCellFromEvent(e)
    if (!cell) {
      onHover(null)
      return
    }
    const color = gridData[cell.y]?.[cell.x] || '#FFFFFF'
    onHover({
      x: cell.x,
      y: cell.y,
      color,
      mouseX: e.clientX,
      mouseY: e.clientY,
    })
  }

  const handleMouseLeave = () => {
    onHover(null)
  }

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <canvas
        ref={canvasRef}
        width={canvasSize}
        height={canvasSize}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{
          cursor: 'crosshair',
          borderRadius: '8px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
        }}
      />
      {animatingCell && (
        <div
          key={`${animatingCell.x}-${animatingCell.y}-${Date.now()}`}
          style={{
            position: 'absolute',
            left: `calc(50% - ${canvasSize / 2}px + ${animatingCell.x * cellSize}px)`,
            top: `calc(50% - ${canvasSize / 2}px + ${animatingCell.y * cellSize}px)`,
            width: cellSize,
            height: cellSize,
            backgroundColor: gridData[animatingCell.y]?.[animatingCell.x] || '#FFFFFF',
            animation: 'fadeIn 0.2s ease-out',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}

export default Canvas
