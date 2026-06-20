import { useState, useEffect, useCallback, useMemo } from 'react'
import BookmarkForm from './BookmarkForm'
import BookmarkCard from './BookmarkCard'
import type { Bookmark } from '../server'

const CATEGORIES: Record<string, { label: string; color: string }> = {
  design: { label: '设计', color: '#e57373' },
  programming: { label: '编程', color: '#64b5f6' },
  writing: { label: '写作', color: '#81c784' },
  life: { label: '生活', color: '#ffb74d' }
}

function App() {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState('all')
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set())

  const fetchBookmarks = useCallback(async () => {
    try {
      const params = new URLSearchParams()
      if (activeCategory !== 'all') params.set('category', activeCategory)
      if (search) params.set('search', search)
      const res = await fetch(`/api/bookmarks?${params.toString()}`)
      const data = await res.json()
      setBookmarks(data)
    } catch (err) {
      console.error('Failed to fetch bookmarks:', err)
    }
  }, [activeCategory, search])

  useEffect(() => {
    fetchBookmarks()
  }, [fetchBookmarks])

  const allBookmarks = useMemo(() => bookmarks, [bookmarks])

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
    if (e.target.value) {
      const lower = e.target.value.toLowerCase()
      const matched = new Set<string>()
      allBookmarks.forEach(b => {
        if (b.content.toLowerCase().includes(lower) || b.note.toLowerCase().includes(lower)) {
          matched.add(b.id)
        }
      })
      setHighlighted(matched)
    } else {
      setHighlighted(new Set())
    }
  }, [allBookmarks])

  const handleDelete = useCallback(async (id: string) => {
    try {
      await fetch(`/api/bookmarks/${id}`, { method: 'DELETE' })
      setBookmarks(prev => prev.filter(b => b.id !== id))
    } catch (err) {
      console.error('Failed to delete bookmark:', err)
    }
  }, [])

  const handleSaved = useCallback((bookmark: Bookmark) => {
    setBookmarks(prev => [bookmark, ...prev])
  }, [])

  return (
    <div style={{ minHeight: '100%', background: '#fafafa' }}>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'rgba(250, 250, 250, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0,0,0,0.05)',
          padding: '16px 24px'
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16, color: '#333' }}>
            ✨ 灵感火花
          </h1>

          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 搜索灵感..."
              value={search}
              onChange={handleSearchChange}
              style={{
                flex: 1,
                minWidth: 200,
                padding: '10px 16px',
                borderRadius: 999,
                border: '1px solid #e0e0e0',
                background: 'white',
                fontSize: 14,
                outline: 'none',
                transition: 'border-color 200ms',
                color: '#333'
              }}
              onFocus={(e) => (e.target.style.borderColor = '#999')}
              onBlur={(e) => (e.target.style.borderColor = '#e0e0e0')}
            />
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveCategory('all')}
              style={{
                padding: '6px 16px',
                borderRadius: 999,
                border: activeCategory === 'all' ? 'none' : '1px solid #e0e0e0',
                background: activeCategory === 'all' ? '#666' : 'white',
                color: activeCategory === 'all' ? 'white' : '#555',
                fontSize: 13,
                cursor: 'pointer',
                transition: 'all 200ms ease',
                fontWeight: 500
              }}
            >
              全部
            </button>
            {Object.entries(CATEGORIES).map(([key, { label, color }]) => (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                style={{
                  padding: '6px 16px',
                  borderRadius: 999,
                  border: 'none',
                  background: activeCategory === key ? color : 'white',
                  color: activeCategory === key ? 'white' : '#555',
                  fontSize: 13,
                  cursor: 'pointer',
                  transition: 'all 200ms ease',
                  fontWeight: 500,
                  boxShadow: activeCategory === key ? 'none' : `inset 0 0 0 1px ${color}50`
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: color,
                    marginRight: 6,
                    verticalAlign: 'middle'
                  }}
                />
                {label}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '24px 12px' }}>
        <BookmarkForm onSaved={handleSaved} />

        <div
          style={{
            columnWidth: 200,
            columnGap: 16,
            marginTop: 24,
            padding: '0 12px'
          }}
        >
          {allBookmarks.map((bookmark, index) => (
            <div
              key={bookmark.id}
              style={{
                breakInside: 'avoid',
                marginBottom: 16,
                opacity: search ? (highlighted.has(bookmark.id) ? 1 : 0.15) : 1,
                transition: 'opacity 300ms ease'
              }}
              className="fade-in"
            >
              <BookmarkCard
                bookmark={bookmark}
                isHighlighted={highlighted.has(bookmark.id)}
                animationDelay={index * 30}
                onDelete={handleDelete}
              />
            </div>
          ))}
          {allBookmarks.length === 0 && (
            <div style={{ textAlign: 'center', padding: 48, color: '#999', columnSpan: 'all' }}>
              <p style={{ fontSize: 48, marginBottom: 12 }}>💭</p>
              <p>还没有灵感，添加第一个吧！</p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
