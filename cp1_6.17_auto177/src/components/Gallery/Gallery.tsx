import React, { useEffect } from 'react'
import { Palette } from 'lucide-react'
import { useGalleryStore } from '../../store/galleryStore'
import { ArtworkCard } from './ArtworkCard'
import { CommentPanel } from './CommentPanel'
import styles from '../../styles/gallery.module.css'
import { eventBus } from '../../EventBus'

export const GalleryPage: React.FC = () => {
  const works = useGalleryStore((s) => s.artworks)
  const refresh = useGalleryStore((s) => s.refresh)

  useEffect(() => {
    const handler = () => refresh()
    eventBus.on('save', handler)
    eventBus.on('delete', handler)
    eventBus.on('like', handler)
    return () => {
      eventBus.off('save', handler)
      eventBus.off('delete', handler)
      eventBus.off('like', handler)
    }
  }, [refresh])

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.titleWrap}>
          <h1>线上画廊</h1>
          <p>浏览水彩社区的创作灵感，为喜欢的作品点赞或留言</p>
        </div>
        <div className={styles.countBadge}>
          <Palette size={14} style={{ marginRight: 6, verticalAlign: -2 }} />
          共 {works.length} 幅作品
        </div>
      </header>

      <main className={styles.masonry}>
        {works.map((w, i) => (
          <ArtworkCard key={w.id} artwork={w} index={i} />
        ))}
      </main>

      <CommentPanel />
    </div>
  )
}
