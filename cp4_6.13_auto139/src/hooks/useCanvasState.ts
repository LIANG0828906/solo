import { useState, useCallback, useRef } from 'react'

const MAX_HISTORY = 50

function createEmptyGrid(size: number): string[][] {
  return Array.from({ length: size }, () => Array(size).fill('#ffffff'))
}

function deepCopy(grid: string[][]): string[][] {
  return grid.map(row => [...row])
}

export function useCanvasState(gridSize: number) {
  const [pixels, setPixels] = useState<string[][]>(() => createEmptyGrid(gridSize))
  const [undoStack, setUndoStack] = useState<string[][][]>([])
  const [redoStack, setRedoStack] = useState<string[][][]>([])
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

  const drawPixels = useCallback((positions: { row: number; col: number }[], color: string) => {
    setPixels(prev => {
      const next = deepCopy(prev)
      for (const { row, col } of positions) {
        if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
          next[row][col] = color
        }
      }
      return next
    })
  }, [gridSize])

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev
      const snapshot = deepCopy(pixelsRef.current)
      setRedoStack(r => [...r, snapshot])
      const last = prev[prev.length - 1]
      setPixels(deepCopy(last))
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
      return prev.slice(0, -1)
    })
  }, [])

  const clearCanvas = useCallback(() => {
    saveSnapshot()
    setPixels(createEmptyGrid(gridSize))
  }, [gridSize, saveSnapshot])

  const resetHistory = useCallback(() => {
    setUndoStack([])
    setRedoStack([])
    setPixels(createEmptyGrid(gridSize))
  }, [gridSize])

  return {
    pixels,
    saveSnapshot,
    drawPixels,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    clearCanvas,
    resetHistory,
  }
}
