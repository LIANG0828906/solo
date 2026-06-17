import React from 'react'
import { Download, Plus } from 'lucide-react'
import Editor from '@/components/Editor'
import Preview from '@/components/Preview'
import Sidebar from '@/components/Sidebar'
import { useDocumentStore } from '@/store/documentStore'
import { exportAsHtml } from '@/utils/exportHtml'

const App: React.FC = () => {
  const { title, content, activeDocId, createDoc } = useDocumentStore()

  const handleExport = () => {
    if (!activeDocId) return
    exportAsHtml(title || '未命名文档', content)
  }

  const handleCreateNew = () => {
    const docTitle = prompt('请输入文档标题')
    if (docTitle?.trim()) {
      createDoc(docTitle.trim())
    }
  }

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

        <main className="flex-1 flex flex-col md:flex-row gap-3 p-3 min-w-0 overflow-hidden">
          <div className="w-full md:w-[55%] flex flex-col min-h-0 md:min-h-full" style={{ minHeight: 300 }}>
            <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">编辑</div>
            <Editor />
          </div>
          <div className="w-full md:w-[45%] flex flex-col min-h-0 md:min-h-full" style={{ minHeight: 300 }}>
            <div className="text-xs font-medium text-gray-400 mb-1 uppercase tracking-wider">预览</div>
            <Preview />
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
