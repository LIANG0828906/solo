import React, { useState } from 'react'
import { useProjectStore } from '../../store/projectStore'

const EMOJIS = ['👍', '❤️', '🔧', '💡', '❓']

export const CommentBubble: React.FC<{ versionId: string }> = ({ versionId }) => {
  const comments = useProjectStore((s) => s.comments[versionId] || [])
  const addComment = useProjectStore((s) => s.addComment)
  const deleteComment = useProjectStore((s) => s.deleteComment)
  const [inputValue, setInputValue] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState('')
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  const currentUserId = 'user-1'

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
  }

  const handleEmojiClick = (emoji: string) => {
    setSelectedEmoji(selectedEmoji === emoji ? '' : emoji)
  }

  const handleDelete = (commentId: string) => {
    deleteComment(commentId, versionId)
    setDeleteConfirmId(null)
  }

  const sortedComments = [...comments].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt)
  )

  return (
    <div className="comment-section">
      <div className="emoji-bar">
        {EMOJIS.map((emoji) => (
          <button
            key={emoji}
            className={`emoji-btn ${selectedEmoji === emoji ? 'active' : ''}`}
            onClick={() => handleEmojiClick(emoji)}
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
