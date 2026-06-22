import React, { useState, useEffect } from 'react'
import ToolBar from './components/ToolBar'
import EditorCanvas from './components/EditorCanvas'
import LayerPanel from './components/LayerPanel'
import Community from './pages/Community'
import { useEditorStore } from './store/editorStore'
import { exportCanvasAsPNG, downloadImage, saveToCommunity, initSampleData } from './utils/exportImage'
import './styles/app.css'

type PageType = 'editor' | 'community' | 'favorites'

function App() {
  const [currentPage, setCurrentPage] = useState<PageType>('editor')
  const [showExportModal, setShowExportModal] = useState(false)
  const [creatorName, setCreatorName] = useState('匿名创作者')
  const [isExporting, setIsExporting] = useState(false)
  const { layers } = useEditorStore()

  useEffect(() => {
    initSampleData()
  }, [])

  const handleExport = async () => {
    if (layers.length === 0) {
      alert('请先添加一些内容到画布')
      return
    }

    setIsExporting(true)
    try {
      const dataUrl = await exportCanvasAsPNG(layers, 300)
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      downloadImage(dataUrl, `meme_${timestamp}.png`)

      await saveToCommunity(layers, creatorName)

      setShowExportModal(false)
      setCurrentPage('community')
    } catch (error) {
      console.error('导出失败:', error)
      alert('导出失败，请重试')
    } finally {
      setIsExporting(false)
    }
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'community':
        return <Community />
      case 'favorites':
        return <Community showFavoritesOnly />
      default:
        return (
          <div className="editor-layout">
          <ToolBar />
          <EditorCanvas />
          <LayerPanel />
          <button
            className="export-btn neon-button"
            onClick={() => setShowExportModal(true)}
          >
            📤 导出
          </button>
        </div>
        )
    }
  }

  return (
    <div className="app-container">
      <nav className="bottom-nav">
        <button
          className={`nav-item ${currentPage === 'editor' ? 'active' : ''}`}
          onClick={() => setCurrentPage('editor')}
        >
          <span className="nav-icon">🎨</span>
          <span className="nav-label">创作</span>
        </button>
        <button
          className={`nav-item ${currentPage === 'community' ? 'active' : ''}`}
          onClick={() => setCurrentPage('community')}
        >
          <span className="nav-icon">🌐</span>
          <span className="nav-label">社区</span>
        </button>
        <button
          className={`nav-item ${currentPage === 'favorites' ? 'active' : ''}`}
          onClick={() => setCurrentPage('favorites')}
        >
          <span className="nav-icon">❤️</span>
          <span className="nav-label">收藏</span>
        </button>
      </nav>

      <main className="main-content">{renderPage()}</main>

      {showExportModal && (
        <div className="modal-overlay" onClick={() => setShowExportModal(false)}>
          <div className="modal-content glass-panel" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">导出表情包</h2>
            <p className="modal-desc">
              你的表情包将以 300x300 像素 PNG 格式导出，并发布到社区
            </p>

            <div className="form-group">
              <label className="form-label">创作者昵称</label>
              <input
                type="text"
                value={creatorName}
                onChange={(e) => setCreatorName(e.target.value)}
                className="form-input"
                maxLength={20}
                placeholder="输入你的昵称"
              />
            </div>

            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowExportModal(false)}
                disabled={isExporting}
              >
                取消
              </button>
              <button
                className="btn-primary neon-button"
                onClick={handleExport}
                disabled={isExporting}
              >
                {isExporting ? '导出中...' : '确认导出'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
