import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Photo } from '@/types';
import { formatDate } from '@/utils/helpers';
import styles from './PhotoCard.module.css';

interface Props {
  photo: Photo;
  index?: number;
  onDelete?: (id: string) => void;
}

export default function PhotoCard({ photo, index = 0, onDelete }: Props) {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);
  const delay = Math.min(index * 40, 480);

  const handleClick = () => navigate(`/photo/${photo.id}`);

  return (
    <div
      className={styles.card}
      style={{ animationDelay: `${delay}ms` }}
      onClick={handleClick}
    >
      <div className={styles.imageWrap}>
        {!loaded && <div className={`${styles.skeleton} skeleton`} />}
        <img
          src={photo.thumbnailUrl}
          alt={photo.title}
          loading="lazy"
          className={`${styles.image} ${loaded ? styles.visible : ''}`}
          onLoad={() => setLoaded(true)}
          draggable={false}
        />
        <div className={styles.overlay}>
          <div className={styles.meta}>
            <h4 className={styles.title}>{photo.title}</h4>
            <div className={styles.date}>{formatDate(photo.captureDate)}</div>
            <div className={styles.tags}>
              {photo.tags.slice(0, 3).map((t) => (
                <span key={t} className="tag">{t}</span>
              ))}
            </div>
          </div>
        </div>
        {onDelete && (
          <button
            className={styles.deleteBtn}
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`确认删除作品 "${photo.title}" ?`)) onDelete(photo.id);
            }}
            title="删除"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}
