import React, { useEffect, useCallback } from 'react'
import { Toolbar } from './Toolbar'
import { Canvas } from './Canvas'
import { useBoardStore } from './store'

const App: React.FC = () => {
  const undo = useBoardStore(s => s.undo)
  const redo = useBoardStore(s => s.redo)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const mod = e.ctrlKey || e.metaKey

    if (mod && !e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault()
      undo()
    } else if (mod && e.shiftKey && (e.key === 'z' || e.key === 'Z')) {
      e.preventDefault()
      redo()
    } else if (mod && (e.key === 'y' || e.key === 'Y')) {
      e.preventDefault()
      redo()
    }
  }, [undo, redo])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div className="app">
      <Toolbar />
      <Canvas />
    </div>
  )
}

export default App
