import { useState, useEffect } from 'react'
import { Leva } from 'leva'
import { SceneCanvas } from './components/SceneCanvas'
import { ControlPanel } from './components/ControlPanel'
import { ExportModal } from './components/ExportModal'
import { ConfirmDialog } from './components/ConfirmDialog'
import { useSceneStore } from './store/sceneStore'

function App() {
  const {
    geometries,
    lights,
    clearScene,
    showExportModal,
    setShowExportModal,
  } = useSceneStore()

  const [showConfirm, setShowConfirm] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowExportModal(false)
        setShowConfirm(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [setShowExportModal])

  const handleClear = () => {
    if (geometries.length === 0) {
      clearScene()
      return
    }
    setShowConfirm(true)
  }

  return (
    <div className="app-container">
      <header className="top-bar">
        <div className="app-title">
          <span className="title-icon">◆</span>
          <span className="title-text">3D 抽象雕塑编辑器</span>
        </div>
        <div className="top-actions">
          <button
            className="icon-btn"
            onClick={handleClear}
            title="清空场景"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
            <span className="btn-tooltip">清空场景</span>
          </button>
          <button
            className="icon-btn primary"
            onClick={() => setShowExportModal(true)}
            title="导出配置"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            <span className="btn-tooltip">导出配置</span>
          </button>
          {isMobile && (
            <button
              className="icon-btn"
              onClick={() => setPanelCollapsed(!panelCollapsed)}
              title={panelCollapsed ? '展开面板' : '折叠面板'}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {panelCollapsed ? (
                  <>
                    <polyline points="6 9 12 15 18 9" />
                  </>
                ) : (
                  <>
                    <polyline points="18 15 12 9 6 15" />
                  </>
                )}
              </svg>
              <span className="btn-tooltip">
                {panelCollapsed ? '展开面板' : '折叠面板'}
              </span>
            </button>
          )}
        </div>
      </header>

      <div className="main-layout">
        {(!isMobile || !panelCollapsed) && (
          <aside className="sidebar-wrapper">
            <ControlPanel />
            <div className="leva-container">
              <Leva
                oneLineLabels
                flat
                titleBar={false}
                fill={false}
              />
            </div>
          </aside>
        )}
        <main className="canvas-wrapper">
          <SceneCanvas />
        </main>
      </div>

      {showExportModal && (
        <ExportModal
          onClose={() => setShowExportModal(false)}
          geometries={geometries}
          lights={lights}
        />
      )}

      {showConfirm && (
        <ConfirmDialog
          title="清空场景"
          message="确定要清空所有几何体并重置灯光吗？此操作无法撤销。"
          confirmText="确认清空"
          cancelText="取消"
          onConfirm={() => {
            clearScene()
            setShowConfirm(false)
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  )
}

export default App
