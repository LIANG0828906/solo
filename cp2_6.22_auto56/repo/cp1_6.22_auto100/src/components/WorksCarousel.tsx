import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Work } from '../types';
import { recordAction } from '../api';

interface WorksCarouselProps {
  works: Work[];
}

const tagColorMap: Record<string, string> = {
  tech: 'rgba(79, 139, 249, 0.25)',
  design: 'rgba(155, 89, 182, 0.25)',
  illustration: 'rgba(233, 69, 96, 0.25)'
};

const WorksCarousel: React.FC<WorksCarouselProps> = ({ works }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const timerRef = useRef<number | null>(null);

  const displayWorks = works.slice(0, 3);

  const goTo = useCallback((index: number) => {
    if (displayWorks.length === 0 || isAnimating) return;
    setIsAnimating(true);
    setCurrentIndex(((index % displayWorks.length) + displayWorks.length) % displayWorks.length);
    setTimeout(() => setIsAnimating(false), 400);
  }, [displayWorks.length, isAnimating]);

  const next = useCallback(() => {
    goTo(currentIndex + 1);
  }, [currentIndex, goTo]);

  const prev = useCallback(() => {
    goTo(currentIndex - 1);
  }, [currentIndex, goTo]);

  useEffect(() => {
    if (displayWorks.length <= 1) return;
    timerRef.current = window.setInterval(() => {
      setCurrentIndex(prev => (prev + 1) % displayWorks.length);
      setIsAnimating(true);
      setTimeout(() => setIsAnimating(false), 400);
    }, 5000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [displayWorks.length]);

  useEffect(() => {
    setCurrentIndex(0);
  }, [works]);

  const handleCardClick = async (work: Work) => {
    await recordAction(work.id, 'click');
  };

  if (displayWorks.length === 0) {
    return (
      <div style={styles.container}>
        <div style={styles.empty}>暂无推荐作品</div>
      </div>
    );
  }

  const currentWork = displayWorks[currentIndex];

  return (
    <div style={styles.container}>
      <div style={styles.viewport}>
        <div
          onClick={() => handleCardClick(currentWork)}
          style={{
            ...styles.card,
            opacity: isAnimating ? 0.4 : 1,
            transform: isAnimating ? 'scale(0.92)' : 'scale(1)',
            backgroundImage: `linear-gradient(to bottom, rgba(22, 33, 62, 0.3), rgba(22, 33, 62, 0.95)), url(${currentWork.coverUrl})`
          }}
        >
          <div style={styles.cardOverlay}>
            <div style={styles.scoreBadge}>
              🔥 {currentWork.score.toFixed(1)} 分
            </div>
            <h2 style={styles.title}>{currentWork.title}</h2>
            <p style={styles.description}>{currentWork.description}</p>
            <div style={styles.tagsRow}>
              {currentWork.tags.map(tag => (
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
        </div>

        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          style={styles.navBtn}
          aria-label="上一个"
        >
          ‹
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          style={{ ...styles.navBtn, right: 16, left: 'auto' }}
          aria-label="下一个"
        >
          ›
        </button>
      </div>

      <div style={styles.dotsRow}>
        {displayWorks.map((_, idx) => (
          <button
            key={idx}
            onClick={() => goTo(idx)}
            style={{
              ...styles.dot,
              backgroundColor: idx === currentIndex ? '#e94560' : 'rgba(224, 224, 224, 0.3)',
              transform: idx === currentIndex ? 'scale(1.3)' : 'scale(1)'
            }}
            aria-label={`跳转到第${idx + 1}个`}
          />
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: '100%',
    userSelect: 'none'
  },
  empty: {
    color: '#e0e0e0',
    textAlign: 'center',
    padding: '80px 20px',
    fontSize: 18
  },
  viewport: {
    position: 'relative',
    width: '100%',
    height: 420,
    borderRadius: 16,
    overflow: 'hidden',
    cursor: 'pointer',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4)'
  },
  card: {
    position: 'absolute',
    inset: 0,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
    display: 'flex',
    alignItems: 'flex-end'
  },
  cardOverlay: {
    width: '100%',
    padding: '40px 48px',
    color: '#e0e0e0'
  },
  scoreBadge: {
    display: 'inline-block',
    padding: '6px 14px',
    borderRadius: 20,
    backgroundColor: 'rgba(233, 69, 96, 0.85)',
    color: '#fff',
    fontSize: 14,
    fontWeight: 600,
    marginBottom: 14
  },
  title: {
    fontSize: 32,
    fontWeight: 700,
    margin: '0 0 12px 0',
    color: '#fff',
    textShadow: '0 2px 8px rgba(0,0,0,0.5)'
  },
  description: {
    fontSize: 15,
    lineHeight: 1.6,
    margin: '0 0 18px 0',
    color: 'rgba(224, 224, 224, 0.9)',
    maxWidth: 640
  },
  tagsRow: {
    display: 'flex',
    gap: 10,
    flexWrap: 'wrap'
  },
  tag: {
    padding: '5px 14px',
    borderRadius: 16,
    fontSize: 13,
    fontWeight: 500,
    color: '#e0e0e0',
    backdropFilter: 'blur(8px)'
  },
  navBtn: {
    position: 'absolute',
    top: '50%',
    transform: 'translateY(-50%)',
    left: 16,
    width: 44,
    height: 44,
    borderRadius: '50%',
    border: 'none',
    backgroundColor: 'rgba(26, 26, 46, 0.7)',
    color: '#e0e0e0',
    fontSize: 28,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background-color 0.2s ease-out, transform 0.2s ease-out',
    zIndex: 10,
    padding: 0,
    lineHeight: 1
  },
  dotsRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: 10,
    marginTop: 20
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: '50%',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    transition: 'background-color 0.2s ease-out, transform 0.2s ease-out'
  }
};

export default WorksCarousel;
