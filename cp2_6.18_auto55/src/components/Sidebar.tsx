import React, { useCallback, useState } from 'react'
import { Plus, Trash2, FileText, ChevronDown } from 'lucide-react'
import { useDocumentStore, DocItem } from '@/store/documentStore'

const Sidebar: React.FC = React.memo(() => {
  const documents = useDocumentStore(s => s.documents)
  const activeDocId = useDocumentStore(s => s.activeDocId)
  const createDoc = useDocumentStore(s => s.createDoc)
  const deleteDoc = useDocumentStore(s => s.deleteDoc)
  const switchDoc = useDocumentStore(s => s.switchDoc)
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  const handleCreate = useCallback(() => {
    const title = prompt('请输入文档标题')
    if (title?.trim()) {
      createDoc(title.trim())
    }
  }, [createDoc])

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    if (confirm('确定要删除此文档吗？')) {
      deleteDoc(id)
    }
  }, [deleteDoc])

  const handleSwitch = useCallback((id: string) => {
    switchDoc(id)
    setIsMobileOpen(false)
  }, [switchDoc])

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const renderDocItem = (doc: DocItem) => (
    <div
      key={doc.id}
      onClick={() => handleSwitch(doc.id)}
      className={`flex items-center justify-between h-12 px-4 rounded-md cursor-pointer transition-colors duration-200 group ${
        activeDocId === doc.id
          ? 'bg-blue-100 text-blue-800'
          : 'hover:bg-gray-200 text-gray-700'
      }`}
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <FileText size={14} className="shrink-0" />
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium truncate">{doc.title}</div>
          <div className="text-xs text-gray-400">{formatTime(doc.updatedAt)}</div>
        </div>
      </div>
      <button
        onClick={(e) => handleDelete(e, doc.id)}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-red-500 transition-all duration-200 shrink-0"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )

  const activeDoc = documents.find((d: DocItem) => d.id === activeDocId)

  return (
    <>
      <div className="hidden md:flex flex-col w-[220px] bg-gray-100 border-r border-gray-200 h-full shrink-0">
        <div className="p-3">
          <button
            onClick={handleCreate}
            className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-200 text-sm font-medium"
          >
            <Plus size={16} />
            新建文档
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-2 space-y-1">
          {documents.map(renderDocItem)}
        </div>
        {documents.length === 0 && (
          <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
            暂无文档
          </div>
        )}
      </div>

      <div className="md:hidden">
        <div className="flex items-center gap-2 p-2 bg-gray-100 border-b border-gray-200">
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="flex items-center gap-1 px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm text-gray-700"
          >
            <FileText size={14} />
            {activeDoc ? activeDoc.title : '选择文档'}
            <ChevronDown size={14} />
          </button>
          <button
            onClick={handleCreate}
            className="p-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors duration-200"
          >
            <Plus size={14} />
          </button>
        </div>
        {isMobileOpen && (
          <div className="bg-white border-b border-gray-200 shadow-lg max-h-60 overflow-y-auto">
            {documents.map((doc: DocItem) => (
              <div
                key={doc.id}
                onClick={() => handleSwitch(doc.id)}
                className={`flex items-center justify-between px-4 py-3 cursor-pointer transition-colors duration-200 ${
                  activeDocId === doc.id ? 'bg-blue-50 text-blue-800' : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <FileText size={14} className="shrink-0" />
                  <span className="text-sm truncate">{doc.title}</span>
                </div>
                <button
                  onClick={(e) => handleDelete(e, doc.id)}
                  className="p-1 text-gray-400 hover:text-red-500 transition-colors duration-200"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
