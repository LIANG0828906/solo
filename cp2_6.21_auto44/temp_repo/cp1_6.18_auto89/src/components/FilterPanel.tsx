import React, { useState, useEffect, useCallback } from 'react'
import { useNoteStore, SortMode } from '../stores/noteStore'

const FilterPanel: React.FC = () => {
  const { filter, setFilter, getAllTags, notes } = useNoteStore()
  const [fading, setFading] = useState(false)
  const allTags = useNoteStore((s) => s.getAllTags())

  const handleSortChange = useCallback(
    (mode: SortMode) => {
      if (filter.sortMode === mode) return
      setFading(true)
      setTimeout(() => {
        setFilter({ sortMode: mode })
        setFading(false)
      }, 150)
    },
    [filter.sortMode, setFilter]
  )

  const handleTagFilter = useCallback(
    (tag: string | null) => {
      setFading(true)
      setTimeout(() => {
        setFilter({ tagFilter: tag })
        setFading(false)
      }, 150)
    },
    [setFilter]
  )

  return (
    <div
      style={{
        width: 240,
        minWidth: 240,
        background: '#FFFFFF',
        borderRadius: 16,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
        padding: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
        height: 'fit-content',
        alignSelf: 'flex-start',
      }}
    >
      <style>{`
        @media (max-width: 768px) {
          .filter-panel-wrapper {
            width: 100% !important;
            min-width: unset !important;
          }
        }
      `}</style>

      <h3
        style={{
          fontSize: 15,
          fontWeight: 600,
          color: '#333',
          margin: 0,
        }}
      >
        筛选与排序
      </h3>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#888' }}>排序方式</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => handleSortChange('priority')}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: filter.sortMode === 'priority' ? '#6C63FF' : '#F0EEFF',
              color: filter.sortMode === 'priority' ? '#fff' : '#6C63FF',
            }}
            onMouseEnter={(e) => {
              if (filter.sortMode === 'priority') {
                e.currentTarget.style.backgroundColor = '#7E74FF'
              }
            }}
            onMouseLeave={(e) => {
              if (filter.sortMode === 'priority') {
                e.currentTarget.style.backgroundColor = '#6C63FF'
              }
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            按优先级
          </button>
          <button
            onClick={() => handleSortChange('time')}
            style={{
              flex: 1,
              padding: '8px 0',
              border: 'none',
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              backgroundColor: filter.sortMode === 'time' ? '#6C63FF' : '#F0EEFF',
              color: filter.sortMode === 'time' ? '#fff' : '#6C63FF',
            }}
            onMouseEnter={(e) => {
              if (filter.sortMode === 'time') {
                e.currentTarget.style.backgroundColor = '#7E74FF'
              }
            }}
            onMouseLeave={(e) => {
              if (filter.sortMode === 'time') {
                e.currentTarget.style.backgroundColor = '#6C63FF'
              }
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.95)'
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
            }}
          >
            按时间
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <span style={{ fontSize: 13, color: '#888' }}>标签筛选</span>
        <select
          value={filter.tagFilter || ''}
          onChange={(e) => handleTagFilter(e.target.value || null)}
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: 8,
            border: '1px solid #E0D8C8',
            fontSize: 13,
            color: '#333',
            backgroundColor: '#FAFAFA',
            outline: 'none',
            cursor: 'pointer',
            transition: 'border-color 0.15s ease',
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = '#6C63FF'
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = '#E0D8C8'
          }}
        >
          <option value="">全部标签</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          fontSize: 12,
          color: '#aaa',
          textAlign: 'center',
          paddingTop: 4,
          borderTop: '1px solid #F0EDE6',
        }}
      >
        共 {notes.length} 张便签
      </div>
    </div>
  )
}

export default FilterPanel
