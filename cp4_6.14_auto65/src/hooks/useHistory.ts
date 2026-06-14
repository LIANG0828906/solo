import { useState, useCallback, useRef } from 'react'
import type { HistoryAction, Tile, Enemy } from '../types'

const MAX_HISTORY = 50

export interface UseHistoryReturn {
  tiles: Tile[]
  enemies: Enemy[]
  setTiles: (tiles: Tile[]) => void
  setEnemies: (enemies: Enemy[]) => void
  undoStack: HistoryAction[]
  redoStack: HistoryAction[]
  pushAction: (action: HistoryAction) => void
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
  clearHistory: () => void
  setTilesAndEnemies: (tiles: Tile[], enemies: Enemy[]) => void
}

export function useHistory(initialTiles: Tile[] = [], initialEnemies: Enemy[] = []): UseHistoryReturn {
  const [tiles, setTilesState] = useState<Tile[]>(initialTiles)
  const [enemies, setEnemiesState] = useState<Enemy[]>(initialEnemies)
  const [undoStack, setUndoStack] = useState<HistoryAction[]>([])
  const [redoStack, setRedoStack] = useState<HistoryAction[]>([])
  const tilesRef = useRef<Tile[]>(initialTiles)
  const enemiesRef = useRef<Enemy[]>(initialEnemies)

  const setTiles = useCallback((newTiles: Tile[]) => {
    tilesRef.current = newTiles
    setTilesState(newTiles)
  }, [])

  const setEnemies = useCallback((newEnemies: Enemy[]) => {
    enemiesRef.current = newEnemies
    setEnemiesState(newEnemies)
  }, [])

  const setTilesAndEnemies = useCallback((newTiles: Tile[], newEnemies: Enemy[]) => {
    tilesRef.current = newTiles
    enemiesRef.current = newEnemies
    setTilesState(newTiles)
    setEnemiesState(newEnemies)
  }, [])

  const pushAction = useCallback((action: HistoryAction) => {
    setUndoStack(prev => {
      const newStack = [...prev, action]
      if (newStack.length > MAX_HISTORY) {
        return newStack.slice(newStack.length - MAX_HISTORY)
      }
      return newStack
    })
    setRedoStack([])
  }, [])

  const undo = useCallback(() => {
    setUndoStack(prev => {
      if (prev.length === 0) return prev

      const newStack = [...prev]
      const action = newStack.pop()!

      const currentTiles = tilesRef.current
      const currentEnemies = enemiesRef.current

      let newTiles = currentTiles
      let newEnemies = currentEnemies

      switch (action.type) {
        case 'draw_tile': {
          const drawnIds = new Set(action.tiles.map(t => t.id))
          const remainingTiles = currentTiles.filter(t => !drawnIds.has(t.id))
          newTiles = [...remainingTiles, ...action.previousTiles]
          break
        }
        case 'erase_tile': {
          newTiles = [...currentTiles, ...action.erased]
          break
        }
        case 'place_enemy': {
          newEnemies = currentEnemies.filter(e => e.id !== action.enemy.id)
          break
        }
        case 'move_enemy': {
          newEnemies = currentEnemies.map(e =>
            e.id === action.enemyId ? { ...e, x: action.from.x, y: action.from.y } : e
          )
          break
        }
        case 'delete_enemy': {
          newEnemies = [...currentEnemies, action.enemy]
          break
        }
      }

      tilesRef.current = newTiles
      enemiesRef.current = newEnemies
      setTilesState(newTiles)
      setEnemiesState(newEnemies)
      setRedoStack(prevRedo => [...prevRedo, action])

      return newStack
    })
  }, [])

  const redo = useCallback(() => {
    setRedoStack(prev => {
      if (prev.length === 0) return prev

      const newStack = [...prev]
      const action = newStack.pop()!

      const currentTiles = tilesRef.current
      const currentEnemies = enemiesRef.current

      let newTiles = currentTiles
      let newEnemies = currentEnemies

      switch (action.type) {
        case 'draw_tile': {
          const previousIds = new Set(action.previousTiles.map(t => t.id))
          const remainingTiles = currentTiles.filter(t => !previousIds.has(t.id))
          newTiles = [...remainingTiles, ...action.tiles]
          break
        }
        case 'erase_tile': {
          const erasedIds = new Set(action.erased.map(t => t.id))
          newTiles = currentTiles.filter(t => !erasedIds.has(t.id))
          break
        }
        case 'place_enemy': {
          newEnemies = [...currentEnemies, action.enemy]
          break
        }
        case 'move_enemy': {
          newEnemies = currentEnemies.map(e =>
            e.id === action.enemyId ? { ...e, x: action.to.x, y: action.to.y } : e
          )
          break
        }
        case 'delete_enemy': {
          newEnemies = currentEnemies.filter(e => e.id !== action.enemy.id)
          break
        }
      }

      tilesRef.current = newTiles
      enemiesRef.current = newEnemies
      setTilesState(newTiles)
      setEnemiesState(newEnemies)
      setUndoStack(prevUndo => [...prevUndo, action])

      return newStack
    })
  }, [])

  const clearHistory = useCallback(() => {
    setUndoStack([])
    setRedoStack([])
  }, [])

  return {
    tiles,
    enemies,
    setTiles,
    setEnemies,
    setTilesAndEnemies,
    undoStack,
    redoStack,
    pushAction,
    undo,
    redo,
    canUndo: undoStack.length > 0,
    canRedo: redoStack.length > 0,
    clearHistory
  }
}
