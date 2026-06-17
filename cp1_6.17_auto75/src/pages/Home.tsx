import { useState } from 'react'
import BookShelf from '../components/BookShelf'
import BorrowWall from '../components/BorrowWall'
import SearchBar from '../components/SearchBar'
import ScanModal from '../components/ScanModal'
import { useBookStore } from '../store/bookStore'

export default function Home() {
  const [showScanModal, setShowScanModal] = useState(false)
  const selectedBook = useBookStore((s) => s.selectedBook)
  const setSelectedBook = useBookStore((s) => s.setSelectedBook)
  const addBook = useBookStore((s) => s.addBook)

  const handleScanSuccess = async (isbn: string, title?: string, author?: string) => {
    await addBook({
      isbn,
      title: title || `书籍-${isbn.slice(-4)}`,
      author: author || '未知作者',
    })
    setShowScanModal(false)
  }

  return (
    <div className="app-container">
      <SearchBar onScanClick={() => setShowScanModal(true)} />

      <div className="main-layout">
        <BookShelf />
        <BorrowWall />
      </div>

      {showScanModal && (
        <ScanModal
          onClose={() => setShowScanModal(false)}
          onSuccess={handleScanSuccess}
        />
      )}

      {selectedBook && (
        <BookDetailModal />
      )}
    </div>
  )
}

function BookDetailModal() {
  const selectedBook = useBookStore((s) => s.selectedBook)
  const setSelectedBook = useBookStore((s) => s.setSelectedBook)
  const toggleBorrow = useBookStore((s) => s.toggleBorrow)
  const [flippingId, setFlippingId] = useState<string | null>(null)

  if (!selectedBook) return null

  const handleToggle = async () => {
    setFlippingId(selectedBook.id)
    await toggleBorrow(selectedBook.id)
    setTimeout(() => setFlippingId(null), 400)
  }

  const formatTime = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div className="modal-overlay" onClick={() => setSelectedBook(null)}>
      <div
        className={`modal-content ${flippingId ? 'flipping' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title">书籍详情</div>
          <button className="modal-close" onClick={() => setSelectedBook(null)}>
            ×
          </button>
        </div>

        <div className="modal-body">
          <div className="detail-section">
            <div className="detail-label">书名</div>
            <div className="detail-value title">{selectedBook.title}</div>
          </div>

          <div className="detail-section">
            <div className="detail-label">作者</div>
            <div className="detail-value">{selectedBook.author}</div>
          </div>

          {selectedBook.isbn && (
            <div className="detail-section">
              <div className="detail-label">ISBN</div>
              <div className="detail-value">{selectedBook.isbn}</div>
            </div>
          )}

          <div className="detail-section">
            <div className="detail-label">当前状态</div>
            <div className="detail-value">
              <span className={`status-badge ${selectedBook.status}`}>
                {selectedBook.status === 'available' ? '在架' : '借出'}
              </span>
            </div>
          </div>

          {selectedBook.currentBorrower && (
            <div className="detail-section">
              <div className="detail-label">借阅者</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="borrower-avatar">
                  <img src={selectedBook.currentBorrower.avatar} alt="" />
                </div>
                <span>{selectedBook.currentBorrower.name}</span>
              </div>
            </div>
          )}

          <div className="detail-section">
            <div className="detail-label">借阅历史</div>
            {selectedBook.borrowHistory.length === 0 ? (
              <div className="detail-value" style={{ color: 'var(--text-light)' }}>
                暂无借阅记录
              </div>
            ) : (
              <div className="timeline">
                {selectedBook.borrowHistory.map((record, index) => (
                  <div
                    key={record.id}
                    className="timeline-item"
                    style={{ animationDelay: `${index * 0.08}s` }}
                  >
                    <div className="timeline-content">
                      <div className={`timeline-type ${record.type}`}>
                        {record.type === 'borrow' ? '📤 借出' : '📥 归还'}
                      </div>
                      <div className="timeline-borrower">
                        <div
                          className="borrower-avatar"
                          style={{ width: 24, height: 24 }}
                        >
                          <img src={record.borrowerAvatar} alt="" />
                        </div>
                        <span>{record.borrowerName}</span>
                      </div>
                      <div className="timeline-time">{formatTime(record.timestamp)}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button
            className="action-btn secondary"
            onClick={() => setSelectedBook(null)}
          >
            关闭
          </button>
          <button
            className={`action-btn ${selectedBook.status === 'available' ? 'borrow' : 'return'}`}
            onClick={handleToggle}
          >
            {selectedBook.status === 'available' ? '📤 借出' : '📥 归还'}
          </button>
        </div>
      </div>
    </div>
  )
}
