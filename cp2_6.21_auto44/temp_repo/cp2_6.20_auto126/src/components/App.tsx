import { useEffect } from 'react'
import SceneCanvas from './SceneCanvas'
import GeometryPanel from './GeometryPanel'
import PropertyPanel from './PropertyPanel'
import { useEditorStore } from '@/store/editorStore'

const App = () => {
  const setTransformMode = useEditorStore((s) => s.setTransformMode)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 't' || e.key === 'T') {
        setTransformMode('translate')
      } else if (e.key === 'r' || e.key === 'R') {
        setTransformMode('rotate')
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setTransformMode])

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
        overflow: 'hidden',
      }}
    >
      <GeometryPanel />
      <SceneCanvas />
      <PropertyPanel />
    </div>
  )
}

export default App
