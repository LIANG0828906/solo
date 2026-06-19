import React, { useState, useCallback } from 'react'
import type { Bookmark } from '../modules/parser/bookmarkParser'
import type { Tag } from '../modules/storage/storageService'
import { getFaviconUrl, getDomain, formatDate, saveBookmarks, saveTags } from '../modules/storage/storageService'
import { useStore } from '../store'

interface BookmarkGridProps {
  bookmarks: Bookmark[]
  tags: Tag[]
  viewMode: 'grid' | 'list'
  searchQuery: string
  onBookmarkUpdate?: () => void
}

const BookmarkGrid: React.FC<BookmarkGridProps> = ({
  bookmarks,
  tags,
  viewMode,
  searchQuery,
  onBookmarkUpdate
}) => {
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [editingTagId, setEditingTagId] = useState<string | null>(null)
  const [newTagName, setNewTagName] = useState('')
  const { addTagToBookmark, removeTagFromBookmark, setBookmarks } = useStore()

  const handleCardClick = useCallback((url: string, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.card-tags, .add-tag-input')) {
      return
    }
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [])

  const handleDragStart = useCallback((id: string, e: React.DragEvent) => {
    setDraggedId(id)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', id)
  }, [])

  const handleDragEnd = useCallback(() => {
    setDraggedId(null)
    setDragOverId(null)
  }, [])

  const handleDragOver = useCallback((id: string, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (dragOverId !== id) {
      setDragOverId(id)
    }
  }, [dragOverId])

  const handleDragLeave = useCallback(() => {
    setDragOverId(null)
  }, [])

  const handleDrop = useCallback((targetId: string, e: React.DragEvent) => {
    e.preventDefault()
    const sourceId = e.dataTransfer.getData('text/plain')

    if (sourceId && sourceId !== targetId) {
      const allBookmarks = useStore.getState().bookmarks
      const sourceIndex = allBookmarks.findIndex(b => b.id === sourceId)
      const targetIndex = allBookmarks.findIndex(b => b.id === targetId)

      if (sourceIndex !== -1 && targetIndex !== -1) {
        const newBookmarks = [...allBookmarks]
        const [removed] = newBookmarks.splice(sourceIndex, 1)
        newBookmarks.splice(targetIndex, 0, removed)

        setBookmarks(newBookmarks)
        saveBookmarks(newBookmarks)
        onBookmarkUpdate?.()
      }
    }

    setDraggedId(null)
    setDragOverId(null)
  }, [setBookmarks, onBookmarkUpdate])

  const handleAddTag = useCallback((bookmarkId: string) => {
    if (!newTagName.trim()) return

    addTagToBookmark(bookmarkId, newTagName.trim())
    setNewTagName('')
    setEditingTagId(null)

    setTimeout(() => {
      const { bookmarks, tags } = useStore.getState()
      saveBookmarks(bookmarks)
      saveTags(tags)
      onBookmarkUpdate?.()
    }, 0)
  }, [newTagName, addTagToBookmark, onBookmarkUpdate])

  const handleRemoveTag = useCallback((bookmarkId: string, tagName: string) => {
    removeTagFromBookmark(bookmarkId, tagName)
    setTimeout(() => {
      const { bookmarks } = useStore.getState()
      saveBookmarks(bookmarks)
      onBookmarkUpdate?.()
    }, 0)
  }, [removeTagFromBookmark, onBookmarkUpdate])

  const highlightText = useCallback((text: string, query: string): React.ReactNode => {
    if (!query.trim()) return text

    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const regex = new RegExp(`(${escapedQuery})`, 'gi')
    const parts = text.split(regex)

    return parts.map((part, i) =>
      regex.test(part) ? (
        <span key={i} className="highlight">{part}</span>
      ) : (
        <span key={i}>{part}</span>
      )
    )
  }, [])

  const getTagColor = useCallback((tagName: string): string => {
    const tag = tags.find(t => t.name === tagName)
    return tag?.color || '#4a90d9'
  }, [tags])

  const renderBookmarkCard = useCallback((bookmark: Bookmark): React.ReactNode => {
    const isDragging = draggedId === bookmark.id
    const isDragOver = dragOverId === bookmark.id
    const faviconUrl = getFaviconUrl(bookmark.url)
    const domain = getDomain(bookmark.url)
    const dateStr = formatDate(bookmark.addTime)

    return (
      <div
        key={bookmark.id}
        className={`bookmark-card ${isDragging ? 'dragging' : ''} ${isDragOver ? 'drag-over' : ''}`}
        draggable
        onDragStart={(e) => handleDragStart(bookmark.id, e)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(bookmark.id, e)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(bookmark.id, e)}
        onClick={(e) => handleCardClick(bookmark.url, e)}
      >
        <div className="card-header">
          <div className="favicon">
            {faviconUrl ? (
              <img
                src={faviconUrl}
                alt=""
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = 'none'
                }}
              />
            ) : null}
            {!faviconUrl ? '🌐' : null}
          </div>
          <div className="card-info">
            <div className="card-title" title={bookmark.title}>
              {highlightText(bookmark.title, searchQuery)}
            </div>
            <div className="card-url" title={bookmark.url}>
              {highlightText(domain, searchQuery)}
            </div>
            <div className="card-date">{dateStr}</div>
          </div>
        </div>

        <div className="card-tags">
          {bookmark.tags.map(tag => (
            <span
              key={tag}
              className="tag-chip"
              style={{ backgroundColor: getTagColor(tag) }}
              onClick={(e) => {
                e.stopPropagation()
                handleRemoveTag(bookmark.id, tag)
              }}
              title="点击移除标签"
            >
              {tag} ×
            </span>
          ))}
          {bookmark.tags.length < 5 && editingTagId !== bookmark.id && (
            <span
              className="tag-chip"
              style={{ backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)', cursor: 'pointer' }}
              onClick={(e) => {
                e.stopPropagation()
                setEditingTagId(bookmark.id)
                setNewTagName('')
              }}
            >
              + 添加标签
            </span>
          )}
          {editingTagId === bookmark.id && (
            <div className="add-tag-input" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="输入标签名称..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddTag(bookmark.id)
                  } else if (e.key === 'Escape') {
                    setEditingTagId(null)
                  }
                }}
              />
              <button className="add-tag-btn" onClick={() => handleAddTag(bookmark.id)}>
                添加
              </button>
              <button
                className="add-tag-btn"
                style={{ background: 'var(--card-bg)', color: 'var(--text-secondary)' }}
                onClick={() => setEditingTagId(null)}
              >
                取消
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }, [
    draggedId, dragOverId, searchQuery, editingTagId, newTagName,
    handleDragStart, handleDragEnd, handleDragOver, handleDragLeave,
    handleDrop, handleCardClick, handleAddTag, handleRemoveTag,
    highlightText, getTagColor
  ])

  if (bookmarks.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📭</div>
        <div className="empty-state-text">暂无书签</div>
        <div className="empty-state-hint">点击右上角"导入书签"按钮开始使用</div>
      </div>
    )
  }

  return (
    <div className={viewMode === 'grid' ? 'bookmark-grid' : 'bookmark-list'}>
      {bookmarks.map(bookmark => renderBookmarkCard(bookmark))}
    </div>
  )
}

export default React.memo(BookmarkGrid)
