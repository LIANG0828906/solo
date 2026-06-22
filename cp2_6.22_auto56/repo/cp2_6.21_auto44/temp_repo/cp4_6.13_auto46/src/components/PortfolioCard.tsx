import { useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import type { Portfolio } from '@/types';
import { Eye, Trash2, Share2, Download } from 'lucide-react';
import styles from './PortfolioCard.module.css';

interface Props {
  portfolio: Portfolio;
  index?: number;
  onPreview: (p: Portfolio) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onExport: (id: string) => void;
  onShare: (id: string) => void;
}

export default function PortfolioCard({
  portfolio,
  index = 0,
  onPreview,
  onEdit,
  onDelete,
  onExport,
  onShare,
}: Props) {
  const photos = useAppStore((s) => s.photos);
  const [loadedCover, setLoadedCover] = useState(false);
  const [loadedThumbs, setLoadedThumbs] = useState<boolean[]>([]);

  const coverPhoto = portfolio.coverImageId
    ? photos.find((p) => p.id === portfolio.coverImageId)
    : photos.find((p) => portfolio.items[0]?.photoId === p.id) || null;
  const thumbPhotos = portfolio.items
    .slice(0, 3)
    .map((it) => photos.find((p) => p.id === it.photoId))
    .filter(Boolean);
  const delay = Math.min(index * 60, 500);

  return (
    <article
      className={styles.card}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className={styles.grid}>
        <div
          className={`${styles.cover} ${coverPhoto ? '' : styles.noImg}`}
          style={{ backgroundColor: portfolio.coverColor }}
        >
          {coverPhoto && (
            <>
              {!loadedCover && <div className={`${styles.coverSkel} skeleton`} />}
              <img
                src={coverPhoto.thumbnailUrl}
                alt={portfolio.title}
                className={`${styles.coverImg} ${loadedCover ? styles.show : ''}`}
                onLoad={() => setLoadedCover(true)}
                draggable={false}
              />
            </>
          )}
          <div className={styles.coverLabel}>
            <span className={styles.badge}>封面</span>
          </div>
          <div className={styles.hoverMask}>
            <button
              className={styles.previewBtn}
              onClick={() => onPreview(portfolio)}
            >
              <Eye size={18} />
              预览
            </button>
          </div>
        </div>

        <div className={styles.thumbs}>
          {thumbPhotos.length === 0 ? (
            <div className={styles.emptyThumbs}>
              <span>作品集为空</span>
            </div>
          ) : (
            thumbPhotos.map((p, i) => (
              <div key={i} className={styles.thumb}>
                {!loadedThumbs[i] && <div className={`${styles.thumbSkel} skeleton`} />}
                <img
                  src={p!.thumbnailUrl}
                  alt=""
                  className={`${styles.thumbImg} ${loadedThumbs[i] ? styles.show : ''}`}
                  onLoad={() =>
                    setLoadedThumbs((prev) => {
                      const next = [...prev];
                      next[i] = true;
                      return next;
                    })
                  }
                  draggable={false}
                />
              </div>
            ))
          )}
          {Array.from({ length: Math.max(0, 3 - thumbPhotos.length) }).map((_, i) => (
            <div key={`ph-${i}`} className={styles.thumb} style={{ backgroundColor: portfolio.coverColor, opacity: 0.5 }} />
          ))}
        </div>
      </div>

      <div className={styles.footer}>
        <div className={styles.info}>
          <h3 className={styles.title} onClick={() => onEdit(portfolio.id)}>
            {portfolio.title}
          </h3>
          <div className={styles.meta}>
            {portfolio.items.length} 张作品 · 每页 {portfolio.layoutPerPage} 张
          </div>
        </div>
        <div className={styles.toolBtns}>
          <button
            className={styles.toolBtn}
            title="生成分享链接"
            onClick={() => onShare(portfolio.id)}
          >
            <Share2 size={14} />
          </button>
          <button
            className={styles.toolBtn}
            title="导出 HTML"
            onClick={() => onExport(portfolio.id)}
          >
            <Download size={14} />
          </button>
          <button
            className={styles.toolBtn}
            title="删除"
            onClick={() => {
              if (confirm(`确认删除作品集 "${portfolio.title}"?`)) onDelete(portfolio.id);
            }}
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}
