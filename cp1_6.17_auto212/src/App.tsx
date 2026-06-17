import { useEffect, useRef } from 'react'
import { UIPanel } from './ui/UIPanel'
import { SceneManager } from './scene/SceneManager'

function App() {
  const sceneContainerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)

  useEffect(() => {
    if (sceneContainerRef.current && !sceneManagerRef.current) {
      sceneManagerRef.current = new SceneManager(sceneContainerRef.current)
    }

    return () => {
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose()
        sceneManagerRef.current = null
      }
    }
  }, [])

  return (
    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
      <div
        ref={sceneContainerRef}
        style={{
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0
        }}
      />
      <UIPanel />
    </div>
  )
}

export default App
