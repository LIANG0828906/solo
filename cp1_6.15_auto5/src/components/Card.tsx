import { useState, useEffect, useRef } from 'react';
import AnnotationPanel from './AnnotationPanel';
import type { RecipeCard, User, Annotation } from '../types';
import styles from './Card.module.css';

interface CardProps {
  card: RecipeCard;
  user: User;
  onAnnotationAdd: (cardId: string, annotation: Annotation) => void;
  isDragging: boolean;
}

function Card({ card, user, onAnnotationAdd, isDragging }: CardProps) {
  const [showAnnotations, setShowAnnotations] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showReleaseBounce, setShowReleaseBounce] = useState(false);
  const wasDragging = useRef(false);

  useEffect(() => {
    if (wasDragging.current && !isDragging) {
      setShowReleaseBounce(true);
      const timer = setTimeout(() => setShowReleaseBounce(false), 600);
      return () => clearTimeout(timer);
    }
    wasDragging.current = isDragging;
  }, [isDragging]);

  const handleAnnotationAdd = (annotation: Annotation) => {
    onAnnotationAdd(card.id, annotation);
  };

  const getPlaceholderImage = () => {
    return `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=${encodeURIComponent(card.title + ' food photography')}&image_size=square_hd`;
  };

  return (
    <div
      className={`${styles.card} ${isDragging ? styles.cardDragging : ''} ${showReleaseBounce ? styles.releaseBounce : ''}`}
    >
      <div
        className={styles.cardInner}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('[data-no-toggle]')) return;
          setShowAnnotations(!showAnnotations);
        }}
      >
        <div className={styles.imageContainer}>
          <img
            src={imageError ? getPlaceholderImage() : card.coverImage}
            alt={card.title}
            className={styles.coverImage}
            loading="lazy"
            onError={() => setImageError(true)}
          />
          <div className={styles.tag}>{card.cuisine}</div>
          {card.annotations.length > 0 && (
            <div className={styles.annotationBadge}>
              💬 {card.annotations.length}
            </div>
          )}
        </div>

        <div className={styles.cardContent}>
          <h3 className={styles.cardTitle}>{card.title}</h3>
          <p className={styles.cardHint}>
            {showAnnotations ? '点击收起批注' : '点击查看/添加批注'}
          </p>
        </div>
      </div>

      {showAnnotations && (
        <div className={styles.annotationContainer}>
          <AnnotationPanel
            annotations={card.annotations}
            user={user}
            onAdd={handleAnnotationAdd}
          />
        </div>
      )}
    </div>
  );
}

export default Card;
