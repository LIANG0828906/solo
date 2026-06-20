import React, { useEffect, useRef, useState } from 'react'
import { SceneManager } from './modules/scene/SceneManager'
import UILayer from './modules/ui/UILayer'

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return

    const manager = new SceneManager(containerRef.current)
    sceneManagerRef.current = manager
    setIsReady(true)

    return () => {
      manager.dispose()
      sceneManagerRef.current = null
    }
  }, [])

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
        background: '#120E1E',
      }}
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          inset: 0,
        }}
      />
      {isReady && <UILayer sceneManager={sceneManagerRef.current} />}
    </div>
  )
}

export default App
