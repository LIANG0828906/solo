import { useState } from 'react'
import { motion } from 'framer-motion'
import { Book, useBookStore } from './store'

interface BookDetailProps {
  book: Book
  onClose: () => void
}

function BookDetail({ book, onClose }: BookDetailProps) {
  const { borrowBook } = useBookStore()
  const [showBorrowForm, setShowBorrowForm] = useState(false)
  const [borrowerName, setBorrowerName] = useState('')
  const [borrowerEmail, setBorrowerEmail] = useState('')
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({})

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return `${date.getMonth() + 1}/${date.getDate()}`
  }

  const handleBorrowClick = () => {
    setShowBorrowForm(true)
  }

  const validateForm = () => {
    const newErrors: { name?: string; email?: string } = {}
    if (!borrowerName.trim()) {
      newErrors.name = '请输入借阅者姓名'
    }
    if (!borrowerEmail.trim()) {
      newErrors.email = '请输入邮箱地址'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(borrowerEmail)) {
      newErrors.email = '请输入有效的邮箱地址'
    }
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      borrowBook(book.id, borrowerName.trim(), borrowerEmail.trim())
    }
  }

  const handleCancel = () => {
    setShowBorrowForm(false)
    setBorrowerName('')
    setBorrowerEmail('')
    setErrors({})
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  const recentHistory = book.borrowHistory.slice(0, 5)

  return (
    <motion.div
      className="modal-overlay"
      onClick={handleOverlayClick}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="modal-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="modal-close-btn"
          onClick={onClose}
          aria-label="关闭"
        >
          ×
        </button>

        <div className="detail-header">
          <img
            src={book.coverUrl}
            alt={book.title}
            className="detail-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = `https://picsum.photos/seed/${book.id}/300/450`
            }}
          />
          <div className="detail-info">
            <h2 className="detail-title">{book.title}</h2>
            <p className="detail-author">作者：{book.author}</p>
            <span className={`detail-status ${book.status}`}>
              {book.status === 'available' ? '可借阅' : '借出中'}
            </span>
            {book.dueDate && (
              <p className="detail-due-date">预计归还：{book.dueDate}</p>
            )}
            <p className="detail-donor">捐赠者：{book.donor}</p>
          </div>
        </div>

        <div className="detail-description">
          <h3 className="detail-section-title">内容简介</h3>
          <p>{book.description}</p>
        </div>

        <div>
          <h3 className="detail-section-title">借阅记录</h3>
          {recentHistory.length > 0 ? (
            <div className="borrow-history">
              {recentHistory.map((record) => (
                <div key={record.id} className="borrow-history-item">
                  <img
                    src={record.avatar}
                    alt={record.borrowerName}
                    className="borrow-history-avatar"
                  />
                  <span className="borrow-history-name">
                    {record.borrowerName}
                  </span>
                  <span className="borrow-history-date">
                    {formatDate(record.borrowDate)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="no-history">暂无借阅记录</p>
          )}
        </div>

        {!showBorrowForm ? (
          <button
            className="borrow-btn"
            onClick={handleBorrowClick}
            disabled={book.status === 'borrowed'}
          >
            {book.status === 'available' ? '借阅这本书' : '已被借出'}
          </button>
        ) : (
          <form className="borrow-form" onSubmit={handleSubmit}>
            <h3 className="detail-section-title">确认借阅</h3>
            <div className="form-group">
              <label className="form-label">借阅者姓名 *</label>
              <input
                type="text"
                className="form-input"
                value={borrowerName}
                onChange={(e) => setBorrowerName(e.target.value)}
                placeholder="请输入您的姓名"
              />
              {errors.name && (
                <div style={{ color: '#E53935', fontSize: '12px', marginTop: '4px' }}>
                  {errors.name}
                </div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">邮箱 *</label>
              <input
                type="email"
                className="form-input"
                value={borrowerEmail}
                onChange={(e) => setBorrowerEmail(e.target.value)}
                placeholder="请输入您的邮箱"
              />
              {errors.email && (
                <div style={{ color: '#E53935', fontSize: '12px', marginTop: '4px' }}>
                  {errors.email}
                </div>
              )}
            </div>
            <div className="form-actions">
              <button
                type="button"
                className="btn-cancel"
                onClick={handleCancel}
              >
                取消
              </button>
              <button type="submit" className="btn-submit">
                确认借阅
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </motion.div>
  )
}

export default BookDetail
