import { useRef, useEffect, useState } from 'react'
import { GRID_COLS, GRID_ROWS, TRACKS, TRACK_LABELS, type GridData, type TrackName } from './AudioEngine'

interface BeatGridProps {
  grid: GridData
  currentCol: number
  isPlaying: boolean
  onGridChange: (grid: GridData) => void
}

const CELL_SIZE = 25
const TRACK_LABEL_WIDTH = 72

export default function BeatGrid({ grid, currentCol, isPlaying, onGridChange }: BeatGridProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragValue, setDragValue] = useState(false)
  const [isShiftPressed, setIsShiftPressed] = useState(false)
  const [shiftStart, setShiftStart] = useState<{ row: number; col: number } | null>(null)
  const [shiftEnd, setShiftEnd] = useState<{ row: number; col: number } | null>(null)
  const [cellSize, setCellSize] = useState(CELL_SIZE)

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 800) {
        setCellSize(20)
      } else {
        setCellSize(CELL_SIZE)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') setIsShiftPressed(true)
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false)
        setShiftStart(null)
        setShiftEnd(null)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  const toggleCell = (row: number, col: number, newValue?: boolean) => {
    const newGrid = grid.map(r => [...r])
    const value = newValue !== undefined ? newValue : !newGrid[row][col]
    newGrid[row][col] = value
    onGridChange(newGrid)
    return value
  }

  const handleCellMouseDown = (row: number, col: number, e: React.MouseEvent) => {
    e.preventDefault()
    if (isShiftPressed) {
      if (!shiftStart) {
        setShiftStart({ row, col })
        setShiftEnd({ row, col })
      } else {
        const startR = Math.min(shiftStart.row, row)
        const endR = Math.max(shiftStart.row, row)
        const startC = Math.min(shiftStart.col, col)
        const endC = Math.max(shiftStart.col, col)
        const newGrid = grid.map(r => [...r])
        for (let r = startR; r <= endR; r++) {
          for (let c = startC; c <= endC; c++) {
            newGrid[r][c] = true
          }
        }
        onGridChange(newGrid)
        setShiftStart(null)
        setShiftEnd(null)
      }
      return
    }
    const val = toggleCell(row, col)
    setIsDragging(true)
    setDragValue(val)
  }

  const handleCellMouseEnter = (row: number, col: number) => {
    if (isShiftPressed && shiftStart) {
      setShiftEnd({ row, col })
    }
    if (isDragging) {
      toggleCell(row, col, dragValue)
    }
  }

  useEffect(() => {
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    window.addEventListener('mouseup', handleMouseUp)
    return () => window.removeEventListener('mouseup', handleMouseUp)
  }, [])

  const getIsInShiftSelection = (row: number, col: number): boolean => {
    if (!shiftStart || !shiftEnd) return false
    const startR = Math.min(shiftStart.row, shiftEnd.row)
    const endR = Math.max(shiftStart.row, shiftEnd.row)
    const startC = Math.min(shiftStart.col, shiftEnd.col)
    const endC = Math.max(shiftStart.col, shiftEnd.col)
    return row >= startR && row <= endR && col >= startC && col <= endC
  }

  const gridWidth = GRID_COLS * cellSize
  const gridHeight = GRID_ROWS * cellSize
  const totalWidth = TRACK_LABEL_WIDTH + gridWidth

  return (
    <div className="beat-grid-wrapper" ref={gridRef}>
      <div
        className="beat-grid-container"
        style={{
          width: totalWidth,
        }}
      >
        <div className="beat-grid-track-labels" style={{ width: TRACK_LABEL_WIDTH, height: gridHeight }}>
          {TRACKS.map((track) => (
            <div
              key={track}
              className="track-label"
              style={{ height: cellSize, lineHeight: `${cellSize}px` }}
            >
              {TRACK_LABELS[track as TrackName]}
            </div>
          ))}
        </div>

        <div
          className="beat-grid"
          style={{
            width: gridWidth,
            height: gridHeight,
          }}
        >
          <div className="beat-grid-column-markers">
            {Array.from({ length: GRID_COLS }).map((_, col) => (
              <div
                key={`marker-${col}`}
                className={`column-marker ${col % 4 === 0 ? 'beat-marker' : ''}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                }}
              >
                {col % 4 === 0 ? Math.floor(col / 4) + 1 : ''}
              </div>
            ))}
          </div>

          {grid.map((row, rowIndex) => (
            <div key={rowIndex} className="beat-grid-row">
              {row.map((cell, colIndex) => {
                const isActive = cell
                const isPlayhead = isPlaying && currentCol === colIndex
                const isBeat = colIndex % 4 === 0
                const inShiftSel = getIsInShiftSelection(rowIndex, colIndex)
                return (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`beat-grid-cell ${isActive ? 'active' : ''} ${isBeat ? 'beat-col' : ''} ${inShiftSel ? 'shift-select' : ''}`}
                    style={{
                      width: cellSize,
                      height: cellSize,
                    }}
                    onMouseDown={(e) => handleCellMouseDown(rowIndex, colIndex, e)}
                    onMouseEnter={() => handleCellMouseEnter(rowIndex, colIndex)}
                  >
                    {isPlayhead && <div className="playhead-indicator" style={{ width: cellSize, height: cellSize * GRID_ROWS }} />}
                  </div>
                )
              })}
            </div>
          ))}

          {isPlaying && (
            <div
              className="playhead-bar"
              style={{
                width: cellSize,
                height: gridHeight,
                left: currentCol * cellSize,
              }}
            />
          )}
        </div>
      </div>
    </div>
  )
}
