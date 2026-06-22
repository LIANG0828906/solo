import { useMemo, useState, useEffect, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useColorStore } from './store'
import GalleryCard from './components/GalleryCard'
import type { ColorScheme } from './types'

export default function Gallery() {
  const favorites = useColorStore((state) => state.favorites)
  const searchQuery = useColorStore((state) => state.searchQuery)
  const sortBy = useColorStore((state) => state.sortBy)
  const setSearchQuery = useColorStore((state) => state.setSearchQuery)
  const setSortBy = useColorStore((state) => state.setSortBy)
  const selectScheme = useColorStore((state) => state.selectScheme)

  const [searchInput, setSearchInput] = useState(searchQuery)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }
    debounceTimer.current = setTimeout(() => {
      setSearchQuery(searchInput)
    }, 400)
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchInput, setSearchQuery])

  const filteredAndSorted = useMemo(() => {
    let result = [...favorites]

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      result = result.filter((f) => f.name.toLowerCase().includes(query))
    }

    if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name, 'zh-CN'))
    } else {
      result.sort((a, b) => b.createdAt - a.createdAt)
    }

    return result
  }, [favorites, searchQuery, sortBy])

  return (
    <div style={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      <div style={{
        padding: '20px 24px',
        borderBottom: '1px solid var(--border-color)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ fontSize: 24, fontWeight: 700 }}>
            <span style={{ color: 'var(--accent-primary)' }}>配色</span>灵感墙
          </h1>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            共 {favorites.length} 个方案
          </span>
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              type="text"
              placeholder="搜索方案名称..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                paddingLeft: 36,
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                backgroundColor: 'var(--bg-secondary)',
                color: 'var(--text-primary)',
                fontSize: 13,
                outline: 'none',
                transition: 'border-color 0.2s ease'
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = 'var(--accent-primary)' }}
              onBlur={(e) => { e.currentTarget.style.borderColor = 'var(--border-color)' }}
            />
            <span style={{
              position: 'absolute',
              left: 12,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: 14
            }}>
              🔍
            </span>
          </div>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'name' | 'date')}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              backgroundColor: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              fontSize: 13,
              cursor: 'pointer',
              outline: 'none'
            }}
          >
            <option value="date">按时间排序</option>
            <option value="name">按名称排序</option>
          </select>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
        {filteredAndSorted.length === 0 ? (
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: 'var(--text-muted)',
            gap: 12
          }}>
            <div style={{ fontSize: 48, opacity: 0.5 }}>🎨</div>
            <div style={{ fontSize: 14 }}>
              {favorites.length === 0 ? '还没有收藏的配色方案' : '没有找到匹配的方案'}
            </div>
            <div style={{ fontSize: 12, opacity: 0.7 }}>
              {favorites.length === 0 ? '点击左侧"生成配色方案"并收藏吧' : '试试其他关键词'}
            </div>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, 160px)',
            gap: 16,
            justifyContent: 'start',
            alignContent: 'start'
          }}>
            <AnimatePresence mode="popLayout">
              {filteredAndSorted.map((scheme: ColorScheme, index: number) => (
                <GalleryCard
                  key={scheme.id}
                  scheme={scheme}
                  index={index}
                  onClick={() => selectScheme(scheme)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}
