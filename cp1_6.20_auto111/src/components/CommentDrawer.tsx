import React, { useState, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { loadComments, addComment } from '@/store/poemStore'
import type { RootState, AppDispatch } from '@/store/poemStore'
import type { Comment } from '@/types'

interface CommentDrawerProps {
  isOpen: boolean
  onClose: () => void
  poemId: string
}

const CommentDrawer: React.FC<CommentDrawerProps> = ({ isOpen, onClose, poemId }) => {
  const dispatch = useDispatch<AppDispatch>()
  const comments = useSelector((state: RootState) => state.poem.comments)
  const [author, setAuthor] = useState('')
  const [content, setContent] = useState('')

  useEffect(() => {
    if (isOpen && poemId) {
      dispatch(loadComments(poemId))
    }
  }, [isOpen, poemId, dispatch])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!author.trim() || !content.trim()) return

    const mentionRegex = /@(\S+)/g
    const mentions: string[] = []
    let match
    while ((match = mentionRegex.exec(content)) !== null) {
      mentions.push(match[1])
    }

    dispatch(addComment({
      poemId,
      author: author.trim(),
      content: content.trim(),
      mentions,
    }))

    setContent('')
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const renderContentWithMentions = (content: string) => {
    const parts = content.split(/(@\S+)/g)
    return parts.map((part, index) => {
      if (part.startsWith('@')) {
        return (
          <span key={index} style={mentionStyle}>
            {part}
          </span>
        )
      }
      return part
    })
  }

  return (
    <>
      <div
        style={{
          ...overlayStyle,
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
        onClick={onClose}
      />
      <div
        style={{
          ...drawerStyle,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
        }}
      >
        <div style={headerStyle}>
          <h3 style={titleStyle}>评论</h3>
          <button onClick={onClose} style={closeButtonStyle}>
            ✕
          </button>
        </div>

        <div style={commentsListStyle}>
          {comments.length === 0 ? (
            <p style={emptyStyle}>暂无评论，来发表第一条评论吧</p>
          ) : (
            comments.map((comment: Comment) => (
              <div key={comment.id} style={commentItemStyle}>
                <div style={commentHeaderStyle}>
                  <span style={authorStyle}>{comment.author}</span>
                  <span style={dateStyle}>{formatDate(comment.createdAt)}</span>
                </div>
                <p style={contentStyle}>{renderContentWithMentions(comment.content)}</p>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmit} style={formStyle}>
          <input
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            placeholder="你的昵称"
            style={inputStyle}
          />
          <div style={textareaContainerStyle}>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="写下你的评论... 使用@提及其他用户"
              style={textareaStyle}
              rows={3}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={submitButtonStyle}>
            发表评论
          </button>
        </form>
      </div>
    </>
  )
}

const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  transition: 'opacity 0.3s ease-in-out',
  zIndex: 1000,
}

const drawerStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  right: 0,
  width: 400,
  maxWidth: '100vw',
  height: '100vh',
  backgroundColor: 'var(--bg-secondary)',
  boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.15)',
  transition: 'transform 0.2s ease-in-out',
  zIndex: 1001,
  display: 'flex',
  flexDirection: 'column',
}

const headerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '20px 24px',
  borderBottom: '1px solid var(--border)',
}

const titleStyle: React.CSSProperties = {
  fontSize: 18,
  fontWeight: 600,
  color: 'var(--text-primary)',
  margin: 0,
}

const closeButtonStyle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 6,
  border: 'none',
  backgroundColor: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 18,
  cursor: 'pointer',
  transition: 'all 0.2s ease',
}

const commentsListStyle: React.CSSProperties = {
  flex: 1,
  overflowY: 'auto',
  padding: 24,
  display: 'flex',
  flexDirection: 'column',
  gap: 20,
}

const emptyStyle: React.CSSProperties = {
  textAlign: 'center',
  color: 'var(--text-secondary)',
  fontSize: 14,
  padding: 40,
}

const commentItemStyle: React.CSSProperties = {
  padding: 16,
  backgroundColor: 'var(--bg-primary)',
  borderRadius: 10,
  transition: 'all 0.2s ease',
}

const commentHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: 8,
}

const authorStyle: React.CSSProperties = {
  fontWeight: 600,
  color: 'var(--accent)',
  fontSize: 14,
}

const dateStyle: React.CSSProperties = {
  fontSize: 12,
  color: 'var(--text-secondary)',
}

const contentStyle: React.CSSProperties = {
  fontSize: 14,
  lineHeight: 1.7,
  color: 'var(--text-primary)',
  margin: 0,
}

const mentionStyle: React.CSSProperties = {
  color: 'var(--accent)',
  fontWeight: 500,
}

const formStyle: React.CSSProperties = {
  padding: 20,
  borderTop: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
}

const inputStyle: React.CSSProperties = {
  padding: '10px 14px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  outline: 'none',
  transition: 'border-color 0.2s ease',
}

const textareaContainerStyle: React.CSSProperties = {
  position: 'relative',
}

const textareaStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 14px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: 14,
  fontFamily: 'inherit',
  backgroundColor: 'var(--bg-primary)',
  color: 'var(--text-primary)',
  outline: 'none',
  resize: 'vertical',
  transition: 'border-color 0.2s ease',
}

const submitButtonStyle: React.CSSProperties = {
  alignSelf: 'flex-end',
}

export default CommentDrawer
