import React, { useState, useMemo, memo } from 'react'
import type { ColorScheme, SortType } from '../types'

interface SchemeLibraryProps {
  schemes: ColorScheme[]
  onApply: (scheme: ColorScheme) => void
  onDelete: (id: string) => void
  onExport: (scheme: ColorScheme) => void
  onShare: (scheme: ColorScheme) => void
}

const SchemeLibrary: React.FC<SchemeLibraryProps> = ({
  schemes,
  onApply,
  onDelete,
  onExport,
  onShare
}) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [tagFilter, setTagFilter] = useState('')
  const [sortBy, setSortBy] = useState<SortType>('date')

  const allTags = useMemo(() => {
    const tags = new Set<string>()
    schemes.forEach((s) => s.tags.forEach((t) => tags.add(t)))
    return Array.from(tags).sort()
  }, [schemes])

  const filteredAndSortedSchemes = useMemo(() => {
    let result = schemes

    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(term) ||
          s.tags.some((t) => t.toLowerCase().includes(term))
      )
    }

    if (tagFilter) {
      result = result.filter((s) => s.tags.includes(tagFilter))
    }

    const sorted = [...result]
    if (sortBy === 'date') {
      sorted.sort((a, b) => b.createdAt - a.createdAt)
    } else {
      sorted.sort((a, b) => a.name.localeCompare(b.name))
    }

    return sorted
  }, [schemes, searchTerm, tagFilter, sortBy])

  if (schemes.length === 0) {
    return (
      <div className="empty-state glass">
        <h3>还没有保存的配色方案</h3>
        <p>在调色板页面创建并保存你的第一个方案吧！</p>
      </div>
    )
  }

  return (
    <div>
      <div className="library-toolbar">
        <input
          type="text"
          placeholder="搜索方案名称或标签..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
          <option value="">所有标签</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortType)}
        >
          <option value="date">按创建时间</option>
          <option value="name">按名称</option>
        </select>
      </div>

      {filteredAndSortedSchemes.length === 0 ? (
        <div className="empty-state glass">
          <h3>没有找到匹配的方案</h3>
          <p>尝试调整搜索条件</p>
        </div>
      ) : (
        <div className="scheme-grid">
          {filteredAndSortedSchemes.map((scheme) => (
            <div
              key={scheme.id}
              className="glass scheme-card"
              onClick={() => onApply(scheme)}
            >
              <div
                className="scheme-main-color"
                style={{ backgroundColor: scheme.colors[0]?.hex || '#333' }}
              />
              <div className="scheme-mini-colors">
                {scheme.colors.slice(1, 5).map((c) => (
                  <div key={c.id} style={{ backgroundColor: c.hex }} />
                ))}
              </div>
              <div className="scheme-info">
                <h4>{scheme.name}</h4>
                <div className="scheme-tags">
                  {scheme.tags.map((tag) => (
                    <span key={tag} className="tag">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="scheme-actions">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onApply(scheme)
                  }}
                >
                  应用
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onExport(scheme)
                  }}
                >
                  导出
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onShare(scheme)
                  }}
                >
                  分享
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(scheme.id)
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default memo(SchemeLibrary)
