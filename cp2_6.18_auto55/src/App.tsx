import React, { useState, useEffect, useCallback } from 'react'
import { Download, Plus } from 'lucide-react'
import Editor from '@/components/Editor'
import Preview from '@/components/Preview'
import Sidebar from '@/components/Sidebar'
import { useDocumentStore } from '@/store/documentStore'
import { exportAsHtml } from '@/utils/exportHtml'
import { ToastProvider, useToast } from '@/components/ToastContext'
import ConfirmDialog from '@/components/ConfirmDialog'

const AppContent: React.FC = () => {
  const { title, content, activeDocId, createDoc } = useDocumentStore()
  const { showToast } = useToast()
  const [isMobile, setIsMobile] = useState<boolean>(() => window.innerWidth < 768)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const sanitizeFilename = (name: string): string => {
    return name.replace(/[\\/:*?"<>|]/g, '_').trim() || '未命名文档'
  }

  const handleExport = useCallback(() => {
    if (!activeDocId) {
      showToast('请先选择或创建一个文档', 'error')
      return
    }

    try {
      const trimmedContent = content.replace(/<[^>]+>/g, '').trim()
      if (!trimmedContent) {
        showToast('文档内容为空，无法导出', 'error')
        return
      }

      const safeTitle = sanitizeFilename(title)
      exportAsHtml(safeTitle, content)
      showToast('导出成功', 'success')
    } catch (err) {
      console.error('Export failed:', err)
      showToast('导出失败，请稍后重试', 'error')
    }
  }, [activeDocId, content, title, showToast])

  const handleCreateNew = useCallback(() => {
    setNewDocTitle('')
    setShowCreateDialog(true)
  }, [])

  const confirmCreateDoc = useCallback(() => {
    const trimmed = newDocTitle.trim()
    if (trimmed) {
      createDoc(trimmed)
      setShowCreateDialog(false)
      showToast('文档创建成功', 'success')
    } else {
      showToast('请输入文档标题', 'error')
    }
  }, [newDocTitle, createDoc, showToast])

  const editorWidth = isMobile ? 'w-full' : 'md:w-[55%]'
  const previewWidth = isMobile ? 'w-full' : 'md:w-[45%]'

  return (
    <div className="h-screen flex flex-col bg-white">
      <header className="flex items-center justify-between px-6 py-3 border-b border-gray-200 bg-white shrink-0">
        <div className="flex-1" />
        <h1
          className="flex-1 text-center font-bold tracking-tight"
          style={{ color: '#1F2937', fontSize: 24 }}
        >
          QuickDoc
        </h1>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors duration-200 text-sm font-medium"
            style={{ backgroundColor: '#3B82F6' }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#2563EB')}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#3B82F6')}
          >
            <Plus size={16} />
            新建文档
          </button>
          <button
            onClick={handleExport}
            disabled={!activeDocId}
            className="flex items-center gap-2 px-4 py-2 text-white rounded-lg transition-colors duration-200 text-sm font-medium disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#10B981' }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) e.currentTarget.style.backgroundColor = '#059669'
            }}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = '#10B981')}
          >
            <Download size={16} />
            导出HTML
          </button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden flex-col md:flex-row">
        <Sidebar />

        <main className={`flex-1 flex flex-col ${isMobile ? 'flex-col' : 'md:flex-row'} gap-3 p-3 min-w-0 overflow-hidden`}>
          <div className={`w-full ${editorWidth} flex flex-col min-h-0`} style={{ minHeight: isMobile ? 300 : undefined }}>
            <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">编辑</div>
            <Editor />
          </div>
          <div className={`w-full ${previewWidth} flex flex-col min-h-0`} style={{ minHeight: isMobile ? 300 : undefined }}>
            <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">预览</div>
            <Preview />
          </div>
        </main>
      </div>

      <ConfirmDialog
        isOpen={showCreateDialog}
        title="新建文档"
        message="请输入文档标题："
        confirmText="创建"
        cancelText="取消"
        showInput
        inputPlaceholder="输入文档标题..."
        inputValue={newDocTitle}
        onInputChange={setNewDocTitle}
        onConfirm={confirmCreateDoc}
        onCancel={() => setShowCreateDialog(false)}
      />
    </div>
  )
}

const App: React.FC = () => (
  <ToastProvider>
    <AppContent />
  </ToastProvider>
)

export default App
