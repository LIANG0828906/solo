import { useState, useEffect } from 'react'
import type { Artwork, Comment } from '../types'
import { useExhibitionStore } from '../modules/exhibition/useExhibitionStore'
import { useAuthStore } from '../modules/auth/useAuthStore'

interface ArtworkModalProps {
  artwork: Artwork
  onClose: () => void
  onDelete?: (artworkId: string) => void
  isOwner: boolean
}

export default function ArtworkModal({ artwork, onClose, onDelete, isOwner }: ArtworkModalProps) {
  const { comments, fetchComments, addComment, likeArtwork, likeComment } = useExhibitionStore()
  const { user } = useAuthStore()
  const [newComment, setNewComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [likedArtworks, setLikedArtworks] = useState<Set<string>>(new Set())
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set())

  const artworkComments = comments[artwork.id] || []

  useEffect(() => {
    fetchComments(artwork.id)
    try {
      const la = localStorage.getItem('artvault_liked_artworks')
      setLikedArtworks(new Set(la ? JSON.parse(la) : []))
      const lc = localStorage.getItem('artvault_liked_comments')
      setLikedComments(new Set(lc ? JSON.parse(lc) : []))
    } catch {}
  }, [artwork.id])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = ''
    }
  }, [])

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || newComment.length > 200 || submitting) return
    setSubmitting(true)
    const username = user?.username || '匿名访客'
    await addComment(artwork.id, username, newComment.trim())
    setNewComment('')
    setSubmitting(false)
  }

  const handleLikeArtwork = async () => {
    if (likedArtworks.has(artwork.id)) return
    const success = await likeArtwork(artwork.id)
    if (success) {
      setLikedArtworks(prev => {
        const next = new Set(prev)
        next.add(artwork.id)
        return next
      })
    }
  }

  const handleLikeComment = async (commentId: string) => {
    if (likedComments.has(commentId)) return
    const success = await likeComment(commentId)
    if (success) {
      setLikedComments(prev => {
        const next = new Set(prev)
        next.add(commentId)
        return next
      })
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso)
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`
  }

  const isArtworkLiked = likedArtworks.has(artwork.id)

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) scale(0.98) } to { opacity: 1; transform: translateY(0) scale(1) } }
      `}</style>
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: '20px',
          width: '100%',
          maxWidth: '900px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 80px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div
          style={{
            padding: '16px 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#1A1A1A' }}>{artwork.title}</h2>
            <p style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>
              {artwork.author} · {formatDate(artwork.createdAt)}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isOwner && onDelete && (
              <button
                onClick={() => onDelete(artwork.id)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  color: '#EF4444',
                  fontSize: '13px',
                  fontWeight: 500,
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                删除作品
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '20px',
                color: '#666',
                transition: 'all 0.2s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = '#f5f5f5'
                e.currentTarget.style.color = '#1A1A1A'
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent'
                e.currentTarget.style.color = '#666'
              }}
            >
              ✕
            </button>
          </div>
        </div>

        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '24px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxHeight: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'linear-gradient(135deg, #fafafa, #f0f0f0)',
              borderRadius: '16px',
              padding: '24px',
              marginBottom: '20px',
            }}
          >
            <img
              src={artwork.imageData}
              alt={artwork.title}
              style={{
                maxWidth: '100%',
                maxHeight: '350px',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
              }}
            />
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '20px',
              padding: '16px 20px',
              background: 'rgba(99, 102, 241, 0.04)',
              borderRadius: '12px',
            }}
          >
            <p style={{ color: '#333', fontSize: '14px', lineHeight: 1.8, flex: 1, marginRight: '20px' }}>
              {artwork.description || '作者暂未填写作品描述。'}
            </p>
            <button
              onClick={handleLikeArtwork}
              disabled={isArtworkLiked}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 18px',
                borderRadius: '100px',
                background: isArtworkLiked ? '#EF4444' : '#fff',
                color: isArtworkLiked ? '#fff' : '#EF4444',
                border: isArtworkLiked ? 'none' : '1px solid rgba(239,68,68,0.3)',
                fontSize: '14px',
                fontWeight: 500,
                transition: 'all 0.2s',
                cursor: isArtworkLiked ? 'default' : 'pointer',
                opacity: isArtworkLiked ? 1 : 1,
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={e => {
                if (!isArtworkLiked) {
                  e.currentTarget.style.background = 'rgba(239,68,68,0.05)'
                }
              }}
              onMouseLeave={e => {
                if (!isArtworkLiked) {
                  e.currentTarget.style.background = '#fff'
                }
              }}
            >
              <span style={{ fontSize: '16px' }}>{isArtworkLiked ? '❤️' : '🤍'}</span>
              <span>{artwork.likes}</span>
            </button>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '14px', color: '#1A1A1A' }}>
              观众留言 <span style={{ color: '#999', fontWeight: 400, fontSize: '14px' }}>({artworkComments.length})</span>
            </h3>

            <form onSubmit={handleSubmitComment} style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative' }}>
                <textarea
                  value={newComment}
                  onChange={e => setNewComment(e.target.value.slice(0, 200))}
                  placeholder="写下你的感想..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '14px 16px',
                    paddingRight: '70px',
                    borderRadius: '12px',
                    border: '1px solid #e5e5e5',
                    fontSize: '14px',
                    resize: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s',
                    background: '#fafafa',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.borderColor = '#6366F1'
                    e.currentTarget.style.background = '#fff'
                  }}
                  onBlur={e => {
                    e.currentTarget.style.borderColor = '#e5e5e5'
                    e.currentTarget.style.background = '#fafafa'
                  }}
                />
                <span
                  style={{
                    position: 'absolute',
                    right: '14px',
                    bottom: '14px',
                    fontSize: '12px',
                    color: newComment.length > 180 ? '#EF4444' : '#bbb',
                    fontWeight: 500,
                  }}
                >
                  {newComment.length}/200
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="submit"
                  disabled={!newComment.trim() || newComment.length > 200 || submitting}
                  style={{
                    padding: '10px 24px',
                    borderRadius: '100px',
                    background: newComment.trim() && newComment.length <= 200 && !submitting ? '#6366F1' : '#ccc',
                    color: '#fff',
                    fontSize: '14px',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    cursor: newComment.trim() && newComment.length <= 200 && !submitting ? 'pointer' : 'not-allowed',
                  }}
                  onMouseEnter={e => {
                    if (newComment.trim() && newComment.length <= 200 && !submitting) {
                      e.currentTarget.style.background = '#5558E8'
                    }
                  }}
                  onMouseLeave={e => {
                    if (newComment.trim() && newComment.length <= 200 && !submitting) {
                      e.currentTarget.style.background = '#6366F1'
                    }
                  }}
                >
                  发表
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {artworkComments.length === 0 ? (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '40px 20px',
                    color: '#aaa',
                    fontSize: '14px',
                    background: '#fafafa',
                    borderRadius: '12px',
                  }}
                >
                  还没有留言，来做第一个吧 ✨
                </div>
              ) : (
                artworkComments.map(comment => {
                  const isCommentLiked = likedComments.has(comment.id)
                  return (
                    <div
                      key={comment.id}
                      style={{
                        padding: '16px 18px',
                        background: '#fafafa',
                        borderRadius: '14px',
                        transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => e.currentTarget.style.background = '#f5f5f7'}
                      onMouseLeave={e => e.currentTarget.style.background = '#fafafa'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div
                            style={{
                              width: '32px',
                              height: '32px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #6366F1, #EC4899)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#fff',
                              fontWeight: 600,
                              fontSize: '13px',
                            }}
                          >
                            {comment.username[0]?.toUpperCase() || '?'}
                          </div>
                          <span style={{ fontSize: '14px', fontWeight: 500, color: '#333' }}>{comment.username}</span>
                          <span style={{ fontSize: '12px', color: '#aaa' }}>{formatDate(comment.createdAt)}</span>
                        </div>
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          disabled={isCommentLiked}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '4px 10px',
                            borderRadius: '100px',
                            background: isCommentLiked ? 'rgba(239,68,68,0.1)' : 'transparent',
                            color: isCommentLiked ? '#EF4444' : '#888',
                            fontSize: '13px',
                            transition: 'all 0.15s',
                            cursor: isCommentLiked ? 'default' : 'pointer',
                          }}
                          onMouseEnter={e => {
                            if (!isCommentLiked) e.currentTarget.style.background = 'rgba(0,0,0,0.04)'
                          }}
                          onMouseLeave={e => {
                            if (!isCommentLiked) e.currentTarget.style.background = 'transparent'
                          }}
                        >
                          <span>{isCommentLiked ? '❤️' : '🤍'}</span>
                          <span>{comment.likes}</span>
                        </button>
                      </div>
                      <p style={{ fontSize: '14px', color: '#444', lineHeight: 1.7, paddingLeft: '42px' }}>
                        {comment.content}
                      </p>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
