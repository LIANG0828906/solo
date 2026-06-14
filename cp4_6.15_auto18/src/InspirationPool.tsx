import { useState, useEffect, useRef, useCallback } from 'react'
import DragSortable from './components/DragSortable'
import type { GetItemPropsFn } from './components/DragSortable'
import AnimationWrapper from './components/AnimationWrapper'
import { TagCategory, TagLabelMap, FilterTagLabelMap } from './types'
import type { Inspiration, FilterTagType } from './types'
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

const FILTER_TAGS: FilterTagType[] = ['all', TagCategory.WRITING, TagCategory.DESIGN, TagCategory.CODING, TagCategory.OTHER]

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
  const [newlyAddedIds, setNewlyAddedIds] = useState<Set<string>>(new Set())

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
    const start = performance.now()
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

    setNewlyAddedIds(prev => new Set(prev).add(newInspiration.id))
    setTimeout(() => {
      setNewlyAddedIds(prev => {
        const next = new Set(prev)
        next.delete(newInspiration.id)
        return next
      })
    }, 500)

    onAdd(newInspiration)
    setTitle('')
    setDescription('')

    const duration = performance.now() - start
    if (duration > 100) {
      console.warn(`添加灵感响应耗时: ${duration.toFixed(2)}ms`)
    }
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
      const start = performance.now()

      setRemovingIds(prev => new Set(prev).add(id))
      setTimeout(() => {
        onRemove(id)
        setRemovingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 280)

      const duration = performance.now() - start
      if (duration > 100) {
        console.warn(`删除灵感响应耗时: ${duration.toFixed(2)}ms`)
      }
    },
    [onRemove]
  )

  const handleArchive = useCallback(
    (id: string, e: React.MouseEvent) => {
      e.stopPropagation()
      const start = performance.now()

      setRemovingIds(prev => new Set(prev).add(id))
      setTimeout(() => {
        onArchive(id)
        setRemovingIds(prev => {
          const next = new Set(prev)
          next.delete(id)
          return next
        })
      }, 280)

      const duration = performance.now() - start
      if (duration > 100) {
        console.warn(`归档灵感响应耗时: ${duration.toFixed(2)}ms`)
      }
    },
    [onArchive]
  )

  const handleOrderChange = useCallback((newOrder: Inspiration[]) => {
    const reordered = newOrder.map((item, idx) => ({ ...item, order: idx }))
    onOrderChange(reordered)
  }, [onOrderChange])

  const filteredInspirations =
    activeFilter === 'all'
      ? inspirations
      : inspirations.filter(i => i.tags.includes(activeFilter))

  const renderInspirationCard = (
    inspiration: Inspiration,
    getItemProps: GetItemPropsFn<Inspiration>,
    draggingId: string | null,
    index: number
  ) => {
    const isRemoving = removingIds.has(inspiration.id)
    const isNewlyAdded = newlyAddedIds.has(inspiration.id)
    const isSelected = selectedIds.includes(inspiration.id)
    const isDragging = draggingId === inspiration.id

    const cardClassName = `inspiration-card
      ${isSelected ? 'selected' : ''}
      ${isDragging ? 'dragging' : ''}`

    return (
      <AnimationWrapper
        key={inspiration.id}
        animation={isRemoving ? 'shrinkFadeOut' : isNewlyAdded ? 'bounceInUp' : 'none'}
        duration={isRemoving ? 300 : 400}
        delay={isNewlyAdded ? index * 30 : 0}
        visible={!isRemoving}
        className={cardClassName}
        {...getItemProps(inspiration, index)}
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
              {TagLabelMap[tag]}
            </span>
          ))}
        </div>
      </AnimationWrapper>
    )
  }

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
              {FilterTagLabelMap[tag]}
            </button>
          ))}
        </div>
      </div>

      {filteredInspirations.length === 0 ? (
        <AnimationWrapper animation="fadeIn" duration={300}>
          <div className="empty-state">
            <div className="empty-state-icon">✨</div>
            <p className="empty-state-text">
              还没有灵感记录
              <br />
              点击下方输入框或按 <kbd>Ctrl + K</kbd> 开始捕获你的第一个灵感
            </p>
          </div>
        </AnimationWrapper>
      ) : (
        <DragSortable<Inspiration>
          items={filteredInspirations}
          onOrderChange={handleOrderChange}
        >
          {({ items, getItemProps, draggingId }) => (
            <div className="inspiration-grid">
              {items.map((inspiration, index) =>
                renderInspirationCard(inspiration, getItemProps, draggingId, index)
              )}
            </div>
          )}
        </DragSortable>
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
