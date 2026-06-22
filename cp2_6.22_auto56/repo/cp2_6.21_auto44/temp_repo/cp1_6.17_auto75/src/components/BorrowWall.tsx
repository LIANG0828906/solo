import { useState, useMemo } from 'react'
import { useBookStore } from '../store/bookStore'
import { useShallow } from 'zustand/react/shallow'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts'
import type { Book } from '../types'

const COLORS = ['#27AE60', '#E74C3C']

export default function BorrowWall() {
  const { books, getFilteredBooks, setSelectedBook, toggleBorrow } = useBookStore(
    useShallow((state) => ({
      books: state.books,
      getFilteredBooks: state.getFilteredBooks,
      setSelectedBook: state.setSelectedBook,
      toggleBorrow: state.toggleBorrow,
    }))
  )
  const filteredBooks = getFilteredBooks()
  const [flippingIds, setFlippingIds] = useState<Set<string>>(new Set())

  const stats = useMemo(() => {
    const total = books.length
    const borrowed = books.filter((b) => b.status === 'borrowed').length
    const available = total - borrowed

    const monthCount: Record<string, number> = {}
    books.forEach((book) => {
      book.borrowHistory.forEach((r) => {
        if (r.type === 'borrow') {
          const d = new Date(r.timestamp)
          const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
          monthCount[key] = (monthCount[key] || 0) + 1
        }
      })
    })
    const monthlyData = Object.entries(monthCount)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([month, count]) => ({ month, count }))

    return { total, available, borrowed, monthlyData }
  }, [books])

  const pieData = [
    { name: '在架', value: stats.available },
    { name: '借出', value: stats.borrowed },
  ]

  const handleCardClick = (book: Book, e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('[data-action]')) return
    setSelectedBook(book)
  }

  const handleToggle = async (book: Book, e: React.MouseEvent) => {
    e.stopPropagation()
    setFlippingIds((prev) => new Set(prev).add(book.id))
    await toggleBorrow(book.id)
    setTimeout(() => {
      setFlippingIds((prev) => {
        const next = new Set(prev)
        next.delete(book.id)
        return next
      })
    }, 400)
  }

  return (
    <main className="borrow-wall">
      <div className="wall-header">
        <div className="wall-title">📖 借阅墙</div>
        <div className="stats-chart">
          <div className="stat-item">
            <div className="stat-dot total" />
            <div>
              <div className="stat-label">总数</div>
              <div className="stat-value">{stats.total}</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-dot available" />
            <div>
              <div className="stat-label">在架</div>
              <div className="stat-value">{stats.available}</div>
            </div>
          </div>
          <div className="stat-item">
            <div className="stat-dot borrowed" />
            <div>
              <div className="stat-label">借出</div>
              <div className="stat-value">{stats.borrowed}</div>
            </div>
          </div>
          {stats.total > 0 && (
            <div style={{ width: 140, height: 80 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    innerRadius={20}
                    outerRadius={35}
                    paddingAngle={2}
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>

      {stats.monthlyData.length > 0 && (
        <div
          style={{
            background: 'white',
            borderRadius: 8,
            padding: 16,
            marginBottom: 24,
            boxShadow: '0 2px 8px var(--shadow-light)',
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 8, color: 'var(--text-dark)' }}>
            📊 近6月借阅趋势
          </div>
          <div style={{ width: '100%', height: 140 }}>
            <ResponsiveContainer>
              <BarChart data={stats.monthlyData}>
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="#7F8C8D" />
                <YAxis tick={{ fontSize: 11 }} stroke="#7F8C8D" allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#E67E22" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {filteredBooks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📚</div>
          <div className="empty-state-text">没有找到匹配的书籍</div>
        </div>
      ) : (
        <div className="books-grid">
          {filteredBooks.map((book) => (
            <div
              key={book.id}
              className={`book-card ${flippingIds.has(book.id) ? 'flipping' : ''}`}
              onClick={(e) => handleCardClick(book, e)}
            >
              <div className="book-card-title">{book.title}</div>
              <div className="book-card-author">作者：{book.author}</div>
              {book.isbn && (
                <div style={{ fontSize: 12, color: 'var(--text-light)' }}>ISBN: {book.isbn}</div>
              )}
              <div className="book-card-footer">
                <span className={`status-badge ${book.status}`}>
                  {book.status === 'available' ? '📚 在架' : '📤 借出'}
                </span>
                {book.currentBorrower ? (
                  <div
                    title={book.currentBorrower.name}
                    style={{ display: 'flex', alignItems: 'center', gap: 6 }}
                  >
                    <span style={{ fontSize: 12, color: 'var(--text-light)' }}>
                      {book.currentBorrower.name}
                    </span>
                    <div className="borrower-avatar">
                      <img src={book.currentBorrower.avatar} alt="" />
                    </div>
                  </div>
                ) : (
                  <button
                    data-action
                    className={`action-btn ${book.status === 'available' ? 'borrow' : 'return'}`}
                    style={{ padding: '6px 14px', fontSize: 13 }}
                    onClick={(e) => handleToggle(book, e)}
                  >
                    {book.status === 'available' ? '借出' : '归还'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
