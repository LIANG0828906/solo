import React from 'react'
import { Heart, MessageCircle, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { Artwork } from '../../types'
import { PAPER_CONFIGS } from '../../types'
import { useGalleryStore } from '../../store/galleryStore'
import styles from '../../styles/gallery.module.css'

interface Props {
  artwork: Artwork
  index: number
}

export const ArtworkCard: React.FC<Props> = ({ artwork, index }) => {
  const nav = useNavigate()
  const like = useGalleryStore((s) => s.like)
  const openPanel = useGalleryStore((s) => s.openCommentPanel)
  const delay = `${(index % 12) * 0.04}s`

  const goDetail = () => nav(`/gallery/${artwork.id}`)

  return (
    <article className={styles.card} style={{ animationDelay: delay }}>
      <div className={styles.thumbWrap} onClick={goDetail}>
        <img
          className={styles.thumb}
          src={artwork.thumbnail}
          alt={artwork.title}
          loading="lazy"
        />
        <div
          className={styles.thumbPaper}
          style={{ filter: PAPER_CONFIGS[artwork.paperType].filter }}
        />
      </div>
      <div className={styles.cardBody}>
        <div className={styles.titleRow}>
          <h3 className={styles.title} onClick={goDetail} title={artwork.title}>
            {artwork.title}
          </h3>
        </div>
        <div className={styles.author}>
          <span className={styles.avatar}>
            <User size={12} />
          </span>
          <span>{artwork.author}</span>
        </div>
        <div className={styles.actions}>
          <button
            className={`${styles.actionBtn} ${styles.likeBtn} ${artwork.isLiked ? styles.liked : ''}`}
            onClick={(e) => { e.stopPropagation(); like(artwork.id) }}
            title={artwork.isLiked ? '取消点赞' : '点赞'}
          >
            <Heart size={15} />
            <span>{artwork.likes}</span>
          </button>
          <button
            className={styles.actionBtn}
            onClick={(e) => { e.stopPropagation(); openPanel(artwork.id) }}
            title="评论"
          >
            <MessageCircle size={15} />
            <span>{artwork.comments.length}</span>
          </button>
        </div>
      </div>
    </article>
  )
}
