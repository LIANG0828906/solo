import React, { useCallback, useState, useRef, useEffect } from 'react'
import { Plus, Trash2, FileText, ChevronDown } from 'lucide-react'
import { useDocumentStore, DocItem } from '@/store/documentStore'
import ConfirmDialog from './ConfirmDialog'
import { useToast } from './ToastContext'

const Sidebar: React.FC = React.memo(() => {
  const documents = useDocumentStore(s => s.documents)
  const activeDocId = useDocumentStore(s => s.activeDocId)
  const createDoc = useDocumentStore(s => s.createDoc)
  const deleteDoc = useDocumentStore(s => s.deleteDoc)
  const switchDoc = useDocumentStore(s => s.switchDoc)
  const { showToast } = useToast()

  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [newDocTitle, setNewDocTitle] = useState('')
  const listRef = useRef<HTMLDivElement>(null)
  const activeItemRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (activeDocId && activeItemRef.current && listRef.current) {
      activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
    }
  }, [activeDocId])

  const handleCreate = useCallback(() => {
    setNewDocTitle('')
    setShowCreateDialog(true)
  }, [])

  const confirmCreate = useCallback(() => {
    const trimmed = newDocTitle.trim()
    if (trimmed) {
      createDoc(trimmed)
      setShowCreateDialog(false)
      showToast('文档创建成功', 'success')
    } else {
      showToast('请输入文档标题', 'error')
    }
  }, [newDocTitle, createDoc, showToast])

  const handleDelete = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setDeleteConfirmId(id)
  }, [])

  const confirmDelete = useCallback(() => {
    if (!deleteConfirmId) return
    const doc = documents.find(d => d.id === deleteConfirmId)
    const deletedIndex = documents.findIndex(d => d.id === deleteConfirmId)
    const resultId = deleteDoc(deleteConfirmId)

    if (resultId !== null && deletedIndex !== -1) {
      const remaining = documents.filter(d => d.id !== deleteConfirmId)
      const nextIndex = Math.min(deletedIndex, remaining.length - 1)
      setTimeout(() => {
        if (activeItemRef.current) {
          activeItemRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
        }
      }, 100)
    }

    setDeleteConfirmId(null)
    showToast(`"${doc?.title ?? '文档'}" 已删除`, 'success')
  }, [deleteConfirmId, deleteDoc, documents, showToast])

  const handleSwitch = useCallback((id: string) => {
    switchDoc(id)
    setIsMobileOpen(false)
  }, [switchDoc])

  const formatTime = (timestamp: number) => {
    const d = new Date(timestamp)
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`
  }

  const renderDocItem = (doc: DocItem) => {
    const isActive = activeDocId === doc.id
    return (
      <div
        key={doc.id}
        ref={isActive ? activeItemRef : null}
        onClick={() => handleSwitch(doc.id)}
        className={`flex items-center justify-between h-12 px-4 rounded-md cursor-pointer transition-colors duration-200 group ${
          isActive
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
          title="删除文档"
        >
          <Trash2 size={14} />
        </button>
      </div>
    )
  }

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
        <div ref={listRef} className="flex-1 overflow-y-auto px-2 space-y-1">
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
          <div ref={listRef} className="bg-white border-b border-gray-200 shadow-lg max-h-60 overflow-y-auto">
            {documents.map((doc: DocItem) => (
              <div
                key={doc.id}
                ref={activeDocId === doc.id ? activeItemRef : null}
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

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        title="删除文档"
        message={`确定要删除 "${documents.find(d => d.id === deleteConfirmId)?.title ?? '该文档'}" 吗？此操作无法撤销。`}
        confirmText="删除"
        cancelText="取消"
        confirmColor="red"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />

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
        onConfirm={confirmCreate}
        onCancel={() => setShowCreateDialog(false)}
      />
    </>
  )
})

Sidebar.displayName = 'Sidebar'

export default Sidebar
