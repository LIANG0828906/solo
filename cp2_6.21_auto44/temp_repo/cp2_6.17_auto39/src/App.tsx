import { useEffect, useRef } from 'react'
import { MoleculeScene } from './visualizer/MoleculeScene'
import { MoleculeInfo } from './analyzer/MoleculeInfo'
import { AtomInspector } from './analyzer/AtomInspector'
import { useStore } from './store/useStore'
import './styles/App.css'

export function App() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<MoleculeScene | null>(null)
  const molecule = useStore((state) => state.molecule)
  const setSelectedAtom = useStore((state) => state.setSelectedAtom)
  const setRotationY = useStore((state) => state.setRotationY)
  const setDragging = useStore((state) => state.setDragging)
  const setAutoRotating = useStore((state) => state.setAutoRotating)

  useEffect(() => {
    if (!canvasRef.current) return

    const scene = new MoleculeScene(canvasRef.current)
    sceneRef.current = scene

    scene.setOnAtomClick((atomId) => {
      setSelectedAtom(atomId)
    })

    scene.setOnRotationChange((rotation) => {
      setRotationY(rotation)
    })

    scene.setOnDraggingChange((dragging) => {
      setDragging(dragging)
    })

    scene.setOnAutoRotatingChange((auto) => {
      setAutoRotating(auto)
    })

    scene.loadMolecule(molecule)
    scene.startAnimation()

    return () => {
      scene.dispose()
    }
  }, [])

  useEffect(() => {
    if (sceneRef.current) {
      sceneRef.current.loadMolecule(molecule)
    }
  }, [molecule])

  return (
    <div className="app">
      <div className="app-title">
        <span>Bio</span>Vortex
      </div>

      <div className="left-panel">
        <MoleculeInfo />
      </div>

      <div className="canvas-container" ref={canvasRef} />

      <div className="right-panel">
        <AtomInspector />
      </div>

      <div className="controls-hint">
        <div className="hint-item">
          <span className="hint-key">拖拽</span>
          <span className="hint-text">旋转视角</span>
        </div>
        <div className="hint-item">
          <span className="hint-key">滚轮</span>
          <span className="hint-text">缩放</span>
        </div>
        <div className="hint-item">
          <span className="hint-key">点击</span>
          <span className="hint-text">查看原子</span>
        </div>
      </div>
    </div>
  )
}
