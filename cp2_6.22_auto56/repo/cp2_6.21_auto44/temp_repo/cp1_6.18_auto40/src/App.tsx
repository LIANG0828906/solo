import { useEffect, useRef } from 'react'
import { SceneManager } from './scene/SceneManager'
import ControlPanel from './components/ControlPanel'
import { useMoleculeStore } from './store/moleculeStore'

function App() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const { addAtom, selectedAtomType } = useMoleculeStore()

  useEffect(() => {
    if (!containerRef.current) return

    const sceneManager = new SceneManager(containerRef.current)
    sceneManagerRef.current = sceneManager

    return () => {
      sceneManager.dispose()
    }
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (!containerRef.current) return

    const atomType = e.dataTransfer.getData('atomType') as 'carbon' | 'hydrogen' | 'oxygen'
    if (!atomType) return

    const rect = containerRef.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    const worldX = x * 5
    const worldZ = y * 5

    addAtom(atomType, worldX, 0, worldZ)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  return (
    <div style={styles.app}>
      <ControlPanel />
      <div style={styles.mainArea}>
        <div
          ref={containerRef}
          style={styles.canvasContainer}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
        />
        <div style={styles.footerHint}>
          <span style={styles.hintText}>
            💡 点击左侧原子库添加原子 | 拖拽原子移动位置 | 拖拽空白处旋转视角 | 滚轮缩放
          </span>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  app: {
    width: '100%',
    height: '100%',
    position: 'relative',
    background: 'linear-gradient(135deg, #0B0E17 0%, #1A202C 100%)',
    overflow: 'hidden'
  },
  mainArea: {
    width: '80%',
    height: '100%',
    margin: '0 auto',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center'
  },
  canvasContainer: {
    width: '100%',
    height: '90%',
    borderRadius: 16,
    overflow: 'hidden',
    boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    border: '1px solid #2D3748'
  },
  footerHint: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: 'rgba(31, 41, 55, 0.9)',
    padding: '10px 20px',
    borderRadius: 20,
    border: '1px solid #374151',
    backdropFilter: 'blur(8px)'
  },
  hintText: {
    color: '#A0AEC0',
    fontSize: 12
  }
}

export default App
