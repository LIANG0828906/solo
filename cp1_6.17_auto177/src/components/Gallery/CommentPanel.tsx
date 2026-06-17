import React, { useState, useEffect, useRef } from 'react'
import { X, Send } from 'lucide-react'
import { useGalleryStore } from '../../store/galleryStore'
import { formatRelativeTime } from '../../GalleryManager'
import { PAPER_CONFIGS } from '../../types'
import styles from '../../styles/gallery.module.css'

export const CommentPanel: React.FC = () => {
  const panelId = useGalleryStore((s) => s.commentPanelId)
  const close = useGalleryStore((s) => s.closeCommentPanel)
  const list = useGalleryStore((s) => s.artworks)
  const add = useGalleryStore((s) => s.addComment)
  const art = list.find((a) => a.id === panelId)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (panelId) setTimeout(() => inputRef.current?.focus(), 100)
  }, [panelId])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && panelId) close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [panelId, close])

  if (!panelId || !art) return null

  const submit = () => {
    const v = text.trim()
    if (!v) return
    add(art.id, v)
    setText('')
  }

  return (
    <div className={styles.panelOverlay} onClick={(e) => { if (e.target === e.currentTarget) close() }}>
      <aside className={styles.commentPanel}>
        <div className={styles.panelHeader}>
          <h3 className={styles.panelTitle}>
            评论 · {art.title}
            <span style={{ fontSize: 11, color: '#6C757D', marginLeft: 6, fontWeight: 400 }}>
              {PAPER_CONFIGS[art.paperType].name}
            </span>
          </h3>
          <button className={styles.panelClose} onClick={close} title="关闭 (Esc)">
            <X size={18} />
          </button>
        </div>
        <div className={styles.panelContent}>
          {art.comments.length === 0 && (
            <div className={styles.empty}>还没有评论，来留下第一条吧 ✨</div>
          )}
          {art.comments.slice().reverse().map((c) => (
            <div key={c.id} className={styles.commentItem}>
              <div className={styles.commentAvatar}>{c.avatar}</div>
              <div className={styles.commentBody}>
                <div className={styles.commentMeta}>
                  <span className={styles.commentName}>{c.author}</span>
                  <span className={styles.commentTime}>{formatRelativeTime(c.timestamp)}</span>
                </div>
                <p className={styles.commentText}>{c.content}</p>
              </div>
            </div>
          ))}
        </div>
        <div className={styles.panelFooter}>
          <input
            ref={inputRef}
            className={styles.commentInput}
            placeholder="写下你的感受…（回车发送）"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
          />
          <button
            onClick={submit}
            title="发送"
            style={{
              position: 'absolute',
              right: 16,
              bottom: 22,
              width: 28,
              height: 28,
              borderRadius: '50%',
              background: text.trim() ? '#4A90D9' : 'rgba(26,26,46,0.08)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all .15s ease',
              cursor: text.trim() ? 'pointer' : 'not-allowed',
              zIndex: 2,
            }}
          >
            <Send size={13} />
          </button>
        </div>
      </aside>
    </div>
  )
}
