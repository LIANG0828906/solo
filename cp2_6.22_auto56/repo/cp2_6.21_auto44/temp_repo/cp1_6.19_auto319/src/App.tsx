import { useEffect } from 'react'
import Toolbar from './Toolbar'
import Canvas from './Canvas'
import { useWhiteboardStore } from './store'

function App() {
  const { undo, redo, deleteSelected, selectedId } = useWhiteboardStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedId) {
          e.preventDefault()
          deleteSelected()
        }
      }

      if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      }

      if (e.ctrlKey && e.shiftKey && e.key === 'z') {
        e.preventDefault()
        redo()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo, deleteSelected, selectedId])

  return (
    <div
      style={{
        display: 'flex',
        width: '100%',
        height: '100vh',
        backgroundColor: '#1e1e1e',
      }}
    >
      <Toolbar />
      <Canvas />
    </div>
  )
}

export default App
