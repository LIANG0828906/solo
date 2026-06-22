import React, { useState, useEffect, useRef } from 'react';
import type { Work } from '../types';
import { recordAction } from '../api';

interface WorksListProps {
  works: Work[];
  favorites: Set<string>;
  onFavoriteChange?: () => void;
}

const tagColorMap: Record<string, string> = {
  tech: 'rgba(79, 139, 249, 0.25)',
  design: 'rgba(155, 89, 182, 0.25)',
  illustration: 'rgba(233, 69, 96, 0.25)'
};

const HeartIcon: React.FC<{ filled: boolean; animating: 'pop' | 'shrink' | null }> = ({ filled, animating }) => {
  let transform = 'scale(1)';
  if (animating === 'pop') transform = 'scale(1.25)';
  else if (animating === 'shrink') transform = 'scale(0.8)';

  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill={filled ? '#e94560' : 'none'}
      stroke={filled ? '#e94560' : '#9e9e9e'}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{
        transition: 'fill 0.2s ease-out, stroke 0.2s ease-out, transform 0.2s ease-out',
        transform,
        display: 'block'
      }}
    >
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
};

interface WorkCardProps {
  work: Work;
  isFavorited: boolean;
  onFavoriteToggle: (workId: string) => void;
}

const WorkCard: React.FC<WorkCardProps> = ({ work, isFavorited, onFavoriteToggle }) => {
  const [hovered, setHovered] = useState(false);
  const [heartAnim, setHeartAnim] = useState<'pop' | 'shrink' | null>(null);
  const hoverTimerRef = useRef<number | null>(null);
  const viewRecordedRef = useRef(false);

  useEffect(() => {
    viewRecordedRef.current = false;
  }, [work.id]);

  const handleMouseEnter = () => {
    setHovered(true);
    viewRecordedRef.current = false;
    hoverTimerRef.current = window.setTimeout(() => {
      if (!viewRecordedRef.current) {
        viewRecordedRef.current = true;
        recordAction(work.id, 'view', 3000);
      }
    }, 3000);
  };

  const handleMouseLeave = () => {
    setHovered(false);
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current);
      hoverTimerRef.current = null;
    }
  };

  const handleClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-fav-btn]')) return;
    recordAction(work.id, 'click');
  };

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFavorited) {
      setHeartAnim('shrink');
      setTimeout(() => setHeartAnim(null), 200);
      recordAction(work.id, 'unfavorite');
    } else {
      setHeartAnim('pop');
      setTimeout(() => setHeartAnim(null), 200);
      recordAction(work.id, 'favorite');
    }
    onFavoriteToggle(work.id);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        ...styles.card,
        transform: hovered ? 'translateY(-8px)' : 'translateY(0)',
        boxShadow: hovered
          ? '0 20px 40px rgba(0, 0, 0, 0.5)'
          : '0 4px 16px rgba(0, 0, 0, 0.25)',
        cursor: 'pointer'
      }}
    >
      <div style={styles.coverWrap}>
        <img src={work.coverUrl} alt={work.title} style={styles.cover} loading="lazy" />
        <div
          style={{
            ...styles.descOverlay,
            opacity: hovered ? 1 : 0,
            transform: hovered ? 'translateY(0)' : 'translateY(10px)',
            pointerEvents: hovered ? 'auto' : 'none'
          }}
        >
          <p style={styles.descText}>{work.description}</p>
        </div>
      </div>

      <div style={styles.cardBody}>
        <div style={styles.titleRow}>
          <h3 style={styles.cardTitle}>{work.title}</h3>
          <span style={styles.scoreChip}>
            ⚡ {work.score.toFixed(1)}
          </span>
        </div>
        <div style={styles.tagsRow}>
          {work.tags.map(tag => (
            <span
              key={tag.name}
              style={{
                ...styles.tag,
                backgroundColor: tagColorMap[tag.category]
              }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      </div>

      <button
        data-fav-btn
        onClick={handleFavoriteClick}
        style={styles.favBtn}
        aria-label={isFavorited ? '取消收藏' : '收藏'}
      >
        <HeartIcon filled={isFavorited} animating={heartAnim} />
      </button>
    </div>
  );
};

const WorksList: React.FC<WorksListProps> = ({ works, favorites, onFavoriteChange }) => {
  const handleFavoriteToggle = () => {
    if (onFavoriteChange) onFavoriteChange();
  };

  return (
    <div style={styles.grid}>
      {works.map(work => (
        <WorkCard
          key={work.id}
          work={work}
          isFavorited={favorites.has(work.id)}
          onFavoriteToggle={handleFavoriteToggle}
        />
      ))}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: 24,
    width: '100%'
  },
  card: {
    position: 'relative',
    backgroundColor: '#16213e',
    borderRadius: 12,
    overflow: 'hidden',
    transition: 'transform 0.2s ease-out, box-shadow 0.2s ease-out',
    display: 'flex',
    flexDirection: 'column'
  },
  coverWrap: {
    position: 'relative',
    width: '100%',
    paddingTop: '60%',
    overflow: 'hidden',
    backgroundColor: '#0f1529'
  },
  cover: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block'
  },
  descOverlay: {
    position: 'absolute',
    inset: 0,
    background: 'rgba(22, 33, 62, 0.75)',
    backdropFilter: 'blur(10px)',
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    transition: 'opacity 0.3s ease-out, transform 0.3s ease-out'
  },
  descText: {
    color: '#e0e0e0',
    fontSize: 14,
    lineHeight: 1.65,
    margin: 0
  },
  cardBody: {
    padding: '18px 20px 20px',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    gap: 12
  },
  titleRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12
  },
  cardTitle: {
    margin: 0,
    fontSize: 17,
    fontWeight: 600,
    color: '#e0e0e0',
    lineHeight: 1.4,
    flex: 1
  },
  scoreChip: {
    padding: '3px 10px',
    borderRadius: 12,
    backgroundColor: 'rgba(233, 69, 96, 0.18)',
    color: '#ff7d93',
    fontSize: 12,
    fontWeight: 600,
    whiteSpace: 'nowrap'
  },
  tagsRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: 8
  },
  tag: {
    padding: '4px 12px',
    borderRadius: 12,
    fontSize: 12,
    fontWeight: 500,
    color: '#e0e0e0'
  },
  favBtn: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    width: 40,
    height: 40,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(22, 33, 62, 0.9)',
    backdropFilter: 'blur(4px)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 5,
    transition: 'background-color 0.2s ease-out',
    padding: 0
  }
};

export default WorksList;
