import React, { memo } from 'react'
import { Menu, Download, Sliders } from 'lucide-react'
import { useLayoutStore } from './store'
import { ControlPanel } from './components/ControlPanel'
import { PreviewArea } from './components/PreviewArea'
import { ExportModal } from './components/ExportModal'

const TopNavBar = memo(function TopNavBar() {
  const toggleMobilePanel = useLayoutStore((s) => s.toggleMobilePanel)
  return (
    <header className="top-navbar">
      <button
        type="button"
        className="menu-toggle-btn"
        onClick={toggleMobilePanel}
        title="打开控制面板"
      >
        <Menu size={18} />
      </button>
      <div className="top-navbar-title">
        <Sliders size={16} color="#3B82F6" />
        <span>响应式布局实验室</span>
      </div>
      <span style={{ width: 32 }} />
    </header>
  )
})

const ExportButton = memo(function ExportButton() {
  const openExport = useLayoutStore((s) => s.openExportModal)
  return (
    <button type="button" className="export-btn" onClick={openExport}>
      <Download size={14} />
      <span>导出 CSS</span>
    </button>
  )
})

function App() {
  const mobileOpen = useLayoutStore((s) => s.mobilePanelOpen)
  const setMobilePanelOpen = useLayoutStore((s) => s.setMobilePanelOpen)

  return (
    <div className="app-root">
      <ControlPanel />
      {mobileOpen && (
        <div className="overlay-panel" onClick={() => setMobilePanelOpen(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '100%', height: '100%' }}>
            <ControlPanel />
          </div>
        </div>
      )}

      <div className="main-area">
        <TopNavBar />
        <ExportButton />
        <PreviewArea />
      </div>

      <ExportModal />
    </div>
  )
}

export default App
