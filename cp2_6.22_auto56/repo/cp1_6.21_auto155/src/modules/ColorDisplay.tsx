import { useState, useCallback, useRef, useEffect } from 'react'
import { useFavorites } from '../App'
import { copyToClipboard, convertToCSSVariables, exportToJSON, exportToCSS } from '../utils/export'
import type { ColorItem } from '../utils/parser'
import './ColorDisplay.css'

interface ColorDisplayProps {
  colors: ColorItem[]
}

interface DetailCardPosition {
  x: number
  y: number
}

export default function ColorDisplay({ colors }: ColorDisplayProps) {
  const { favorites, addToFavorites, removeFromFavorites, reorderFavorites, clearFavorites } = useFavorites()
  const [selectedColor, setSelectedColor] = useState<ColorItem | null>(null)
  const [detailPosition, setDetailPosition] = useState<DetailCardPosition>({ x: 0, y: 0 })
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const detailRef = useRef<HTMLDivElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const handleColorClick = useCallback(
    (color: ColorItem, event: React.MouseEvent) => {
      setSelectedColor(color)
      setEditValue(color.value)

      const containerRect = containerRef.current?.getBoundingClientRect()
      if (containerRect) {
        const targetRect = event.currentTarget.getBoundingClientRect()
        let x = targetRect.right + 12
        let y = targetRect.top

        if (x + 240 > containerRect.right) {
          x = targetRect.left - 252
        }
        if (y + 200 > containerRect.bottom) {
          y = containerRect.bottom - 210
        }
        if (y < containerRect.top) {
          y = containerRect.top
        }

        setDetailPosition({ x: x - containerRect.left, y: y - containerRect.top })
      }
    },
    []
  )

  const handleCloseDetail = useCallback(() => {
    setSelectedColor(null)
    setEditValue('')
  }, [])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        detailRef.current &&
        !detailRef.current.contains(event.target as Node) &&
        !(event.target as HTMLElement).closest('.color-dot-item')
      ) {
        handleCloseDetail()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [handleCloseDetail])

  const handleCopyColor = useCallback(
    async (color: ColorItem) => {
      try {
        await copyToClipboard(color.value)
        setCopiedId(color.id)
        setTimeout(() => setCopiedId(null), 500)
      } catch (e) {
        console.error('Copy failed:', e)
      }
    },
    []
  )

  const handleEditChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setEditValue(e.target.value)
  }, [])

  const handleEditSubmit = useCallback(() => {
    if (selectedColor && editValue.trim()) {
      const newValue = editValue.trim()
      selectedColor.value = newValue
      setSelectedColor({ ...selectedColor })
    }
  }, [selectedColor, editValue])

  const handleEditKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleEditSubmit()
      }
    },
    [handleEditSubmit]
  )

  const handleEditBlur = useCallback(() => {
    handleEditSubmit()
  }, [handleEditSubmit])

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }, [])

  const handleSelectAll = useCallback(() => {
    if (selectedIds.size === colors.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(colors.map((c) => c.id)))
    }
  }, [colors, selectedIds.size])

  const handleAddSelectedToFavorites = useCallback(() => {
    const selectedColors = colors.filter((c) => selectedIds.has(c.id))
    addToFavorites(selectedColors)
  }, [colors, selectedIds, addToFavorites])

  const handleDragStart = useCallback((index: number, e: React.DragEvent) => {
    setDragIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(index))
  }, [])

  const handleDragOver = useCallback((index: number, e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOverIndex(index)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null)
  }, [])

  const handleDrop = useCallback(
    (toIndex: number, e: React.DragEvent) => {
      e.preventDefault()
      if (dragIndex !== null && dragIndex !== toIndex) {
        reorderFavorites(dragIndex, toIndex)
      }
      setDragIndex(null)
      setDragOverIndex(null)
    },
    [dragIndex, reorderFavorites]
  )

  const handleDragEnd = useCallback(() => {
    setDragIndex(null)
    setDragOverIndex(null)
  }, [])

  const handleExportCSSVars = useCallback(() => {
    exportToCSS(favorites)
  }, [favorites])

  const handleExportJSON = useCallback(() => {
    exportToJSON(favorites)
  }, [favorites])

  const handleCopyCSSVars = useCallback(async () => {
    const cssVars = convertToCSSVariables(favorites)
    try {
      await copyToClipboard(cssVars)
      setCopiedId('css-vars')
      setTimeout(() => setCopiedId(null), 500)
    } catch (e) {
      console.error('Copy failed:', e)
    }
  }, [favorites])

  const isFavorite = (id: string) => favorites.some((f) => f.id === id)

  return (
    <div className="color-display-container" ref={containerRef}>
      <div className="display-section">
        <div className="section-header">
          <h2 className="section-title">颜色预览</h2>
          <div className="section-actions">
            <button
              className="section-btn"
              onClick={handleSelectAll}
              disabled={colors.length === 0}
            >
              {selectedIds.size === colors.length && colors.length > 0 ? '取消全选' : '全选'}
            </button>
            <button
              className="section-btn primary"
              onClick={handleAddSelectedToFavorites}
              disabled={selectedIds.size === 0}
            >
              添加收藏 ({selectedIds.size})
            </button>
          </div>
        </div>

        {colors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎨</div>
            <p className="empty-text">暂无颜色</p>
            <p className="empty-hint">在左侧输入 CSS 代码开始提取</p>
          </div>
        ) : (
          <div className="color-list">
            {colors.map((color) => (
              <div
                key={color.id}
                className={`color-dot-item ${selectedIds.has(color.id) ? 'selected' : ''} ${
                  isFavorite(color.id) ? 'is-favorite' : ''
                }`}
              >
                <div
                  className="color-dot-wrapper"
                  onClick={(e) => handleColorClick(color, e)}
                  title={color.value}
                >
                  <div
                    className="color-dot"
                    style={{ backgroundColor: color.value }}
                  />
                  {isFavorite(color.id) && <span className="favorite-badge">⭐</span>}
                </div>
                <span className="color-value-text">{color.value}</span>
                <button
                  className={`select-checkbox ${selectedIds.has(color.id) ? 'checked' : ''}`}
                  onClick={() => toggleSelect(color.id)}
                  title={selectedIds.has(color.id) ? '取消选择' : '选择'}
                >
                  {selectedIds.has(color.id) && '✓'}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedColor && (
        <div
          ref={detailRef}
          className="color-detail-card"
          style={{
            left: detailPosition.x,
            top: detailPosition.y
          }}
        >
          <div
            className="detail-color-block"
            style={{ backgroundColor: selectedColor.value }}
          />
          <div className="detail-info">
            <div className="detail-row">
              <span className="detail-label">格式</span>
              <span className="detail-value">{selectedColor.format.toUpperCase()}</span>
            </div>
            <div className="detail-row">
              <span className="detail-label">颜色值</span>
              <button
                className="copy-btn"
                onClick={() => handleCopyColor(selectedColor)}
                title="点击复制"
              >
                {copiedId === selectedColor.id ? '已复制' : selectedColor.value}
              </button>
            </div>
            <div className="detail-row">
              <span className="detail-label">编辑</span>
              <input
                type="text"
                className="edit-input"
                value={editValue}
                onChange={handleEditChange}
                onKeyDown={handleEditKeyDown}
                onBlur={handleEditBlur}
                placeholder="输入颜色值"
              />
            </div>
          </div>
        </div>
      )}

      <div className="favorites-section">
        <div className="section-header">
          <h2 className="section-title">
            收藏配色
            <span className="favorites-count">({favorites.length})</span>
          </h2>
          {favorites.length > 0 && (
            <div className="section-actions">
              <button className="section-btn" onClick={clearFavorites}>
                清空
              </button>
              <button
                className="section-btn"
                onClick={handleCopyCSSVars}
                title="复制CSS变量"
              >
                {copiedId === 'css-vars' ? '已复制' : '复制变量'}
              </button>
              <button className="section-btn" onClick={handleExportCSSVars}>
                导出 CSS
              </button>
              <button className="section-btn primary" onClick={handleExportJSON}>
                导出 JSON
              </button>
            </div>
          )}
        </div>

        {favorites.length === 0 ? (
          <div className="favorites-empty">
            <span>💡</span>
            <p>选择颜色后点击"添加收藏"按钮</p>
          </div>
        ) : (
          <div className="favorites-list">
            {favorites.map((color, index) => (
              <div
                key={color.id}
                className={`favorite-item ${dragIndex === index ? 'dragging' : ''} ${
                  dragOverIndex === index ? 'drag-over' : ''
                }`}
                draggable
                onDragStart={(e) => handleDragStart(index, e)}
                onDragOver={(e) => handleDragOver(index, e)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(index, e)}
                onDragEnd={handleDragEnd}
              >
                <div className="favorite-drag-handle">⋮⋮</div>
                <div
                  className="favorite-color-dot"
                  style={{ backgroundColor: color.value }}
                />
                <span className="favorite-color-value">{color.value}</span>
                <button
                  className="favorite-remove-btn"
                  onClick={() => removeFromFavorites(color.id)}
                  title="移除收藏"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
