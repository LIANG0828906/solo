import { useState, useCallback, useRef } from 'react'

const MAX_HISTORY = 50
const DEFAULT_CELL_SIZE = 16

export type PixelGrid = string[][]

function createEmptyGrid(size: number, fill: string = '#ffffff'): PixelGrid {
  return Array.from({ length: size }, () => Array(size).fill(fill))
}

function deepCopy(grid: PixelGrid): PixelGrid {
  return grid.map(row => [...row])
}

export function useCanvasState(gridSize: number) {
  const [pixels, setPixels] = useState<PixelGrid>(() => createEmptyGrid(gridSize))
  const [undoStack, setUndoStack] = useState<PixelGrid[]>([])
  const [redoStack, setRedoStack] = useState<PixelGrid[]>([])
  const [cellSize, setCellSize] = useState(DEFAULT_CELL_SIZE)
  const [zoom, setZoom] = useState(1.0)
  const [pixelCount, setPixelCount] = useState(0)

  const pixelsRef = useRef(pixels)
  pixelsRef.current = pixels

  const saveSnapshot = useCallback(() => {
    const snapshot = deepCopy(pixelsRef.current)
    setUndoStack(prev => {
      const next = [...prev, snapshot]
      return next.length > MAX_HISTORY ? next.slice(next.length - MAX_HISTORY) : next
    })
    setRedoStack([])
  }, [])

  const drawPixels = useCallback(
    (positions: { row: number; col: number }[], color: string, isErasing: boolean = false) => {
      let countDelta = 0
      setPixels(prev => {
        const next = deepCopy(prev)
        for (const { row, col } of positions) {
          if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
            const oldColor = next[row][col]
            const newColor = color
            if (oldColor !== newColor) {
              if (isErasing && oldColor !== '#ffffff') {
                countDelta--
              } else if (!isErasing && oldColor === '#ffffff' && newColor !== '#ffffff') {
                countDelta++
              }
              next[row][col] = newColor
            }
          }
        }
        return next
      })
      if (countDelta !== 0) {
        setPixelCount(prev => Math.max(0, prev + countDelta))
      }
    },
    [gridSize]
  )

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const snapshot = deepCopy(pixelsRef.current)
      setRedoStack(r => [...r, snapshot])
      const last = prev[prev.length - 1]
      setPixels(deepCopy(last))
      let count = 0
      for (const row of last) {
        for (const cell of row) {
          if (cell !== '#ffffff') count++
        }
      }
      setPixelCount(count)
      return prev.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev
      const snapshot = deepCopy(pixelsRef.current)
      setUndoStack(u => [...u, snapshot])
      const last = prev[prev.length - 1]
      setPixels(deepCopy(last))
      let count = 0
      for (const row of last) {
        for (const cell of row) {
          if (cell !== '#ffffff') count++
        }
      }
      setPixelCount(count)
      return prev.slice(0, -1)
    })
  }, [])

  const clearCanvas = useCallback(() => {
    saveSnapshot()
    setPixels(createEmptyGrid(gridSize))
    setPixelCount(0)
  }, [gridSize, saveSnapshot])

  const resetHistory = useCallback(() => {
    setUndoStack([])
    setRedoStack([])
    setPixels(createEmptyGrid(gridSize))
    setPixelCount(0)
  }, [gridSize])

  const resetPixelCount = useCallback(() => {
    setPixelCount(0)
  }, [])

  const updateCellSize = useCallback((size: number) => {
    const clamped = Math.max(8, Math.min(24, size))
    setCellSize(clamped)
  }, [])

  const updateZoom = useCallback((newZoom: number) => {
    const clamped = Math.max(0.5, Math.min(3, newZoom))
    setZoom(clamped)
  }, [])

  return {
    pixels,
    cellSize,
    zoom,
    pixelCount,
    saveSnapshot,
    drawPixels,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    clearCanvas,
    resetHistory,
    resetPixelCount,
    updateCellSize,
    updateZoom,
  }
}
