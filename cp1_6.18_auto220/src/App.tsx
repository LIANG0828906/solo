import React, { useEffect, useRef } from 'react'
import { SceneManager } from './scene/SceneManager'
import { BrushController } from './interaction/BrushController'
import ControlPanel from './ui/ControlPanel'
import BrushCursor from './ui/BrushCursor'
import { useStore } from './store/useStore'
import { colorSchemes } from './store/useStore'

const App: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const brushControllerRef = useRef<BrushController | null>(null)
  const resetTrigger = useStore((state) => state.resetTrigger)
  const brushSettings = useStore((state) => state.brushSettings)

  useEffect(() => {
    if (!containerRef.current) return

    const sceneManager = new SceneManager(containerRef.current)
    sceneManagerRef.current = sceneManager

    const brushController = new BrushController({
      sceneManager,
      container: containerRef.current
    })
    brushControllerRef.current = brushController

    sceneManager.start()

    return () => {
      brushController.dispose()
      sceneManager.dispose()
    }
  }, [])

  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.setBrushColor(brushSettings.color)
      sceneManagerRef.current.setBrushSize(brushSettings.size)
    }
  }, [brushSettings.color, brushSettings.size])

  useEffect(() => {
    if (sceneManagerRef.current && resetTrigger > 0) {
      sceneManagerRef.current.reset()
    }
  }, [resetTrigger])

  return (
    <div
      ref={containerRef}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        overflow: 'hidden',
        background: 'linear-gradient(to top, #0B0E1A, #1A1F33)',
        cursor: 'none'
      }}
    >
      <BrushCursor containerRef={containerRef} />
      <ControlPanel />
    </div>
  )
}

export default App
