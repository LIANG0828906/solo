import { useEffect, useState, useRef } from 'react'
import { Menu, Save, Download, RotateCcw, PenTool } from 'lucide-react'
import { useAppStore } from './store/appStore'
import ControlPanel from './components/ControlPanel'
import PreviewCanvas from './components/PreviewCanvas'
import ExportModal from './components/ExportModal'

export default function App() {
  const { resetEditor, saveCurrentStyle, uiState, setUIState } = useAppStore()
  const [isMobile, setIsMobile] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [saveStyleName, setSaveStyleName] = useState('')

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      if (window.innerWidth >= 768) {
        setUIState({ panelOpen: true })
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [setUIState])

  const handleSave = () => {
    setShowSaveDialog(true)
  }

  const confirmSave = () => {
    if (saveStyleName.trim()) {
      saveCurrentStyle(saveStyleName.trim())
      setSaveStyleName('')
      setShowSaveDialog(false)
    }
  }

  const handleExport = () => {
    setUIState({ exportModalOpen: true })
  }

  const handleReset = () => {
    resetEditor()
  }

  return (
    <div className="app-container">
      <header className="app-header">
        <div className="header-left">
          {isMobile && (
            <button
              className="menu-toggle"
              onClick={() => setUIState({ panelOpen: !uiState.panelOpen })}
            >
              <Menu size={20} />
            </button>
          )}
          <div className="app-title">
            <PenTool size={24} className="title-icon" />
            <h1>手写体风格模拟器</h1>
          </div>
        </div>
        <div className="header-actions">
          <button className="header-btn" onClick={handleSave}>
            <Save size={18} />
            <span>保存风格</span>
          </button>
          <button className="header-btn primary" onClick={handleExport}>
            <Download size={18} />
            <span>导出图片</span>
          </button>
          <button className="header-btn" onClick={handleReset}>
            <RotateCcw size={18} />
            <span>重置编辑</span>
          </button>
        </div>
      </header>

      <div className="app-main">
        {!isMobile && (
          <ControlPanel />
        )}
        {isMobile && uiState.panelOpen && (
          <>
            <div className="mobile-overlay" onClick={() => setUIState({ panelOpen: false })} />
            <ControlPanel isMobile onClose={() => setUIState({ panelOpen: false })} />
          </>
        )}
        <main className="canvas-area">
          <PreviewCanvas />
        </main>
      </div>

      {showSaveDialog && (
        <div className="modal-overlay" onClick={() => setShowSaveDialog(false)}>
          <div className="save-dialog" onClick={(e) => e.stopPropagation()}>
            <h3>保存当前风格</h3>
            <input
              type="text"
              placeholder="输入风格名称..."
              value={saveStyleName}
              onChange={(e) => setSaveStyleName(e.target.value)}
              className="save-input"
              autoFocus
            />
            <div className="dialog-actions">
              <button className="dialog-btn" onClick={() => setShowSaveDialog(false)}>
                取消
              </button>
              <button className="dialog-btn primary" onClick={confirmSave}>
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}

      {uiState.exportModalOpen && (
        <ExportModal
          onClose={() => setUIState({ exportModalOpen: false })}
          leftCanvas={document.querySelector('.left-canvas') as HTMLCanvasElement}
        />
      )}
    </div>
  )
}
