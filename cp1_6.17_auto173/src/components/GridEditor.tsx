import React, { useState, useCallback, useEffect } from 'react'
import { useChoreographerStore } from '@/Choreographer'
import { BeamType, GRID_COLS, GRID_ROWS } from '@/BeamModel'
import { IBeam } from '@/BeamModel'

interface GridEditorProps {
  onBeamClick: (beam: IBeam) => void
}

const beamPresets: { type: BeamType; label: string; icon: string }[] = [
  { type: 'point', label: '点光', icon: '●' },
  { type: 'spot', label: '聚光', icon: '▲' },
  { type: 'rotating', label: '旋转光', icon: '✺' },
]

const GridEditor: React.FC<GridEditorProps> = ({ onBeamClick }) => {
  const {
    beams,
    addBeam,
    removeBeam,
    selectBeam,
    selectedBeamId,
    errorCell,
    setErrorCell,
  } = useChoreographerStore()

  const [draggedType, setDraggedType] = useState<BeamType | null>(null)
  const [dragOverCell, setDragOverCell] = useState<{ x: number; y: number } | null>(null)

  const handleDragStart = (e: React.DragEvent, type: BeamType) => {
    setDraggedType(type)
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('text/plain', type)
  }

  const handleDragEnd = () => {
    setDraggedType(null)
    setDragOverCell(null)
  }

  const handleDragOver = (e: React.DragEvent, x: number, y: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDragOverCell({ x, y })
  }

  const handleDragLeave = () => {
    setDragOverCell(null)
  }

  const handleDrop = useCallback(
    (e: React.DragEvent, x: number, y: number) => {
      e.preventDefault()
      setDragOverCell(null)

      const type = draggedType || (e.dataTransfer.getData('text/plain') as BeamType)

      if (!type) return

      const existingBeam = beams.find((b) => b.gridX === x && b.gridY === y)

      if (existingBeam) {
        setErrorCell({ x, y })
        setTimeout(() => setErrorCell(null), 500)
        setDraggedType(null)
        return
      }

      const success = addBeam(type, x, y)

      if (!success) {
        setErrorCell({ x, y })
        setTimeout(() => setErrorCell(null), 500)
      }

      setDraggedType(null)
    },
    [draggedType, beams, addBeam, setErrorCell]
  )

  const handleCellClick = (x: number, y: number, e: React.MouseEvent) => {
    e.stopPropagation()
    const beam = beams.find((b) => b.gridX === x && b.gridY === y)
    if (beam) {
      selectBeam(beam.id)
      onBeamClick(beam)
    }
  }

  const handleRemoveBeam = (e: React.MouseEvent, beamId: string) => {
    e.stopPropagation()
    removeBeam(beamId)
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedBeamId && document.activeElement?.tagName !== 'INPUT') {
          removeBeam(selectedBeamId)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [selectedBeamId, removeBeam])

  const getBeamColor = (beam: IBeam) => {
    return `hsl(${beam.hue}, 100%, ${beam.brightness}%)`
  }

  const renderCell = (x: number, y: number) => {
    const beam = beams.find((b) => b.gridX === x && b.gridY === y)
    const isError = errorCell?.x === x && errorCell?.y === y
    const isDragOver = dragOverCell?.x === x && dragOverCell?.y === y
    const isSelected = beam && beam.id === selectedBeamId

    return (
      <div
        key={`${x}-${y}`}
        className={`grid-cell ${isError ? 'error' : ''} ${isDragOver ? 'drag-over' : ''} ${isSelected ? 'selected' : ''}`}
        onDragOver={(e) => handleDragOver(e, x, y)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, x, y)}
        onClick={(e) => handleCellClick(x, y, e)}
      >
        {beam && (
          <div
            className="beam-icon"
            style={{
              color: getBeamColor(beam),
              textShadow: `0 0 10px ${getBeamColor(beam)}`,
              animation: beam.type === 'rotating' ? 'spin 3s linear infinite' : 'none',
            }}
          >
            {beam.type === 'point' && '●'}
            {beam.type === 'spot' && '▲'}
            {beam.type === 'rotating' && '✺'}
            <button
              className="remove-btn"
              onClick={(e) => handleRemoveBeam(e, beam.id)}
              title="删除光束 (Delete)"
            >
              ×
            </button>
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="grid-editor-wrapper">
      <div className="beam-presets">
        <div className="presets-label">拖拽光束到网格：</div>
        <div className="presets-list">
          {beamPresets.map((preset) => (
            <div
              key={preset.type}
              className="beam-preset"
              draggable
              onDragStart={(e) => handleDragStart(e, preset.type)}
              onDragEnd={handleDragEnd}
              title={preset.label}
            >
              <span className="preset-icon">{preset.icon}</span>
              <span className="preset-label">{preset.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="grid-container"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        }}
      >
        {Array.from({ length: GRID_ROWS }).map((_, y) =>
          Array.from({ length: GRID_COLS }).map((_, x) => renderCell(x, y))
        )}
      </div>

      <style>{`
        .grid-editor-wrapper {
          display: flex;
          flex-direction: column;
          gap: 16px;
          width: 100%;
          max-width: 600px;
          margin: 0 auto;
        }

        .beam-presets {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 12px;
          padding: 16px;
          background: rgba(26, 26, 46, 0.6);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .presets-label {
          color: #a0a0c0;
          font-size: 14px;
          white-space: nowrap;
        }

        .presets-list {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .beam-preset {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          padding: 12px 20px;
          background: linear-gradient(135deg, rgba(100, 100, 200, 0.2), rgba(200, 100, 200, 0.2));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 8px;
          cursor: grab;
          transition: all 0.2s ease;
          user-select: none;
        }

        .beam-preset:hover {
          transform: translateY(-2px);
          border-color: rgba(255, 215, 0, 0.5);
          box-shadow: 0 4px 20px rgba(255, 215, 0, 0.2);
        }

        .beam-preset:active {
          cursor: grabbing;
        }

        .preset-icon {
          font-size: 28px;
          color: #ffd700;
          text-shadow: 0 0 10px rgba(255, 215, 0, 0.5);
        }

        .preset-label {
          font-size: 12px;
          color: #c0c0e0;
        }

        .grid-container {
          display: grid;
          gap: 2px;
          padding: 8px;
          background: rgba(10, 14, 39, 0.8);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          aspect-ratio: ${GRID_COLS} / ${GRID_ROWS};
        }

        .grid-cell {
          position: relative;
          background: rgba(26, 26, 46, 0.6);
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          aspect-ratio: 1;
          min-width: 40px;
          min-height: 40px;
        }

        .grid-cell:hover {
          background: rgba(60, 60, 100, 0.6);
        }

        .grid-cell.drag-over {
          background: rgba(255, 215, 0, 0.2);
          border: 1px dashed rgba(255, 215, 0, 0.6);
        }

        .grid-cell.selected {
          box-shadow: inset 0 0 0 2px #ffd700;
        }

        .grid-cell.error {
          animation: shake 0.4s ease;
          background: rgba(255, 50, 50, 0.4) !important;
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-4px); }
          40% { transform: translateX(4px); }
          60% { transform: translateX(-4px); }
          80% { transform: translateX(4px); }
        }

        .beam-icon {
          position: relative;
          font-size: clamp(20px, 5vw, 36px);
          transition: transform 0.2s ease;
        }

        .beam-icon:hover {
          transform: scale(1.1);
        }

        .remove-btn {
          position: absolute;
          top: -8px;
          right: -8px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: rgba(255, 50, 50, 0.9);
          border: none;
          color: white;
          font-size: 14px;
          line-height: 1;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
        }

        .beam-icon:hover .remove-btn {
          opacity: 1;
        }

        .remove-btn:hover {
          background: rgba(255, 80, 80, 1);
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 480px) {
          .beam-presets {
            padding: 12px;
          }

          .presets-label {
            font-size: 12px;
          }

          .beam-preset {
            padding: 8px 12px;
          }

          .preset-icon {
            font-size: 22px;
          }

          .preset-label {
            font-size: 10px;
          }
        }
      `}</style>
    </div>
  )
}

export default GridEditor
