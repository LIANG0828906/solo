import React, { useState, useEffect } from 'react'
import { useStore } from '../store/useStore'

interface CursorProps {
  containerRef: React.RefObject<HTMLDivElement>
}

const BrushCursor: React.FC<CursorProps> = ({ containerRef }) => {
  const [position, setPosition] = useState({ x: -100, y: -100 })
  const [isDragging, setIsDragging] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const brushSize = useStore((state) => state.brushSettings.size)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      setPosition({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
      setIsVisible(true)
    }

    const handleMouseDown = () => {
      setIsDragging(true)
    }

    const handleMouseUp = () => {
      setIsDragging(false)
    }

    const handleMouseLeave = () => {
      setIsVisible(false)
      setIsDragging(false)
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mousedown', handleMouseDown)
    container.addEventListener('mouseup', handleMouseUp)
    container.addEventListener('mouseleave', handleMouseLeave)

    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mousedown', handleMouseDown)
      container.removeEventListener('mouseup', handleMouseUp)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [containerRef])

  if (!isVisible) return null

  const cursorSize = brushSize * 30

  return (
    <div
      style={{
        position: 'absolute',
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -50%)',
        pointerEvents: 'none',
        zIndex: 100,
        width: cursorSize,
        height: cursorSize
      }}
    >
      <svg
        width={cursorSize}
        height={cursorSize}
        viewBox={`0 0 ${cursorSize} ${cursorSize}`}
        style={{ display: 'block' }}
      >
        <circle
          cx={cursorSize / 2}
          cy={cursorSize / 2}
          r={cursorSize / 2 - 1}
          fill="none"
          stroke="rgba(255, 255, 255, 0.53)"
          strokeWidth="2"
        />

        {isDragging && (
          <g style={{ transformOrigin: `${cursorSize / 2}px ${cursorSize / 2}px` }}>
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180
              const innerRadius = cursorSize / 4
              const outerRadius = Math.min(cursorSize / 2 - 2, innerRadius + 15)
              const x1 = cursorSize / 2 + Math.cos(angle) * innerRadius
              const y1 = cursorSize / 2 + Math.sin(angle) * innerRadius
              const x2 = cursorSize / 2 + Math.cos(angle) * outerRadius
              const y2 = cursorSize / 2 + Math.sin(angle) * outerRadius

              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  stroke="rgba(255, 255, 255, 0.7)"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              )
            })}
          </g>
        )}
      </svg>
    </div>
  )
}

export default BrushCursor
