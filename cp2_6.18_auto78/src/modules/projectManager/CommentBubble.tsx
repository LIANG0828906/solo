import React, { useState, useRef, useEffect } from 'react'
import { useProjectStore } from '../../store/projectStore'

const EMOJIS = ['👍', '❤️', '🔧', '💡', '❓']

export const CommentBubble: React.FC<{ versionId: string }> = ({ versionId }) => {
  const comments = useProjectStore((s) => s.comments[versionId] || [])
  const addComment = useProjectStore((s) => s.addComment)
  const deleteComment = useProjectStore((s) => s.deleteComment)
  const [inputValue, setInputValue] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [emojiPanelOpen, setEmojiPanelOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const emojiBtnRef = useRef<HTMLButtonElement>(null)
  const emojiPanelRef = useRef<HTMLDivElement>(null)

  const currentUserId = 'user-1'

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        emojiPanelOpen &&
        emojiPanelRef.current &&
        !emojiPanelRef.current.contains(e.target as Node) &&
        emojiBtnRef.current &&
        !emojiBtnRef.current.contains(e.target as Node)
      ) {
        setEmojiPanelOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [emojiPanelOpen])

  const handleSubmit = () => {
    if (!inputValue.trim() && !selectedEmoji) return
    addComment(versionId, {
      authorId: currentUserId,
      authorName: '陈默',
      avatarColor: '#6366F1',
      content: inputValue.trim(),
      emoji: selectedEmoji,
    })
    setInputValue('')
    setSelectedEmoji('')
    setEmojiPanelOpen(false)
  }

  const handleEmojiClick = (emoji: string) => {
    if (selectedEmoji === emoji) {
      setSelectedEmoji('')
    } else {
      setSelectedEmoji(emoji)
      if (!inputValue.trim()) {
        setInputValue(emoji)
      }
    }
    setEmojiPanelOpen(false)
  }

  const handleToggleEmojiPanel = (e: React.MouseEvent) => {
    e.stopPropagation()
    setEmojiPanelOpen(!emojiPanelOpen)
  }

  const handleDelete = (commentId: string) => {
    deleteComment(commentId, versionId)
    setDeleteConfirmId(null)
  }

  const insertEmojiToInput = (emoji: string) => {
    setInputValue((prev) => (prev ? prev + emoji : emoji))
  }

  const sortedComments = [...comments].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )

  return (
    <div className="comment-section">
      <div style={{ position: 'relative', marginBottom: 8 }}>
        <button
          ref={emojiBtnRef}
          type="button"
          className="emoji-btn"
          onClick={handleToggleEmojiPanel}
          aria-label="选择表情"
          title="选择表情"
          style={{
            background: emojiPanelOpen ? 'rgba(245, 158, 11, 0.15)' : undefined,
            borderColor: emojiPanelOpen ? 'var(--accent)' : undefined,
          }}
        >
          😀
        </button>
        <span style={{ fontSize: 12, color: 'var(--text-secondary)', marginLeft: 8 }}>
          {selectedEmoji ? `已选表情: ${selectedEmoji}` : '点击按钮打开表情面板'}
        </span>

        {emojiPanelOpen && (
          <div
            ref={emojiPanelRef}
            style={{
              position: 'absolute',
              top: 40,
              left: 0,
              zIndex: 20,
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-sm)',
              padding: 8,
              display: 'flex',
              gap: 4,
              boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            }}
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="emoji-btn"
                title={emoji}
                style={
                  selectedEmoji === emoji
                    ? { background: 'rgba(245, 158, 11, 0.15)', borderColor: 'var(--accent)' }
                    : {}
                }
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="emoji-bar" style={{ marginBottom: 12 }}>
        {EMOJIS.map((emoji) => (
          <button
            key={`quick-${emoji}`}
            type="button"
            className={`emoji-btn ${selectedEmoji === emoji ? 'active' : ''}`}
            onClick={() => {
              if (selectedEmoji === emoji) {
                setSelectedEmoji('')
              } else {
                setSelectedEmoji(emoji)
                insertEmojiToInput(emoji)
              }
            }}
            aria-label={emoji}
            style={
              selectedEmoji === emoji
                ? { background: 'rgba(245, 158, 11, 0.15)', borderColor: 'var(--accent)' }
                : {}
            }
          >
            {emoji}
          </button>
        ))}
      </div>

      <div className="comment-input-row">
        <input
          className="form-input"
          placeholder="添加评论..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          maxLength={200}
        />
        <button className="btn btn-primary" onClick={handleSubmit}>
          发送
        </button>
      </div>

      {sortedComments.map((comment) => (
        <div key={comment.id} className="comment-bubble">
          <div className="comment-bubble-header">
            <div className="comment-bubble-author">
              <span
                className="avatar-circle"
                style={{
                  background: comment.avatarColor,
                  width: 24,
                  height: 24,
                  fontSize: 10,
                  marginLeft: 0,
                  borderWidth: 0,
                }}
              >
                {comment.authorName.charAt(0)}
              </span>
              <span className="comment-bubble-name">{comment.authorName}</span>
              <span className="comment-bubble-time">{comment.createdAt}</span>
            </div>
            {comment.authorId === currentUserId && (
              deleteConfirmId === comment.id ? (
                <div style={{ display: 'flex', gap: 4 }}>
                  <button
                    className="btn btn-danger"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => handleDelete(comment.id)}
                  >
                    确认
                  </button>
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '2px 8px' }}
                    onClick={() => setDeleteConfirmId(null)}
                  >
                    取消
                  </button>
                </div>
              ) : (
                <button
                  className="comment-delete-btn"
                  onClick={() => setDeleteConfirmId(comment.id)}
                  title="删除评论"
                >
                  ×
                </button>
              )
            )}
          </div>
          <div className="comment-bubble-content">
            {comment.content}
            {comment.emoji && <span className="comment-bubble-emoji">{comment.emoji}</span>}
          </div>
        </div>
      ))}

      {comments.length === 0 && (
        <div style={{ fontSize: 13, color: 'var(--text-secondary)', padding: '8px 0' }}>
          暂无评论
        </div>
      )}
    </div>
  )
}
