import { useState, useEffect, useRef, useCallback } from 'react'
import type { Inspiration, FilterTagType, TagType } from './types'
import { generateId, extractKeywords, autoDetectTags } from './utils'

interface InspirationPoolProps {
  inspirations: Inspiration[]
  selectedIds: string[]
  activeFilter: FilterTagType
  onAdd: (inspiration: Inspiration) => void
  onRemove: (id: string) => void
  onArchive: (id: string) => void
  onToggleSelect: (id: string) => void
  onOrderChange: (inspirations: Inspiration[]) => void
  onFilterChange: (filter: FilterTagType) => void
}

const FILTER_TAGS: FilterTagType[] = ['全部', '写作', '设计', '编程', '其他']

function InspirationPool({
  inspirations,
  selectedIds,
  activeFilter,
  onAdd,
  onRemove,
  onArchive,
  onToggleSelect,
  onOrderChange,
  onFilterChange,
}: InspirationPoolProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isInputFocused, setIsInputFocused] = useState(false)
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set())
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  const titleInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        titleInputRef.current?.focus()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleSubmit = useCallback(() => {
    const trimmedTitle = title.trim()
    const trimmedDesc = description.trim()

    if (!trimmedTitle) {
      return
    }

    const keywords = extractKeywords(`${trimmedTitle} ${trimmedDesc}`)
    const tags = autoDetectTags(trimmedTitle, trimmedDesc)

    const newInspiration: Inspiration = {
      id: generateId(),
      title: trimmedTitle,
      description: trimmedDesc,
      tags,
      keywords,
      createdAt: Date.now(),
      order: inspirations.length,
      isArchived: false,
    }

    onAdd(newInspiration)
    setTitle('')
    setDescription('')
  }, [title, description, inspirations.length, onAdd])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleRemove = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setRemovingIds(prev => new Set(prev).add(id))
      setTimeout(() => {
        onRemove(id)
        setRemovingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 280)
    },
    [onRemove]
  )

  const handleArchive = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      setRemovingIds(prev => new Set(prev).add(id))
      setTimeout(() => {
        onArchive(id)
        setRemovingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 280)
    },
    [onArchive]
  )

  const handleDragStart = (e: React.DragEvent, id: string) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (draggedId && draggedId !== id) {
      setDragOverId(id)
    }
  }

  const handleDragLeave = () => {
    setDragOverId(null)
  }

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault()
    if (!draggedId || draggedId === targetId) {
      return
    }

    const newInspirations = [...inspirations]
    const draggedIndex = newInspirations.findIndex(i => i.id === draggedId)
    const targetIndex = newInspirations.findIndex(i => i.id === targetId)

    const [removed] = newInspirations.splice(draggedIndex, 1)
    newInspirations.splice(targetIndex, 0, removed)

    const reordered = newInspirations.map((item, idx) => ({ ...item, order: idx }))
    onOrderChange(reordered)

    setDraggedId(null)
    setDragOverId(null)
  }

  const handleDragEnd = () => {
    setDraggedId(null)
    setDragOverId(null)
  }

  const filteredInspirations =
    activeFilter === '全部'
      ? inspirations
      : inspirations.filter(i => i.tags.includes(activeFilter as TagType))

  return (
    <div ref={containerRef}>
      <div className="section-header">
        <h2 className="section-title">
          灵感池
          <span>({inspirations.length})</span>
        </h2>
        <div className="tag-filters">
          {FILTER_TAGS.map(tag => (
            <button
              key={tag}
              className={`tag-filter-btn ${activeFilter === tag ? 'active' : ''}`}
              onClick={() => onFilterChange(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {filteredInspirations.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✨</div>
          <p className="empty-state-text">
            还没有灵感记录
            <br />
            点击下方输入框或按 <kbd>Ctrl + K</kbd> 开始捕获你的第一个灵感
          </p>
        </div>
      ) : (
        <div className="inspiration-grid">
          {filteredInspirations.map(inspiration => (
            <div
              key={inspiration.id}
              className={`inspiration-card
                ${selectedIds.includes(inspiration.id) ? 'selected' : ''}
                ${removingIds.has(inspiration.id) ? 'removing' : ''}
                ${draggedId === inspiration.id ? 'dragging' : ''}
                ${dragOverId === inspiration.id ? 'drag-over' : ''}`}
              draggable
              onDragStart={e => handleDragStart(e, inspiration.id)}
              onDragOver={e => handleDragOver(e, inspiration.id)}
              onDragLeave={handleDragLeave}
              onDrop={e => handleDrop(e, inspiration.id)}
              onDragEnd={handleDragEnd}
              onClick={() => onToggleSelect(inspiration.id)}
            >
              <div className="inspiration-card-header">
                <h3 className="inspiration-card-title">{inspiration.title}</h3>
                <div className="inspiration-card-actions">
                  <button
                    className="icon-btn"
                    title="归档"
                    onClick={e => handleArchive(inspiration.id, e)}
                  >
                    📁
                  </button>
                  <button
                    className="icon-btn danger"
                    title="删除"
                    onClick={e => handleRemove(inspiration.id, e)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              {inspiration.description && (
                <p className="inspiration-card-desc">{inspiration.description}</p>
              )}
              <div className="inspiration-card-tags">
                {inspiration.tags.map(tag => (
                  <span key={tag} className={`tag tag-${tag}`}>
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="floating-input-container">
        {!isInputFocused && (
          <div className="hint-text">
            按 <kbd>Ctrl</kbd> + <kbd>K</kbd> 快速唤出
          </div>
        )}
        <div
          className="floating-input"
          style={{
            opacity: isInputFocused ? 1 : undefined,
            boxShadow: isInputFocused
              ? 'var(--shadow-deep), 0 0 0 4px rgba(245, 199, 106, 0.1)'
              : undefined,
          }}
        >
          <div className="floating-input-row">
            <input
              ref={titleInputRef}
              type="text"
              placeholder="给你的灵感起个标题..."
              value={title}
              onChange={e => setTitle(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onKeyDown={handleKeyDown}
              maxLength={100}
            />
          </div>
          <div className="floating-input-row">
            <textarea
              placeholder="简要描述你的想法...（可选）"
              value={description}
              onChange={e => setDescription(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onKeyDown={handleKeyDown}
              maxLength={500}
              rows={1}
            />
            <button
              className="submit-btn"
              onClick={handleSubmit}
              disabled={!title.trim()}
            >
              保存灵感
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InspirationPool
