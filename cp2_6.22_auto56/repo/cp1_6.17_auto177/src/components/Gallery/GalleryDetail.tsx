import React, { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Heart, MessageCircle, Send, User } from 'lucide-react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGalleryStore } from '../../store/galleryStore'
import { galleryManager, formatRelativeTime } from '../../GalleryManager'
import { PAPER_CONFIGS } from '../../types'
import styles from '../../styles/gallery.module.css'

export const GalleryDetail: React.FC = () => {
  const { id = '' } = useParams()
  const nav = useNavigate()
  const store = useGalleryStore()
  const art = store.artworks.find((a) => a.id === id) || galleryManager.getById(id)
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const [likeAnim, setLikeAnim] = useState(false)

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [id])

  if (!art) {
    return (
      <div className={styles.detailPage}>
        <button className={styles.backBtn} onClick={() => nav('/gallery')}>
          <ArrowLeft size={14} /> 返回画廊
        </button>
        <div className={styles.empty} style={{ marginTop: 80 }}>
          作品不存在或已被删除
        </div>
      </div>
    )
  }

  const submit = () => {
    const v = text.trim()
    if (!v) return
    store.addComment(art.id, v)
    setText('')
    inputRef.current?.blur()
  }

  const triggerLike = () => {
    store.like(art.id)
    setLikeAnim(true)
    setTimeout(() => setLikeAnim(false), 400)
  }

  const liked = art.isLiked

  return (
    <div className={styles.detailPage}>
      <button className={styles.backBtn} onClick={() => nav('/gallery')}>
        <ArrowLeft size={14} /> 返回画廊
      </button>

      <div className={styles.detailGrid}>
        <section className={styles.detailArtwork}>
          <img
            src={art.fullImage}
            alt={art.title}
            className={styles.detailImg}
            style={{ filter: PAPER_CONFIGS[art.paperType].filter }}
          />
        </section>

        <aside className={styles.detailSide}>
          <div className={styles.detailSideHeader}>
            <h2>{art.title}</h2>
            <div className={styles.detailMeta}>
              <span className={styles.commentAvatar} style={{ width: 28, height: 28, fontSize: 14 }}>
                <User size={14} />
              </span>
              <span style={{ color: '#1A1A2E', fontWeight: 600 }}>{art.author}</span>
              <span>·</span>
              <span>{formatRelativeTime(art.createdAt)}</span>
            </div>
          </div>

          <div className={styles.detailStats}>
            <button
              className={styles.detailStat}
              onClick={triggerLike}
              style={{
                color: liked ? 'var(--color-like)' : '#1A1A2E',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '4px 8px',
                borderRadius: 6,
                transition: 'all .15s',
              }}
            >
              <Heart
                size={16}
                style={{
                  fill: liked ? 'currentColor' : 'none',
                  animation: likeAnim ? 'popIn 0.4s ease-out' : undefined,
                }}
              />
              <span>{art.likes}</span>
            </button>
            <div className={styles.detailStat}>
              <MessageCircle size={16} />
              <span>{art.comments.length}</span>
            </div>
            <div className={styles.detailStat} style={{ marginLeft: 'auto', color: '#6C757D' }}>
              {PAPER_CONFIGS[art.paperType].name}纸
            </div>
          </div>

          <div className={styles.detailComments}>
            {art.comments.length === 0 && (
              <div className={styles.empty}>还没有评论，来成为第一个吧 ✨</div>
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
              placeholder="说说你的感受…（回车发送）"
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') submit() }}
            />
            <button
              onClick={submit}
              title="发送"
              style={{
                position: 'absolute',
                right: 24,
                bottom: 22,
                width: 30,
                height: 30,
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
              <Send size={14} />
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
