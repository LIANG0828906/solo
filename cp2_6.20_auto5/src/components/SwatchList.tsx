import React, { useRef, useState } from 'react'
import type { ColorData } from '../types'

interface SwatchListProps {
  colors: ColorData[]
  onReorder: (colors: ColorData[]) => void
  onDelete: (id: string) => void
}

const SwatchList: React.FC<SwatchListProps> = ({ colors, onReorder, onDelete }) => {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const dragIndex = useRef<number>(-1)

  const handleDragStart = (e: React.DragEvent, color: ColorData, index: number) => {
    setDraggedId(color.id)
    dragIndex.current = index
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent, colorId: string) => {
    e.preventDefault()
    setDragOverId(colorId)
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()
    if (dragIndex.current === dropIndex) {
      setDraggedId(null)
      setDragOverId(null)
      return
    }

    const newColors = [...colors]
    const [draggedColor] = newColors.splice(dragIndex.current, 1)
    newColors.splice(dropIndex, 0, draggedColor)
    onReorder(newColors)

    setDraggedId(null)
    setDragOverId(null)
    dragIndex.current = -1
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
    dragIndex.current = -1
  }

  return (
    <div className="glass swatch-section">
      <h3>当前调色板 ({colors.length}/5)</h3>
      <div className="swatch-list">
        {colors.map((color, index) => (
          <div
            key={color.id}
            draggable
            onDragStart={(e) => handleDragStart(e, color, index)}
            onDragOver={(e) => handleDragOver(e, color.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, index)}
            onDragEnd={handleDragEnd}
            className={`swatch-item ${draggedId === color.id ? 'dragging' : ''} ${
              dragOverId === color.id ? 'drag-over' : ''
            }`}
            style={{ backgroundColor: color.hex }}
            title={`${color.hex} - ${color.hsl.h}°, ${color.hsl.s}%, ${color.hsl.l}%`}
          >
            <button
              className="swatch-delete"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(color.id)
              }}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

export default SwatchList
