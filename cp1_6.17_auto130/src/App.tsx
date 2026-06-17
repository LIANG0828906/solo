import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import { useBookStore, Book, getStatusLabel } from './stores/bookStore'
import BookCard from './components/BookCard'
import BookDetail from './components/BookDetail'
import ExploreMode from './components/ExploreMode'

const PixelBanner: React.FC = () => {
  const sky = '#F5E6C8'
  const ground = '#D4A574'
  const groundDark = '#B8864F'
  const wood = '#8B4513'
  const woodLight = '#A0522D'
  const bookRed = '#C0392B'
  const bookBlue = '#2980B9'
  const bookGreen = '#27AE60'
  const bookYellow = '#DAA520'
  const bookPurple = '#8E44AD'
  const awning = '#E74C3C'
  const awningStripe = '#C0392B'
  const sign = '#FFF8DC'

  const px = (n: number) => `${n * 4}px`

  return (
    <div style={{ width: '100%', display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
      <div
        style={{
          position: 'relative',
          width: px(100),
          height: px(40),
          background: `linear-gradient(to bottom, ${sky} 0%, ${sky} 70%, ${ground} 70%, ${groundDark} 100%)`,
          borderRadius: 8,
          overflow: 'hidden',
          boxShadow: 'inset 0 -4px 12px rgba(0,0,0,0.1)'
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: px(2),
            right: px(8),
            width: px(5),
            height: px(5),
            borderRadius: '50%',
            background: '#FFD93D',
            boxShadow: `0 0 ${px(2)} #FFD93D`
          }}
        />

        <div style={{ position: 'absolute', top: px(4), left: px(10), width: px(2), height: px(2), background: '#fff', opacity: 0.8, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: px(3), left: px(12), width: px(3), height: px(2), background: '#fff', opacity: 0.8, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: px(6), left: px(30), width: px(2), height: px(2), background: '#fff', opacity: 0.7, borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: px(5), left: px(32), width: px(3), height: px(2), background: '#fff', opacity: 0.7, borderRadius: '50%' }} />

        <div
          style={{
            position: 'absolute',
            top: px(8),
            left: px(15),
            width: px(1),
            height: px(20),
            background: '#654321'
          }}
        />
        <div style={{ position: 'absolute', top: px(6), left: px(12), width: px(7), height: px(4), background: '#228B22', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: px(4), left: px(14), width: px(5), height: px(4), background: '#2E8B57', borderRadius: '50%' }} />

        <div
          style={{
            position: 'absolute',
            top: px(4),
            left: px(38),
            width: px(24),
            height: px(4),
            background: awning,
            clipPath: 'polygon(0 0, 100% 0, 95% 100%, 5% 100%)'
          }}
        />
        {[0, 1, 2, 3, 4].map(i => (
          <div
            key={i}
            style={{
              position: 'absolute',
              top: px(4),
              left: px(38 + i * 5),
              width: px(2),
              height: px(4),
              background: awningStripe,
              opacity: 0.5
            }}
          />
        ))}

        <div
          style={{
            position: 'absolute',
            top: px(2),
            left: px(42),
            width: px(16),
            height: px(4),
            background: sign,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: px(2.2),
            fontWeight: 700,
            color: wood,
            fontFamily: "'Noto Serif SC', serif",
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
            letterSpacing: 1
          }}
        >
          巷陌书摊
        </div>
        <div style={{ position: 'absolute', top: px(6), left: px(40), width: px(1), height: px(2), background: wood }} />
        <div style={{ position: 'absolute', top: px(6), left: px(59), width: px(1), height: px(2), background: wood }} />

        <div
          style={{
            position: 'absolute',
            top: px(12),
            left: px(36),
            width: px(28),
            height: px(14),
            background: wood,
            borderRadius: 2
          }}
        />
        <div style={{ position: 'absolute', top: px(11), left: px(35), width: px(30), height: px(2), background: woodLight, borderRadius: 2 }} />

        <div style={{ position: 'absolute', top: px(15), left: px(38), width: px(5), height: px(7), background: bookRed, borderRadius: 1 }} />
        <div style={{ position: 'absolute', top: px(14), left: px(39), width: px(3), height: px(1), background: '#fff', opacity: 0.4 }} />

        <div style={{ position: 'absolute', top: px(15), left: px(44), width: px(5), height: px(7), background: bookBlue, borderRadius: 1 }} />
        <div style={{ position: 'absolute', top: px(14), left: px(45), width: px(3), height: px(1), background: '#fff', opacity: 0.4 }} />

        <div style={{ position: 'absolute', top: px(15), left: px(50), width: px(5), height: px(7), background: bookGreen, borderRadius: 1 }} />
        <div style={{ position: 'absolute', top: px(14), left: px(51), width: px(3), height: px(1), background: '#fff', opacity: 0.4 }} />

        <div style={{ position: 'absolute', top: px(15), left: px(56), width: px(5), height: px(7), background: bookYellow, borderRadius: 1 }} />
        <div style={{ position: 'absolute', top: px(14), left: px(57), width: px(3), height: px(1), background: '#fff', opacity: 0.4 }} />

        <div style={{ position: 'absolute', top: px(23), left: px(38), width: px(5), height: px(2), background: bookPurple, borderRadius: 1 }} />
        <div style={{ position: 'absolute', top: px(23), left: px(44), width: px(4), height: px(2), background: '#E67E22', borderRadius: 1 }} />
        <div style={{ position: 'absolute', top: px(23), left: px(52), width: px(5), height: px(2), background: '#1ABC9C', borderRadius: 1 }} />

        <div style={{ position: 'absolute', top: px(26), left: px(38), width: px(1), height: px(4), background: wood }} />
        <div style={{ position: 'absolute', top: px(26), left: px(63), width: px(1), height: px(4), background: wood }} />
        <div style={{ position: 'absolute', top: px(30), left: px(37), width: px(26), height: px(1), background: woodLight }} />

        <div
          style={{
            position: 'absolute',
            top: px(22),
            left: px(70),
            width: px(6),
            height: px(8),
            background: '#5D4037',
            borderRadius: '50% 50% 0 0'
          }}
        />
        <div style={{ position: 'absolute', top: px(28), left: px(71), width: px(4), height: px(6), background: '#FFE4C4' }} />
        <div style={{ position: 'absolute', top: px(34), left: px(70), width: px(6), height: px(3), background: '#8B4513', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: px(31), left: px(68), width: px(10), height: px(2), background: '#DAA520' }} />

        <div style={{ position: 'absolute', top: px(28), left: px(73), width: px(1), height: px(1), background: '#000', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: px(28), left: px(75), width: px(1), height: px(1), background: '#000', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: px(30), left: px(73), width: px(3), height: px(1), borderBottom: '1px solid #000', borderRadius: '0 0 50% 50%' }} />

        <div style={{ position: 'absolute', top: px(33), left: px(79), width: px(4), height: px(5), background: bookRed, borderRadius: 1, transform: 'rotate(-10deg)' }} />

        <div style={{ position: 'absolute', top: px(28), left: px(5), width: px(5), height: px(8), background: '#34495E', borderRadius: '50% 50% 0 0' }} />
        <div style={{ position: 'absolute', top: px(34), left: px(5), width: px(5), height: px(3), background: '#2C3E50', borderRadius: 2 }} />
        <div style={{ position: 'absolute', top: px(30), left: px(6), width: px(1), height: px(1), background: '#BDC3C7', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', top: px(30), left: px(8), width: px(1), height: px(1), background: '#BDC3C7', borderRadius: '50%' }} />

        <div style={{ position: 'absolute', top: px(31), left: px(4), width: px(7), height: px(2), background: '#95A5A6' }} />
      </div>
    </div>
  )
}

interface AddBookModalProps {
  onClose: () => void
}

const AddBookModal: React.FC<AddBookModalProps> = ({ onClose }) => {
  const addBook = useBookStore(state => state.addBook)
  const [form, setForm] = useState({
    title: '',
    author: '',
    publishYear: new Date().getFullYear(),
    review: '',
    status: 'available' as Book['status']
  })

  const handleSubmit = () => {
    if (!form.title.trim() || !form.author.trim()) return
    addBook(form)
    onClose()
  }

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: '#00000040',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.3s ease-out'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#FFFEF5',
          borderRadius: 12,
          width: '100%',
          maxWidth: 440,
          padding: 28,
          animation: 'modalIn 0.3s ease-out',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}
      >
        <h2 style={{ fontSize: 20, fontWeight: 700, color: '#3E2723', marginBottom: 20, textAlign: 'center' }}>
          📚 录入新书
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#5D4037', marginBottom: 6 }}>书名 *</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="请输入书名"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid #D4C9A3',
                background: '#FFFEF5',
                fontSize: 14,
                color: '#3E2723',
                outline: 'none'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#5D4037', marginBottom: 6 }}>作者 *</label>
            <input
              type="text"
              value={form.author}
              onChange={(e) => setForm({ ...form, author: e.target.value })}
              placeholder="请输入作者"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid #D4C9A3',
                background: '#FFFEF5',
                fontSize: 14,
                color: '#3E2723',
                outline: 'none'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#5D4037', marginBottom: 6 }}>出版年份</label>
              <input
                type="number"
                value={form.publishYear}
                onChange={(e) => setForm({ ...form, publishYear: parseInt(e.target.value) || 0 })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid #D4C9A3',
                  background: '#FFFEF5',
                  fontSize: 14,
                  color: '#3E2723',
                  outline: 'none'
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#5D4037', marginBottom: 6 }}>状态</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as Book['status'] })}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  borderRadius: 6,
                  border: '1px solid #D4C9A3',
                  background: '#FFFEF5',
                  fontSize: 14,
                  color: '#3E2723',
                  outline: 'none'
                }}
              >
                <option value="available">{getStatusLabel('available')}</option>
                <option value="borrowed">{getStatusLabel('borrowed')}</option>
                <option value="exchanged">{getStatusLabel('exchanged')}</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, color: '#5D4037', marginBottom: 6 }}>简评</label>
            <textarea
              value={form.review}
              onChange={(e) => setForm({ ...form, review: e.target.value })}
              placeholder="写点什么吧..."
              style={{
                width: '100%',
                minHeight: 80,
                padding: '10px 12px',
                borderRadius: 6,
                border: '1px solid #D4C9A3',
                background: '#FFFEF5',
                fontSize: 14,
                color: '#3E2723',
                resize: 'vertical',
                outline: 'none',
                fontFamily: 'inherit'
              }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '10px 20px',
              borderRadius: 50,
              border: '1px solid #D4C9A3',
              background: 'transparent',
              color: '#5D4037',
              fontSize: 14,
              cursor: 'pointer',
              transition: 'background 0.2s ease'
            }}
          >
            取消
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim() || !form.author.trim()}
            style={{
              flex: 1,
              padding: '10px 20px',
              borderRadius: 50,
              border: 'none',
              background: form.title.trim() && form.author.trim() ? '#8B4513' : '#ccc',
              color: '#fff',
              fontSize: 14,
              cursor: form.title.trim() && form.author.trim() ? 'pointer' : 'not-allowed',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => {
              if (form.title.trim() && form.author.trim()) {
                e.currentTarget.style.background = '#A0522D'
              }
            }}
            onMouseLeave={(e) => {
              if (form.title.trim() && form.author.trim()) {
                e.currentTarget.style.background = '#8B4513'
              }
            }}
          >
            录入
          </button>
        </div>
      </div>
    </div>
  )
}

const VirtualScrollGrid: React.FC<{
  books: Book[]
  onCardClick: (book: Book) => void
}> = ({ books, onCardClick }) => {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scrollTop, setScrollTop] = useState(0)
  const [viewportHeight, setViewportHeight] = useState(600)
  const [containerWidth, setContainerWidth] = useState(900)

  const CARD_WIDTH = 260
  const CARD_HEIGHT = 340
  const GAP = 20
  const BUFFER = 2

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const update = () => {
      setViewportHeight(container.clientHeight)
      setContainerWidth(container.clientWidth)
    }
    update()

    const observer = new ResizeObserver(update)
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const columns = Math.max(1, Math.floor((containerWidth + GAP) / (CARD_WIDTH + GAP)))
  const rows = Math.ceil(books.length / columns)

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }, [])

  const visibleBooks = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / (CARD_HEIGHT + GAP)) - BUFFER)
    const endRow = Math.min(rows, Math.ceil((scrollTop + viewportHeight) / (CARD_HEIGHT + GAP)) + BUFFER)
    const startIdx = startRow * columns
    const endIdx = Math.min(books.length, endRow * columns)

    return books.slice(startIdx, endIdx).map((book, i) => {
      const globalIdx = startIdx + i
      const col = globalIdx % columns
      const row = Math.floor(globalIdx / columns)
      return {
        book,
        style: {
          position: 'absolute' as const,
          top: row * (CARD_HEIGHT + GAP),
          left: col * (CARD_WIDTH + GAP),
          width: CARD_WIDTH
        }
      }
    })
  }, [books, scrollTop, viewportHeight, columns, rows])

  const totalHeight = rows * (CARD_HEIGHT + GAP)
  const totalWidth = columns * (CARD_WIDTH + GAP) - GAP

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        width: '100%',
        height: 'calc(100vh - 380px)',
        minHeight: 400,
        overflowY: 'auto',
        position: 'relative',
        padding: 10
      }}
    >
      <div
        style={{
          position: 'relative',
          width: totalWidth,
          height: totalHeight,
          margin: '0 auto'
        }}
      >
        {visibleBooks.map(({ book, style }) => (
          <BookCard
            key={book.id}
            book={book}
            onClick={() => onCardClick(book)}
            style={style}
          />
        ))}
      </div>
    </div>
  )
}

const App: React.FC = () => {
  const books = useBookStore(state => state.books)
  const selectedBookId = useBookStore(state => state.selectedBookId)
  const isExploreMode = useBookStore(state => state.isExploreMode)
  const isAddModalOpen = useBookStore(state => state.isAddModalOpen)
  const selectBook = useBookStore(state => state.selectBook)
  const toggleExploreMode = useBookStore(state => state.toggleExploreMode)
  const setAddModalOpen = useBookStore(state => state.setAddModalOpen)

  const selectedBook = books.find(b => b.id === selectedBookId) || null

  return (
    <div style={{ minHeight: '100vh', background: '#FDF6E3' }}>
      <div style={{ padding: '24px 16px', maxWidth: 1200, margin: '0 auto' }}>
        <PixelBanner />

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1
            style={{
              fontSize: 36,
              fontWeight: 700,
              color: '#8B4513',
              marginBottom: 4,
              fontFamily: "'Noto Serif SC', serif",
              letterSpacing: 4
            }}
          >
            巷陌书摊
          </h1>
          <p style={{ color: '#5D4037', opacity: 0.7, fontFamily: "'Caveat', cursive", fontSize: 20 }}>
            每一本旧书，都藏着一段时光的故事
          </p>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
          <button
            onClick={() => setAddModalOpen(true)}
            style={{
              padding: '10px 28px',
              borderRadius: 50,
              border: 'none',
              background: '#8B4513',
              color: '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#A0522D')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#8B4513')}
          >
            <span>＋</span> 录入新书
          </button>

          <button
            onClick={toggleExploreMode}
            style={{
              padding: '10px 28px',
              borderRadius: 50,
              border: isExploreMode ? '2px solid #8B4513' : 'none',
              background: isExploreMode ? 'transparent' : '#8B4513',
              color: isExploreMode ? '#8B4513' : '#fff',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
            onMouseEnter={(e) => {
              if (!isExploreMode) e.currentTarget.style.background = '#A0522D'
            }}
            onMouseLeave={(e) => {
              if (!isExploreMode) e.currentTarget.style.background = '#8B4513'
            }}
          >
            <span>🔍</span> {isExploreMode ? '返回书架' : '翻找书摊'}
          </button>

          <div
            style={{
              padding: '10px 20px',
              borderRadius: 50,
              background: '#FFFEF5',
              border: '1px solid #D4C9A3',
              fontSize: 13,
              color: '#5D4037',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <span>📚</span> 共 {books.length} 本藏书
          </div>
        </div>

        {isExploreMode ? (
          <ExploreMode books={books} onCardClick={(book) => selectBook(book.id)} />
        ) : (
          <VirtualScrollGrid books={books} onCardClick={(book) => selectBook(book.id)} />
        )}

        {!isExploreMode && books.length === 0 && (
          <div style={{ textAlign: 'center', padding: 60, color: '#999' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📖</div>
            <p style={{ fontSize: 16 }}>书摊还空空的，点击"录入新书"开始你的收藏吧～</p>
          </div>
        )}
      </div>

      {selectedBook && (
        <BookDetail book={selectedBook} onClose={() => selectBook(null)} />
      )}

      {isAddModalOpen && (
        <AddBookModal onClose={() => setAddModalOpen(false)} />
      )}
    </div>
  )
}

export default App
