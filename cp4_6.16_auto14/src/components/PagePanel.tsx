import { useState, useCallback, useRef, memo } from 'react'
import useEditorStore from '@/stores/editorStore'
import { Plus, Trash2, GripVertical, Settings, X, Edit3 } from 'lucide-react'
import { cn } from '@/lib/utils'

const BG_COLORS = [
  '#FFFFFF',
  '#FFF8E1',
  '#E8F5E9',
  '#E3F2FD',
  '#FCE4EC',
  '#F3E5F5',
  '#F5F5F5',
  '#FFEBEE',
]

const PagePanel = memo(function PagePanel() {
  const pages = useEditorStore((s) => s.pages)
  const currentPageId = useEditorStore((s) => s.currentPageId)
  const courses = useEditorStore((s) => s.courses)
  const currentCourseId = useEditorStore((s) => s.currentCourseId)
  const setCurrentPage = useEditorStore((s) => s.setCurrentPage)
  const addPage = useEditorStore((s) => s.addPage)
  const deletePage = useEditorStore((s) => s.deletePage)
  const reorderPages = useEditorStore((s) => s.reorderPages)
  const updatePage = useEditorStore((s) => s.updatePage)

  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [editingPageId, setEditingPageId] = useState<string | null>(null)
  const [settingsPageId, setSettingsPageId] = useState<string | null>(null)
  const [editingTitle, setEditingTitle] = useState('')
  const dragIndex = useRef<number>(-1)

  const currentCourse = courses.find((c) => c.id === currentCourseId)

  const sortedPages = [...pages].sort((a, b) => a.order - b.order)

  const handleAddPage = useCallback(() => {
    const newIndex = sortedPages.length + 1
    addPage(`第 ${newIndex} 页`)
  }, [addPage, sortedPages.length])

  const handleDeletePage = useCallback(
    (e: React.MouseEvent, pageId: string) => {
      e.stopPropagation()
      if (sortedPages.length <= 1) return
      deletePage(pageId)
    },
    [deletePage, sortedPages.length]
  )

  const handleDragStart = useCallback(
    (e: React.DragEvent, pageId: string) => {
      setDraggedId(pageId)
      e.dataTransfer.effectAllowed = 'move'
      dragIndex.current = sortedPages.findIndex((p) => p.id === pageId)
    },
    [sortedPages]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent, pageId: string) => {
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (pageId !== draggedId) {
        setDragOverId(pageId)
      }
    },
    [draggedId]
  )

  const handleDragLeave = useCallback(() => {
    setDragOverId(null)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent, targetId: string) => {
      e.preventDefault()
      if (!draggedId || draggedId === targetId) {
        setDraggedId(null)
        setDragOverId(null)
        return
      }

      const newOrder = sortedPages.map((p) => p.id)
      const fromIndex = newOrder.indexOf(draggedId)
      const toIndex = newOrder.indexOf(targetId)

      if (fromIndex !== -1 && toIndex !== -1) {
        const [removed] = newOrder.splice(fromIndex, 1)
        newOrder.splice(toIndex, 0, removed)
        reorderPages(newOrder)
      }

      setDraggedId(null)
      setDragOverId(null)
    },
    [draggedId, sortedPages, reorderPages]
  )

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverId(null)
  }, [])

  const startEditing = useCallback((pageId: string, title: string) => {
    setEditingPageId(pageId)
    setEditingTitle(title)
  }, [])

  const finishEditing = useCallback(
    (pageId: string) => {
      if (editingTitle.trim()) {
        updatePage(pageId, { title: editingTitle.trim() })
      }
      setEditingPageId(null)
    },
    [editingTitle, updatePage]
  )

  const handleColorChange = useCallback(
    (pageId: string, color: string) => {
      updatePage(pageId, { backgroundColor: color })
    },
    [updatePage]
  )

  const currentPage = sortedPages.find((p) => p.id === currentPageId)

  return (
    <div className="w-[260px] bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-3 border-b border-gray-100">
        <div className="text-xs text-gray-500 mb-1">课件</div>
        <div className="font-semibold text-sm text-gray-800 truncate">
          {currentCourse?.title || '未命名课件'}
        </div>
      </div>

      <div className="p-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">页面列表</span>
        <button
          onClick={handleAddPage}
          className={cn(
            'w-6 h-6 flex items-center justify-center rounded',
            'bg-accent/10 text-accent-700 hover:bg-accent/20',
            'transition-colors duration-200'
          )}
          title="添加页面"
        >
          <Plus size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-2 space-y-1">
        {sortedPages.map((page, index) => (
          <div
            key={page.id}
            draggable
            onDragStart={(e) => handleDragStart(e, page.id)}
            onDragOver={(e) => handleDragOver(e, page.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, page.id)}
            onDragEnd={handleDragEnd}
            onClick={() => setCurrentPage(page.id)}
            className={cn(
              'group relative flex items-center gap-2 p-2 rounded-lg cursor-pointer',
              'transition-all duration-200 border',
              page.id === currentPageId
                ? 'bg-accent/10 border-accent/40 text-accent-800'
                : 'bg-gray-50 border-transparent hover:bg-gray-100 text-gray-700',
              draggedId === page.id && 'opacity-50 scale-95',
              dragOverId === page.id && draggedId !== page.id && 'ring-2 ring-accent/50 -translate-y-0.5'
            )}
          >
            <div
              className="cursor-grab active:cursor-grabbing text-gray-400 group-hover:text-gray-600 transition-colors"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <GripVertical size={14} />
            </div>

            <div
              className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
              style={{ backgroundColor: page.backgroundColor }}
              onMouseDown={(e) => e.stopPropagation()}
            />

            <div className="flex-1 min-w-0">
              {editingPageId === page.id ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onBlur={() => finishEditing(page.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') finishEditing(page.id)
                    if (e.key === 'Escape') setEditingPageId(null)
                  }}
                  autoFocus
                  className="w-full px-1 py-0.5 text-sm border border-accent/50 rounded focus:outline-none bg-white"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <div className="text-sm font-medium truncate">
                  {index + 1}. {page.title || '未命名'}
                </div>
              )}
            </div>

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  startEditing(page.id, page.title)
                }}
                className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="编辑标题"
              >
                <Edit3 size={12} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  setSettingsPageId(settingsPageId === page.id ? null : page.id)
                }}
                className="w-5 h-5 flex items-center justify-center rounded text-gray-400 hover:text-gray-600 hover:bg-gray-200 transition-colors"
                title="页面设置"
              >
                <Settings size={12} />
              </button>
              <button
                onClick={(e) => handleDeletePage(e, page.id)}
                className={cn(
                  'w-5 h-5 flex items-center justify-center rounded transition-colors',
                  sortedPages.length <= 1
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                )}
                disabled={sortedPages.length <= 1}
                title="删除页面"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {page.id === currentPageId && (
              <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-accent rounded-r" />
            )}
          </div>
        ))}

        {settingsPageId && currentPage && settingsPageId === currentPage.id && (
          <div className="mt-2 p-2 bg-gray-50 rounded-lg border border-gray-200 animate-fade-in">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">背景颜色</span>
              <button
                onClick={() => setSettingsPageId(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={12} />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-1.5">
              {BG_COLORS.map((color) => (
                <button
                  key={color}
                  onClick={() => handleColorChange(settingsPageId, color)}
                  className={cn(
                    'w-full aspect-square rounded border-2 transition-all duration-200',
                    currentPage.backgroundColor === color
                      ? 'border-accent scale-110'
                      : 'border-gray-200 hover:border-gray-400'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="p-2 border-t border-gray-100">
        <button
          onClick={handleAddPage}
          className={cn(
            'w-full py-2 text-sm font-medium rounded-lg',
            'border-2 border-dashed border-gray-300 text-gray-500',
            'hover:border-accent/50 hover:text-accent-700 hover:bg-accent/5',
            'transition-all duration-200'
          )}
        >
          <Plus size={14} className="inline mr-1" />
          添加页面
        </button>
      </div>
    </div>
  )
})

export default PagePanel
