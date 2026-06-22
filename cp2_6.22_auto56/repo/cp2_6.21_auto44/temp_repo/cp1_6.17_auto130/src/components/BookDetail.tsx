import React, { useState, useEffect } from 'react'
import { Book, useBookStore, getCoverColor, getStatusLabel, getRandomAvatar, AVATAR_LIST } from '../stores/bookStore'

interface BookDetailProps {
  book: Book
  onClose: () => void
}

const BookDetail: React.FC<BookDetailProps> = ({ book, onClose }) => {
  const [isNoteExpanded, setIsNoteExpanded] = useState(!!book.ownerNote)
  const [ownerNote, setOwnerNote] = useState(book.ownerNote || '')
  const [newMessage, setNewMessage] = useState('')
  const [newRating, setNewRating] = useState(5)
  const [selectedAvatar, setSelectedAvatar] = useState(getRandomAvatar())
  const [isVisible, setIsVisible] = useState(false)

  const updateBook = useBookStore(state => state.updateBook)
  const addMessage = useBookStore(state => state.addMessage)

  const coverColor = getCoverColor(book.publishYear)

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true))
  }, [])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const handleClose = () => {
    setIsVisible(false)
    setTimeout(onClose, 300)
  }

  const handleSaveNote = () => {
    updateBook(book.id, { ownerNote })
  }

  const handleSubmitMessage = () => {
    if (!newMessage.trim()) return
    addMessage(book.id, {
      content: newMessage.trim(),
      rating: newRating,
      avatar: selectedAvatar
    })
    setNewMessage('')
    setNewRating(5)
    setSelectedAvatar(getRandomAvatar())
  }

  const handleStatusChange = (status: Book['status']) => {
    updateBook(book.id, { status })
  }

  const formatTime = (ts: number) => {
    const date = new Date(ts)
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`
  }

  return (
    <div
      onClick={handleClose}
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
          maxWidth: 560,
          maxHeight: '85vh',
          overflowY: 'auto',
          animation: isVisible ? 'modalIn 0.3s ease-out forwards' : 'modalIn 0.3s ease-out reverse forwards',
          transformOrigin: 'center center',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
        }}
      >
        <div
          style={{
            height: 200,
            background: `linear-gradient(135deg, ${coverColor} 0%, ${coverColor}cc 100%)`,
            borderRadius: '12px 12px 0 0',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
        >
          <button
            onClick={handleClose}
            style={{
              position: 'absolute',
              top: 16,
              right: 16,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: 'none',
              background: 'rgba(255,255,255,0.25)',
              color: '#fff',
              fontSize: 18,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s ease'
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.4)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.25)')}
          >
            ✕
          </button>
          <div style={{ textAlign: 'center', color: '#FFFEF5' }}>
            <div style={{ fontSize: 72, fontWeight: 700, textShadow: '2px 2px 8px rgba(0,0,0,0.3)' }}>
              {book.title.charAt(0)}
            </div>
          </div>
        </div>

        <div style={{ padding: 24 }}>
          <div style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 24, fontWeight: 700, color: '#3E2723', marginBottom: 8 }}>
              {book.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 14, color: '#5D4037' }}>{book.author}</span>
              <span style={{ color: '#D4C9A3' }}>|</span>
              <span style={{ fontSize: 14, color: '#5D4037' }}>{book.publishYear}年出版</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {(['available', 'borrowed', 'exchanged'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => handleStatusChange(s)}
                  style={{
                    padding: '4px 14px',
                    borderRadius: 20,
                    border: book.status === s ? 'none' : '1px solid #D4C9A3',
                    background: book.status === s
                      ? (s === 'available' ? '#4CAF50' : s === 'borrowed' ? '#FF9800' : '#9E9E9E')
                      : 'transparent',
                    color: book.status === s ? '#fff' : '#5D4037',
                    fontSize: 13,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                >
                  {getStatusLabel(s)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 20, padding: 16, background: '#FDF6E3', borderRadius: 8 }}>
            <div style={{ fontSize: 12, color: '#8B4513', marginBottom: 6, fontWeight: 600 }}>📝 简评</div>
            <p style={{ fontSize: 14, color: '#5D4037', lineHeight: 1.7 }}>
              {book.review}
            </p>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div
              onClick={() => setIsNoteExpanded(!isNoteExpanded)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                cursor: 'pointer',
                padding: '12px 0',
                borderTop: '1px solid #D4C9A3',
                borderBottom: isNoteExpanded ? 'none' : '1px solid #D4C9A3',
                userSelect: 'none'
              }}
            >
              <span style={{ fontSize: 14, fontWeight: 600, color: '#8B4513' }}>
                📖 摊主手记 {ownerNote && <span style={{ color: '#999', fontWeight: 400, fontSize: 12 }}>({ownerNote.length}字)</span>}
              </span>
              <span style={{ fontSize: 12, color: '#8B4513', transition: 'transform 0.2s ease', transform: isNoteExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                ▼
              </span>
            </div>
            {isNoteExpanded && (
              <div style={{ paddingBottom: 12, borderBottom: '1px solid #D4C9A3', animation: 'fadeIn 0.2s ease' }}>
                <textarea
                  value={ownerNote}
                  onChange={(e) => setOwnerNote(e.target.value)}
                  onBlur={handleSaveNote}
                  placeholder="记录这本书的故事..."
                  style={{
                    width: '100%',
                    minHeight: 100,
                    padding: 12,
                    borderRadius: 6,
                    border: '1px solid #D4C9A3',
                    background: '#FFFEF5',
                    color: '#3E2723',
                    fontFamily: "'Caveat', cursive",
                    fontSize: 18,
                    lineHeight: 1.6,
                    resize: 'vertical',
                    outline: 'none'
                  }}
                />
                <div style={{ textAlign: 'right', marginTop: 8 }}>
                  <button
                    onClick={handleSaveNote}
                    style={{
                      padding: '6px 16px',
                      borderRadius: 20,
                      border: 'none',
                      background: '#8B4513',
                      color: '#fff',
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'background 0.2s ease'
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = '#A0522D')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '#8B4513')}
                  >
                    保存手记
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#8B4513', marginBottom: 16 }}>
              💬 访客留言 ({book.messages.length})
            </div>

            <div style={{ marginBottom: 20, padding: 16, background: '#FDF6E3', borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#5D4037' }}>选择头像：</span>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {AVATAR_LIST.map(a => (
                    <button
                      key={a}
                      onClick={() => setSelectedAvatar(a)}
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: '50%',
                        border: selectedAvatar === a ? '2px solid #8B4513' : '2px solid transparent',
                        background: '#FFFEF5',
                        fontSize: 16,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {a}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 12, color: '#5D4037' }}>评分：</span>
                {[1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setNewRating(n)}
                    style={{
                      background: 'none',
                      border: 'none',
                      fontSize: 20,
                      cursor: 'pointer',
                      padding: 0,
                      opacity: n <= newRating ? 1 : 0.3
                    }}
                  >
                    ⭐
                  </button>
                ))}
              </div>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="留下你的手札..."
                style={{
                  width: '100%',
                  minHeight: 60,
                  padding: 10,
                  borderRadius: 6,
                  border: '1px solid #D4C9A3',
                  background: '#FFFEF5',
                  fontSize: 16,
                  color: '#5D4037',
                  fontFamily: "'Caveat', cursive",
                  resize: 'vertical',
                  outline: 'none',
                  marginBottom: 10
                }}
              />
              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={handleSubmitMessage}
                  disabled={!newMessage.trim()}
                  style={{
                    padding: '6px 20px',
                    borderRadius: 20,
                    border: 'none',
                    background: newMessage.trim() ? '#8B4513' : '#ccc',
                    color: '#fff',
                    fontSize: 13,
                    cursor: newMessage.trim() ? 'pointer' : 'not-allowed',
                    transition: 'background 0.2s ease'
                  }}
                >
                  留言
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxHeight: 260, overflowY: 'auto' }}>
              {book.messages.length === 0 && (
                <div style={{ textAlign: 'center', padding: 30, color: '#999', fontSize: 13 }}>
                  还没有人留言，成为第一个吧～
                </div>
              )}
              {book.messages.map(msg => (
                <div key={msg.id} style={{ display: 'flex', gap: 10 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: '#FDF6E3',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 22,
                      flexShrink: 0,
                      border: '1px solid #D4C9A3'
                    }}
                  >
                    {msg.avatar}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                      <span style={{ fontSize: 14, color: '#FFD700' }}>
                        {'⭐'.repeat(msg.rating)}
                      </span>
                      <span style={{ fontSize: 11, color: '#999' }}>{formatTime(msg.timestamp)}</span>
                    </div>
                    <p
                      style={{
                        fontFamily: "'Caveat', cursive",
                        fontSize: 18,
                        color: '#5D4037',
                        lineHeight: 1.5
                      }}
                    >
                      {msg.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookDetail
